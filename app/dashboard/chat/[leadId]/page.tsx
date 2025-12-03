import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import ChatWindow from "@/components/chat/ChatWindow"

export default async function ChatPage({ params }: { params: { leadId: string } }) {
    const supabase = createClient()

    // 1. Fetch all leads for the sidebar
    const { data: leads } = await supabase
        .from('leads' as any)
        .select('*')
        .order('created_at', { ascending: false }) as any

    // 2. Fetch the current lead
    const { data: currentLead } = await supabase
        .from('leads' as any)
        .select('*')
        .eq('id', params.leadId)
        .single() as any

    if (!currentLead) {
        return <div className="p-8 text-white">Lead introuvable</div>
    }

    return (
        <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-slate-950 text-slate-200">
            {/* LEFT SIDEBAR: Leads List */}
            <div className="w-80 border-r border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-800">
                    <h2 className="font-semibold text-lg text-white">Conversations</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {leads?.map((lead: any) => (
                        <Link
                            key={lead.id}
                            href={`/dashboard/chat/${lead.id}`}
                            className={`block p-4 border-b border-slate-800/50 hover:bg-slate-900 transition-colors ${lead.id === currentLead.id ? 'bg-slate-900 border-l-2 border-l-blue-500' : ''
                                }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-slate-100">{lead.name}</span>
                                <span className="text-xs text-slate-500">
                                    {new Date(lead.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="text-sm text-slate-400 truncate">
                                {lead.phone}
                            </div>
                            <div className="mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${lead.status === 'Nouveau' ? 'bg-blue-500/10 text-blue-400' :
                                    lead.status === 'En Discussion' ? 'bg-yellow-500/10 text-yellow-400' :
                                        lead.status === 'RDV Pris' ? 'bg-green-500/10 text-green-400' :
                                            'bg-slate-800 text-slate-400'
                                    }`}>
                                    {lead.status}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* RIGHT SIDE: Chat Window */}
            <ChatWindow lead={currentLead} />
        </div>
    )
}
