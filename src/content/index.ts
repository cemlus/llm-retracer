import type { ExtensionMessage, UserMessage } from '../types/messages'

const SELECTORS: Record<string, string> = {
    'chatgpt.com': 'div[data-message-author-role="user"]',
    'chat.openai.com': 'div[data-message-author-role="user"]', 
    'claude.ai': 'div[data-testid="user-message"]',
    'gemini.google.com': 'div[class*="query-text-line"]',
}

const hostName = window.location.hostname;
const selector = SELECTORS[hostName];
let userMessages: Element[] = [];
let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null

const mapMessages = (): UserMessage[] => {
    return userMessages.map((el, i) => ({
        index: i,
        preview: (el as HTMLElement).innerText.slice(0, 90).trim(),
        fullText: (el as HTMLElement).innerText,
    }))
}

const collect = () => {
    if (!selector) return;
    const found = Array.from(document.querySelectorAll(selector))
    const changed = found.length !== userMessages.length
    userMessages = found
    if (changed) pushToPanel()
}

const pushToPanel = () => {
    if (pushDebounceTimer) clearTimeout(pushDebounceTimer)
    pushDebounceTimer = setTimeout(() => {
        // @ts-ignore
        chrome.runtime.sendMessage({
            type: 'MESSAGES_UPDATED',
            messages: mapMessages(),
        }).catch(() => {
        })
    }, 150)
}

const domObserver = new MutationObserver((mutations) => {
    if (!selector) return
    let relevant = false
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (!(node instanceof Element)) continue
        if (node.matches(selector) || node.querySelector(selector)) {
          relevant = true
          break
        }
      }
      if (relevant) break
    }
    if (relevant) collect()
  })
  
domObserver.observe(document.body, { childList: true, subtree: true })

let lastHref = location.href
const navObserver = new MutationObserver(() => {
  if (location.href !== lastHref) {
    lastHref = location.href
    setTimeout(collect, 800)
  }
})
navObserver.observe(document.documentElement, { childList: true, subtree: true })

collect()

// @ts-ignore
chrome.runtime.onMessage.addListener(
    (msg: ExtensionMessage, _sender: any, sendResponse: any) => {
        if (msg.type === 'GET_MESSAGES') {
          collect()
          sendResponse({ type: 'GET_MESSAGES_RESPONSE', messages: mapMessages() })
        }
    
        if (msg.type === 'SCROLL_TO') {
          const el = userMessages[msg.index] as HTMLElement | undefined
          if (!el) return
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.style.transition = 'background 0.3s'
          el.style.background = 'rgba(250, 204, 21, 0.35)'
          setTimeout(() => { el.style.background = '' }, 1200)
        }
    
        return true
      }
)
