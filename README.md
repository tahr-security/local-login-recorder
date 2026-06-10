# Tahr Local Login Recorder

A small local Playwright tool for recording the steps of a login flow.

It opens Chromium, injects a recorder script, and saves the captured actions to
`output.json`. It records selectors and action types, not the values you type.

## Requirements

- Node.js 18+
- npm

## Install

```bash
npm install
```

## Usage

Pass the login URL directly:

```bash
npm start -- https://example.com/login
```

Or create a `.env` file:

```bash
TARGET_URL=https://example.com/login
```

Then run:

```bash
npm start
```

The browser will open. Complete the login manually, then return to the terminal
and press `Enter`. The recording is written to `output.json`.

## Headless Mode

For automated testing, you can run Chromium without a visible browser window:

```bash
HEADLESS=true npm start -- http://127.0.0.1:8080/login
```

For manual login recording, leave headless mode off.

## Output

Example `output.json`:

```json
{
  "version": "1.0",
  "recordedAt": "2026-03-12T12:00:00.000Z",
  "startUrl": "https://example.com/login",
  "steps": [
    {
      "action": "fill",
      "selector": "input[type=\"email\"]",
      "fieldType": "username",
      "timestamp": 1773316800000
    },
    {
      "action": "fill",
      "selector": "input[type=\"password\"]",
      "fieldType": "password",
      "timestamp": 1773316801000
    },
    {
      "action": "click",
      "selector": "button[type=\"submit\"]",
      "text": "Sign in",
      "tagName": "button",
      "timestamp": 1773316802000
    }
  ],
  "finalUrl": "https://example.com/dashboard"
}
```

## Scripts

- `npm install` installs dependencies.
- `npm start -- <url>` starts a recording session.
