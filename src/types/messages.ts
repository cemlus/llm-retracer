export interface UserMessage {
    index: number
    preview: string
    fullText: string
}

export type ExtensionMessage =
    | { type: 'GET_MESSAGES' }
    | { type: 'GET_MESSAGES_RESPONSE'; messages: UserMessage[] }
    | { type: 'SCROLL_TO'; index: number }