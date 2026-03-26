import { useEffect, useState } from 'react'
import type { UserMessage } from '../types/messages'

export default function Panel() {
    const [messages, setMessages] = useState<UserMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [tabId, setTabId] = useState<number | null>(null)

    useEffect(() => {
        // @ts-ignore
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const id = tabs[0]?.id
            if (!id) return
            setTabId(id)

            // @ts-ignore
            chrome.tabs.sendMessage(id, { type: 'GET_MESSAGES' }, (res) => {
                if (res?.messages) {
                    setMessages([...res.messages]) 
                }
                setLoading(false)
            })
        })
    }, [])

    function jumpTo(index: number) {
        if (!tabId) return
        // @ts-ignore
        chrome.tabs.sendMessage(tabId, { type: 'SCROLL_TO', index })
    }

    function refresh() {
        setLoading(true)
        if (!tabId) return
        // @ts-ignore
        chrome.tabs.sendMessage(tabId, { type: 'GET_MESSAGES' }, (res) => {
            if (res?.messages) setMessages([...res.messages].reverse())
            setLoading(false)
        })
    }

    return (
        <div className="panel">
            <div className="panel-header">
                <span>Your Messages</span>
                <button onClick={refresh}>↻</button>
            </div>

            {loading && <p className="hint">Loading...</p>}
            {!loading && messages.length === 0 && (
                <p className="hint">No messages found. Make sure you're on a supported LLM page.</p>
            )}

            <ul className="message-list">
                {messages.map((msg) => (
                    <li key={msg.index} onClick={() => jumpTo(msg.index)}>
                        <span className="index">#{msg.index + 1}</span>
                        <span className="preview">{msg.preview}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}