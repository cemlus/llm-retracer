import React from 'react'
import ReactDOM from 'react-dom/client'
import { FloatingPanel } from './FloatngPanel'

const SELECTORS: Record<string, string> = {
  'chatgpt.com': 'div[data-message-author-role="user"]',
  'chat.openai.com': 'div[data-message-author-role="user"]',
  'claude.ai': 'div[data-testid="user-message"]',
  'gemini.google.com': 'user-query',
}

const hostname = window.location.hostname
const selector = SELECTORS[hostname]

if (selector) {
  const host = document.createElement('div')
  host.id = 'llm-retracer-root'
  host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;'
  document.body.appendChild(host)

  const shadow = host.attachShadow({ mode: 'open' })

  // @ts-ignore
  const fontUrl = globalThis.chrome.runtime.getURL(
    'fonts/dm_sans/DMSans-VariableFont_opsz,wght.ttf'
  )
  if (!fontUrl) {
    console.error('Chrome runtime not available')
  }

  const style = document.createElement('style')
  style.textContent = `
    @font-face {
      font-family: 'DM Sans';
      src: url('${fontUrl}') format('truetype');
      font-weight: 100 900;
    }
`

  shadow.appendChild(style);

  const mountPoint = document.createElement('div')
  shadow.appendChild(mountPoint)

  ReactDOM.createRoot(mountPoint).render(
    <React.StrictMode>
      <FloatingPanel selector={selector} />
    </React.StrictMode>
  )
}