import type { ExtensionMessage, UserMessage } from '../types/messages'

const SELECTORS: Record<string, string> = {
    'chat.openai.com': 'div[class*="whitespace-pre-wrap"]',
    'claude.ai': 'div[class*="whitespace-pre-wrap"]',
    'gemini.google.com': 'div[class*="query-text-line"]',
}

const hostName = window.location.hostname;
const selector = SELECTORS[hostName];
let userMessages: Element[] = [];

const collect = () => {
    if (!selector) return;
    userMessages = Array.from(document.querySelectorAll(selector))
}

const observer = new MutationObserver(collect)
observer.observe(document.body, { childList: true, subtree: true })
collect()

// @ts-ignore
chrome.runtime.onMessage.addListener(
    (msg: ExtensionMessage, _sender: any, sendResponse: any) => {
        if (msg.type === 'GET_MESSAGES') {
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
            // Flash highlight
            el.style.transition = 'background 0.3s'
            el.style.background = 'rgba(250, 204, 21, 0.35)'
            setTimeout(() => { el.style.background = '' }, 1200)
        }

        return true // keeps the message channel open for async response
    }
)
