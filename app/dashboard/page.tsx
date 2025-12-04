import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import DashboardChart from '@/components/dashboard/DashboardChart';
import { Users, CalendarCheck, MessageCircle, Euro } from 'lucide-react';

export default async function DashboardPage() {
    const supabase = createClient();
    const { data: leads } = await supabase.from('leads' as any).select('*').order('created_at', { ascending: false }) as any;

    const totalLeads = leads?.length || 0;
    const rdvPris = leads?.filter((lead: any) => lead.status === 'RDV Pris').length || 0;
    const respondedLeads = leads?.filter((lead: any) => lead.status !== 'Nouveau').length || 0;
    const responseRate = totalLeads > 0 ? Math.round((respondedLeads / totalLeads) * 100) : 0;
    const estimatedRevenue = rdvPris * 150; // Mock value: 150€ per RDV

    return (
        <div className="p-8 space-y-8 bg-zinc-950 min-h-screen text-zinc-100">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
                    <p className="text-zinc-400 mt-1">Vue d'ensemble de votre activité solaire.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                    <span className="text-sm text-zinc-400">Système opérationnel</span>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-zinc-400">Total Leads</h3>
                        <Users className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-white">{totalLeads}</div>
                    <p className="text-xs text-zinc-500 mt-1">+20.1% par rapport au mois dernier</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-zinc-400">RDV Pris</h3>
                        <CalendarCheck className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-white">{rdvPris}</div>
                    <p className="text-xs text-zinc-500 mt-1">+12 depuis la semaine dernière</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-zinc-400">Taux de Réponse</h3>
                        <MessageCircle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-white">{responseRate}%</div>
                    <p className="text-xs text-zinc-500 mt-1">L'IA performe bien</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-zinc-400">Revenu Estimé</h3>
                        <Euro className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-white">{estimatedRevenue} €</div>
                    <p className="text-xs text-zinc-500 mt-1">Basé sur les RDV qualifiés</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-4 md:grid-cols-7">

                {/* Chart Area (Span 4) */}
                <div className="col-span-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <h3 className="font-semibold text-white mb-6">Performance Hebdomadaire</h3>
                    <DashboardChart />
                </div>

                {/* Recent Leads (Span 3) */}
                <div className="col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-white">Leads Récents</h3>
                        <Link href="/dashboard/import" className="text-xs text-orange-400 hover:text-orange-300">
                            Importer CSV
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {leads && leads.length > 0 ? (
                            leads.slice(0, 5).map((lead: any) => (
                                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-300">
                                            {lead.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{lead.name}</p>
                                            <p className="text-xs text-zinc-500">{lead.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${lead.status === 'RDV Pris' ? 'bg-orange-500/10 text-orange-400' :
                                            lead.status === 'En Discussion' ? 'bg-orange-500/10 text-orange-400' :
                                                'bg-zinc-800 text-zinc-400'
                                            }`}>
                                            {lead.status}
                                        </span>
                                        <Link
                                            href={`/dashboard/chat/${lead.id}`}
                                            className="p-2 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-zinc-500 text-sm">
                                Aucun lead récent.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
