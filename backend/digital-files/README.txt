This folder stores your digital product files.

IMPORTANT: Place your actual digital product files here before deploying.

Files should match the entries in backend/data/db.json under "digitalFiles":

Example structure:
  digital-files/
  ├── ui-component-kit.zip
  ├── telegram-bot-suite.zip
  ├── web3-masterclass.pdf
  ├── icon-pack-pro.zip
  ├── python-trading-bot.zip
  └── pixel-art-bundle.zip

When a user completes payment, the bot will automatically send the matching
file from this directory.

If the file doesn't exist, the bot will instruct the user to contact support
(the admin bot) to receive their download link manually.

File size limit: 50MB per file for direct Telegram delivery.
For larger files, provide a download link instead.
