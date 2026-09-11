# Vocari

Desktop TTS for live chat. Electron app for streamers: Twitch chat is read aloud with Windows voices, a queue, and karaoke-style progress.

Free and open source. If it helps your stream, [sponsor the project on GitHub](https://github.com/sponsors/anje-anz).

## Run locally

Requires Node.js 20+ and Windows (SAPI voices).

```bash
npm install
npm run dev
```

Twitch uses Device Code OAuth with a **public** client. Create an app in the [Twitch developer console](https://dev.twitch.tv/console/apps), then paste the Client ID in Live → Twitch, or set:

```bash
VOCARI_TWITCH_CLIENT_ID=your_client_id
```

Tokens stay in the Electron user data folder (`vocari-tokens.bin`). Do not commit them.

## License

[MIT](./LICENSE)
