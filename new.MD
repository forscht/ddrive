
README.md
=======
# DDrive

**Turn Discord into a datastore that can manage and store your files.**

[![Discord](https://img.shields.io/discord/1020806104881561754?color=5865F2&logo=discord&logoColor=white)](https://discord.gg/3TCZRYafhW)
[![Lint Workflow](https://github.com/forscht/ddrive/actions/workflows/lint.yml/badge.svg)](https://github.com/forscht/ddrive/actions/workflows/lint.yml)
[![Docker Version](https://img.shields.io/docker/v/forscht/ddrive?logo=docker)](https://hub.docker.com/r/forscht/ddrive)
[![Docker Pulls](https://img.shields.io/docker/pulls/forscht/ddrive.svg?logo=docker)](https://hub.docker.com/r/forscht/ddrive)
[![CodeQL Analysis](https://github.com/forscht/ddrive/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/forscht/ddrive/actions/workflows/codeql-analysis.yml)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/forscht/ddrive/blob/v2/LICENSE)

DDrive is a lightweight cloud storage system that utilizes Discord as a storage device, written in Node.js. It supports an unlimited file size and storage capacity, implemented using Node.js streams with multipart upload and download.

![DDrive Demo](https://user-images.githubusercontent.com/59018146/167635903-48cdace0-c383-4e7d-a037-4a32eaa4ab69.mp4)

**Current stable branch: `4.x`**

**Live demo:** [ddrive.forscht.dev](https://ddrive.forscht.dev/)

### Features

- Unlimited file size through 24MB file chunks using Node.js streams API.
- Simple yet robust HTTP front end.
- REST API with OpenAPI 3.1 specifications.
- Tested with storing 4TB of data on a single Discord channel (max file size of 16GB).
- Basic auth with read-only public access to the panel.
- Easily deployable on Heroku/Replit for private cloud storage.

## New Version 4.0

Version 4.0 is a complete rewrite of DDrive, incorporating the most requested features and several improvements:

- Now uses `postgres` to store file metadata for improved performance and functionality.
- Supports file and folder `rename` operations.
- Enables `move` operations for files and folders via API.
- Utilizes `webhooks` instead of `bot/user tokens` to bypass Discord rate limits.
- Parallel file chunk uploads for increased speed (5GB file uploaded in 85 seconds).
- Public access mode for read-only access.
- Batch file uploads directly from the panel.
- Bug fixes, including improved `download reset` for mobile devices.
- Optional file encryption for enhanced security.
- Proper REST API adhering to OpenAPI 3.1 standards.
- Dark/light mode support on the panel.

Your support is highly appreciated - [Buy me a coffee](https://www.buymeacoffee.com/forscht)

### Requirements

- Node.js v16.x or Docker
- PostgreSQL Database, Discord Webhook URLs
- Average technical knowledge

## Setup Guide

1. Clone this project.
2. Create several webhook URLs (at least 5 for optimal performance).
3. Set up PostgreSQL using Docker:
   - Navigate to `.devcontainer` directory.
   - Run `docker-compose up -d`.
4. Copy `config/.env_sample` to `config/.env` and update with your details.
5. (Optional) If you have many webhook URLs, list them in `webhook.txt`, separated by newlines.
6. Run `npm run migration:up`.
7. Start the server with `node bin/ddrive`.
8. Open `http://localhost:3000` in your browser.

### Keeping DDrive Running

1. Install pm2: `npm install -g pm2`.
2. Start DDrive with pm2: `pm2 start bin/ddrive`.
3. Check the status: `pm2 list`.
4. View logs: `pm2 logs`.

### Configuration Variables

| Variable            | Description |
|---------------------|-------------|
| `DATABASE_URL`      | PostgreSQL database URL |
| `WEBHOOKS`          | Discord webhook URLs, comma-separated |
| `PORT`              | HTTP port for the DDrive panel |
| `REQUEST_TIMEOUT`   | Timeout for Discord API requests (in milliseconds) |
| `CHUNK_SIZE`        | Size of file chunks (in bytes) |
| `SECRET`            | Secret for file encryption |
| `AUTH`              | Basic auth credentials (`username:password`) |
| `PUBLIC_ACCESS`     | Read-only access level (`READ_ONLY_FILE` or `READ_ONLY_PANEL`) |
| `UPLOAD_CONCURRENCY`| Number of parallel uploads to Discord |

### Docker Deployment

```shell
docker run --rm -it -p 8080:8080 \
-e PORT=8080 \
-e WEBHOOKS={url1},{url2} \
-e DATABASE_URL={database url} \
--name ddrive forscht/ddrive
```

### One-Click Deploy with Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/tL53xa)

### Setup Tutorials

- [Setup in under 4 minutes using `neon.tech` PostgreSQL](https://youtu.be/Zvr1BHjrYC0)

### API Usage

`npm install @forscht/ddrive`
```javascript
const { DFs, HttpServer } = require('@forscht/ddrive')

const DFsConfig = {
  chunkSize: 25165824,
  webhooks: 'webhookURL1,webhookURL2',
  secret: 'somerandomsecret',
  maxConcurrency: 3, // UPLOAD_CONCURRENCY
  restOpts: {
    timeout: '60000',
  },
}

const httpConfig = {
  authOpts: {
    auth: { user: 'admin', pass: 'admin' },
    publicAccess: 'READ_ONLY_FILE', // or 'READ_ONLY_PANEL'
  },
  port: 8080,
}

const run = async () => {
  // Create DFs Instance
  const dfs = new DFs(DFsConfig)
  // Create HTTP Server instance
  const httpServer = HttpServer(dfs, httpConfig)

  return httpServer.listen({ host: '0.0.0.0', port: httpConfig.port })
}

run().then()

```

## Migrate from v3 to v4
Migrating ddrive v3 to v4 is one way process once you migrate ddrive to v4 and add new files you can't migrate new files to v3 again but you can still use v3 with old files.

1. Clone this project
2. Create few webhooks (1 webhook/text channel). Do not create webhook on old text channel where you have already stored v3 data.
3. Take pull of latest ddrive v3
4. Start ddrive v3 with option `--metadata=true`. Ex - `ddrive --channelId {id} --token {token} --metadata=true`
5. Open `localhost:{ddrive-port}/metadata` in browser
6. Save JSON as old_data.json in cloned ddrive directory
7. Put valid `DATABASE_URL` in `config/.env`
8. Run `node bin/migrate old_data.json`
9. After few seconds once process is done you should see the message `Migration is done`

### Support and Contact

For support, join our [Discord server](https://discord.gg/3TCZRYafhW) or create a [new issue](https://github.com/forscht/ddrive/issues/new).

### License

DDrive is [MIT licensed](LICENSE).

