# LLM Retracer

Chrome/Edge extension (Manifest V3) that adds a side panel listing your **user messages** on supported LLM chat pages. Click an entry to smoothly scroll back to that message in the original tab.

## What it does

- Injects a content script into supported chat sites.
- Collects “user message” DOM nodes and returns them to the side panel.
- Renders a lightweight UI in the extension side panel (“Your Messages”).
- On click, tells the content script to `scrollIntoView()` the corresponding message and briefly highlights it.

## Supported sites

Message collection is based on the current host URL and a site-specific selector:

- `chatgpt.com`: `div[data-message-author-role="user"]`
- `chat.openai.com`: `div[data-message-author-role="user"]` (fallback for older URLs)
- `claude.ai`: `div[data-testid="user-message"]`
- `gemini.google.com`: `user-query`

Supported domains are configured in `manifest.json` and used by the content script in `src/content/index.ts`.

## Architecture (high level)

- `src/content/index.ts`
  - Watches for route/DOM changes with a `MutationObserver`.
  - Collects user message elements from the page.
  - Responds to extension messages:
    - `GET_MESSAGES`: returns `{ index, preview, fullText }[]`
    - `SCROLL_TO`: scrolls to the element at the given index and highlights it
- `src/panel/Panel.tsx`
  - Opens a side panel UI.
  - Finds the active tab and requests messages via `chrome.tabs.sendMessage`.
  - Renders the list; clicking sends `SCROLL_TO`.
- `src/types/messages.ts`
  - Shared message types between content script and panel.

## Permissions

Configured in `manifest.json`:

- `activeTab`
- `scripting`
- `sidePanel`
- `host_permissions` for:
  - `chatgpt.com`, `chat.openai.com`, `claude.ai`, `gemini.google.com`

## Development / Setup

Prerequisite: Node.js (LTS recommended).

1. Install dependencies
   - `npm install`
2. Run the dev build (Vite)
   - `npm run dev`
3. Build the extension package
   - `npm run build`

The build output is written to `dist/`.

## Load unpacked in Chrome (or Edge)

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the project `dist/` folder
5. Open a supported LLM chat page, then open the extension side panel.

## Useful scripts

- `npm run dev`: start Vite
- `npm run build`: run TypeScript checks and package into `dist/`
- `npm run lint`: run eslint
- `npm run preview`: preview the Vite build

## Limitations / Notes

- This extension relies on third-party sites’ DOM structure; selectors may need updates if those sites change.
- Only **user messages** are collected (assistant responses are not).
- Message indices are based on DOM order at collection time, so streaming or layout changes can affect ordering briefly.
