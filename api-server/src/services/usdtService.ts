import axios from 'axios';
import { db } from '../db';
import { orders, usdtPayments, users } from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { deliverUsdtOrder } from '../bot';

const TRONGRID_BASE = 'https://api.trongrid.io';
const USDT_CONTRACT_TRC20 = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT TRC20 contract
const CONFIRMATION_THRESHOLD = 19; // TRC20 confirmations needed

// ── Generate Payment Address ──────────────────────────────────────────────────
// In production, generate unique per-order addresses using HD wallet derivation
// For this implementation, we use the master wallet and match by amount+memo

export function getUsdtWalletAddress(): string {
  return process.env.USDT_WALLET_ADDRESS || '';
}

// ── Create USDT Payment Record ────────────────────────────────────────────────

export async function createUsdtPayment(orderId: number, expectedUsdt: number): Promise<{
  walletAddress: string;
  expectedAmount: string;
  expiresAt: Date;
}> {
  const walletAddress = getUsdtWalletAddress();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min expiry

  // Add small uniqueness amount (e.g., 0.001 * orderId) to differentiate orders
  const uniqueAmount = (expectedUsdt + orderId * 0.000001).toFixed(6);

  const [payment] = await db
    .insert(usdtPayments)
    .values({
      orderId,
      walletAddress,
      expectedAmount: uniqueAmount,
      expiresAt,
    })
    .returning();

  // Update order with wallet info
  await db
    .update(orders)
    .set({
      usdtWalletAddress: walletAddress,
      usdtExpectedAmount: uniqueAmount,
    })
    .where(eq(orders.id, orderId));

  return {
    walletAddress,
    expectedAmount: uniqueAmount,
    expiresAt,
  };
}

// ── Check TronGrid for USDT Transaction ──────────────────────────────────────

export async function checkTrc20Transaction(
  walletAddress: string,
  expectedAmount: string,
  afterTimestamp: number
): Promise<{ found: boolean; txHash?: string; amount?: string }> {
  try {
    const apiKey = process.env.TRONGRID_API_KEY;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) headers['TRON-PRO-API-KEY'] = apiKey;

    const response = await axios.get(
      `${TRONGRID_BASE}/v1/accounts/${walletAddress}/transactions/trc20`,
      {
        params: {
          limit: 20,
          contract_address: USDT_CONTRACT_TRC20,
          min_timestamp: afterTimestamp,
          only_confirmed: true,
        },
        headers,
        timeout: 10000,
      }
    );

    const transactions = response.data?.data || [];
    const expected = parseFloat(expectedAmount);

    for (const tx of transactions) {
      if (tx.to !== walletAddress) continue;
      if (tx.token_info?.symbol !== 'USDT') continue;

      // TRC20 amount is in smallest unit (6 decimals for USDT)
      const receivedAmount = parseFloat(tx.value) / 1_000_000;
      const diff = Math.abs(receivedAmount - expected);

      // Allow 0.001 tolerance
      if (diff <= 0.001) {
        return {
          found: true,
          txHash: tx.transaction_id,
          amount: receivedAmount.toFixed(6),
        };
      }
    }

    return { found: false };
  } catch (err) {
    console.error('[USDT] TronGrid check error:', err);
    return { found: false };
  }
}

// ── Monitor Pending USDT Payments ─────────────────────────────────────────────

export async function monitorUsdtPayments(): Promise<void> {
  try {
    // Get pending USDT payments that haven't expired
    const pending = await db
      .select({
        payment: usdtPayments,
        order: orders,
        user: users,
      })
      .from(usdtPayments)
      .innerJoin(orders, eq(usdtPayments.orderId, orders.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .where(
        and(
          eq(orders.status, 'pending'),
          eq(orders.paymentMethod, 'usdt_trc20')
        )
      );

    for (const { payment, order, user } of pending) {
      // Check if expired
      if (new Date() > payment.expiresAt) {
        await db
          .update(orders)
          .set({ status: 'failed', updatedAt: new Date() })
          .where(eq(orders.id, order.id));
        continue;
      }

      const createdTimestamp = payment.createdAt.getTime();

      const result = await checkTrc20Transaction(
        payment.walletAddress,
        payment.expectedAmount,
        createdTimestamp
      );

      if (result.found && result.txHash) {
        console.log(`[USDT] Payment found for order ${order.id}: tx ${result.txHash}`);

        // Mark payment as confirmed
        await db
          .update(usdtPayments)
          .set({
            txHash: result.txHash,
            receivedAmount: result.amount,
            confirmedAt: new Date(),
          })
          .where(eq(usdtPayments.orderId, order.id));

        // Mark order as paid
        await db
          .update(orders)
          .set({
            status: 'paid',
            txHash: result.txHash,
            fileDelivered: false,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        // Deliver files via bot
        const telegramChatId = parseInt(user.telegramId, 10);
        await deliverUsdtOrder(telegramChatId, order.id, user.id);
      }
    }
  } catch (err) {
    console.error('[USDT] Monitor error:', err);
  }
}

// ── Start Monitor Interval ────────────────────────────────────────────────────

export function startUsdtMonitor(): NodeJS.Timeout {
  console.log('[USDT] Starting payment monitor (every 30s)');
  return setInterval(monitorUsdtPayments, 30_000);
}
