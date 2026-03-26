import type { ExtensionMessage, UserMessage } from '../types/messages'

const SELECTORS: Record<string, string> = {
    'chatgpt.com': 'div[data-message-author-role="user"]',
    'chat.openai.com': 'div[data-message-author-role="user"]', // fallback for old URL
    'claude.ai': 'div[data-testid="user-message"]',
    'gemini.google.com': 'div[class*="query-text-line"]',
}

const hostName = window.location.hostname;
const selector = SELECTORS[hostName];
let userMessages: Element[] = [];

const collect = () => {
    if (!selector) return;
    userMessages = Array.from(document.querySelectorAll(selector))
}

let lastHref = window.location.href;
const routeObserver = new MutationObserver(() => {
    if (location.href !== lastHref) {
        lastHref = location.href
        setTimeout(collect, 1000) // slight delay to let the new DOM render
    }
    collect()
})

routeObserver.observe(document.body, { childList: true, subtree: true })
collect()

// @ts-ignore
chrome.runtime.onMessage.addListener(
    (msg: ExtensionMessage, _sender: any, sendResponse: any) => {
        if (msg.type === 'GET_MESSAGES') {
            collect() // always re-collect fresh on request
            const mapped: UserMessage[] = userMessages.map((el, i) => ({
                index: i,
                preview: (el as HTMLElement).innerText.slice(0, 90).trim(),
                fullText: (el as HTMLElement).innerText,
            }))
            sendResponse({ type: 'GET_MESSAGES_RESPONSE', messages: mapped })
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
