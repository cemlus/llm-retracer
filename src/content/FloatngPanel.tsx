import { useEffect, useRef, useState, useCallback } from 'react'

interface UserMessage {
    index: number
    preview: string
}

interface Props {
    selector: string
}

export function FloatingPanel({ selector }: Props) {
    const [messages, setMessages] = useState<UserMessage[]>([])
    const [expanded, setExpanded] = useState(false)
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const elementsRef = useRef<Element[]>([])
    const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const extractText = (el: Element): string => {
        const textEl = el.querySelector('.query-text-line')
        return textEl ? (textEl as HTMLElement).innerText.trim() : (el as HTMLElement).innerText.trim()
    }

    const collect = useCallback(() => {
        const found = Array.from(document.querySelectorAll(selector))
        elementsRef.current = found
        setMessages(
            found.map((el, i) => ({
                index: i,
                preview: extractText(el).slice(0, 80),
            }))
        )
    }, [selector])

    useEffect(() => {
        collect()

        const observer = new MutationObserver((mutations) => {
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
            if (!relevant) return
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
            debounceTimer.current = setTimeout(collect, 150)
        })

        observer.observe(document.body, { childList: true, subtree: true })

        let lastHref = location.href
        const navObserver = new MutationObserver(() => {
            if (location.href !== lastHref) {
                lastHref = location.href
                setTimeout(collect, 800)
            }
        })
        navObserver.observe(document.documentElement, { childList: true, subtree: true })

        return () => {
            observer.disconnect()
            navObserver.disconnect()
        }
    }, [collect])

    function scrollTo(index: number) {
        const el = elementsRef.current[index] as HTMLElement | undefined
        if (!el) return
        setActiveIndex(index)
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.style.transition = 'background 0.4s ease'
        el.style.background = 'rgba(139, 92, 246, 0.15)'
        setTimeout(() => { el.style.background = '' }, 1400)
        setTimeout(() => setActiveIndex(null), 1400)
    }

    function handleMouseEnter() {
        if (leaveTimer.current) clearTimeout(leaveTimer.current)
        setExpanded(true)
    }

    function handleMouseLeave() {
        leaveTimer.current = setTimeout(() => setExpanded(false), 280)
    }

    return (
        <>
            <style>{styles}</style>
            <div
                className={`retracer-panel ${expanded ? 'expanded' : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Collapsed edge — always visible */}
                <div className="edge-strip">
                    <div className="edge-dots">
                        {[0, 1, 2].map(i => <span key={i} className="dot" />)}
                    </div>
                    {messages.length > 0 && (
                        <div className="edge-count">{messages.length}</div>
                    )}
                </div>

                {/* Expanded panel content */}
                <div className="panel-body">
                    <div className="panel-header">
                        <span className="panel-title">Messages</span>
                        <span className="panel-badge">{messages.length}</span>
                    </div>

                    <div className="message-list">
                        {messages.length === 0 && (
                            <p className="empty-hint">No messages yet</p>
                        )}
                        {[...messages].map((msg) => (
                            <button
                                key={msg.index}
                                className={`message-item ${activeIndex === msg.index ? 'active' : ''}`}
                                onClick={() => scrollTo(msg.index)}
                            >
                                <span className="msg-index">#{msg.index + 1}</span>
                                <span className="msg-preview">{msg.preview}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}

const styles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .retracer-panel {
    font-family: 'DM Sans', sans-serif;
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    display: flex;
    flex-direction: row;
    align-items: stretch;
    width: 18px;
    max-height: 70vh;
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    will-change: width;
    overflow: hidden;
    border-radius: 12px 0 0 12px;
    background: rgba(10, 10, 11, 0.88);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.055);
    border-right: none;
    box-shadow:
      -8px 0 32px rgba(0, 0, 0, 0.4),
      -1px 0 0 rgba(255, 255, 255, 0.03) inset;
  }

  .retracer-panel.expanded {
    width: 288px;
  }

  /* ── Edge strip (always visible) ── */
  .edge-strip {
    min-width: 18px;
    width: 18px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px 0;
    flex-shrink: 0;
  }

  .edge-dots {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }

  .dot {
    display: block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    transition: background 0.2s;
  }

  .retracer-panel.expanded .dot {
    background: rgba(255, 255, 255, 0.12);
  }

  .edge-count {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.3);
    letter-spacing: 0.03em;
    writing-mode: vertical-rl;
    text-orientation: mixed;
    transform: rotate(180deg);
  }

  /* ── Panel body ── */
  .panel-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    opacity: 0;
    transform: translateX(8px);
    transition:
      opacity 0.25s ease,
      transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    min-width: 0;
  }

  .retracer-panel.expanded .panel-body {
    opacity: 1;
    transform: translateX(0);
    pointer-events: all;
    transition-delay: 0.06s;
  }

  /* ── Header ── */
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 10px;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .panel-title {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.35);
  }

  .panel-badge {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.06);
    padding: 2px 6px;
    border-radius: 4px;
  }

  /* ── Message list ── */
  .message-list {
    overflow-y: auto;
    flex: 1;
    padding: 6px 0;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
  }

  .message-list::-webkit-scrollbar {
    width: 3px;
  }
  .message-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .message-list::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.08);
    border-radius: 2px;
  }

  .empty-hint {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.18);
    padding: 20px 16px;
    text-align: center;
  }

  .message-item {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 14px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;
    border-radius: 0;
    position: relative;
  }

  .message-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 2px;
    height: 60%;
    background: rgba(139, 92, 246, 0.7);
    border-radius: 0 2px 2px 0;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .message-item:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .message-item:hover::before,
  .message-item.active::before {
    transform: translateY(-50%) scaleY(1);
  }

  .message-item.active {
    background: rgba(139, 92, 246, 0.07);
  }

  .msg-index {
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.18);
    min-width: 28px;
    padding-top: 1px;
    flex-shrink: 0;
  }

  .msg-preview {
    font-size: 12px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.55;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    transition: color 0.15s;
  }

  .message-item:hover .msg-preview {
    color: rgba(255, 255, 255, 0.78);
  }

  .message-item:hover .msg-index {
    color: rgba(139, 92, 246, 0.8);
  }
`