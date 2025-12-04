'use client'

import { useState, useRef, useEffect } from 'react'
import { sendManualMessage } from '@/app/actions/chat'

export default function ChatWindow({ lead }: { lead: any }) {
    const [messages, setMessages] = useState(lead.conversation_history || [])
    const [input, setInput] = useState("")
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    // Update messages when lead prop changes (e.g. real-time update or navigation)
    useEffect(() => {
        setMessages(lead.conversation_history || [])
    }, [lead.conversation_history])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || sending) return

        const newMessage = input.trim()
        setInput("")
        setSending(true)

        // Optimistic update
        const optimisticMsg = { role: 'assistant', content: newMessage, type: 'manual' }
        setMessages((prev: any[]) => [...prev, optimisticMsg])

        const result = await sendManualMessage(lead.id, newMessage)

        if (!result.success) {
            // Revert on failure (simple alert for now)
            alert("Erreur lors de l'envoi: " + result.error)
            // Ideally revert state here, but revalidatePath usually fixes it
        }

        setSending(false)
    }

    return (
        <div className="flex-1 flex flex-col bg-zinc-900/50 h-full">
            {/* Chat Header */}
            <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur">
                <div>
                    <h1 className="font-semibold text-white">{lead.name}</h1>
                    <p className="text-sm text-zinc-400">
                        {lead.phone} • {lead.status}
                        {lead.ai_paused && <span className="ml-2 text-yellow-500 text-xs">(IA en pause)</span>}
                    </p>
                </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-500">
                        Aucune conversation pour le moment.
                    </div>
                ) : (
                    messages.map((msg: any, index: number) => {
                        const isAi = msg.role === 'assistant';
                        return (
                            <div
                                key={index}
                                className={`flex ${isAi ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm ${isAi
                                    ? 'bg-orange-600 text-white rounded-br-none'
                                    : 'bg-zinc-800 text-zinc-200 rounded-bl-none'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                    {msg.type === 'manual' && (
                                        <p className="text-[10px] opacity-70 mt-1 text-right">Envoyé manuellement</p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Écrire un message..."
                        disabled={sending}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={sending}
                        className="bg-orange-600 hover:bg-orange-700 text-white rounded-full p-2 px-4 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {sending ? '...' : 'Envoyer'}
                    </button>
                </form>
            </div>
        </div>
    )
}
