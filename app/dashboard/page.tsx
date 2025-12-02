import { createClient } from '@/utils/supabase/server';

export default async function DashboardPage() {
    const supabase = createClient();
    const { data: leads } = await supabase.from('leads' as any).select('*') as any;

    const totalLeads = leads?.length || 0;
    const rdvPris = leads?.filter((lead: any) => lead.status === 'RDV Pris').length || 0;

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Card: Total Leads */}
                <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total Leads</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{totalLeads}</div>
                    </div>
                </div>

                {/* Card: RDV Pris */}
                <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow">
                    <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">RDV Pris</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">{rdvPris}</div>
                    </div>
                </div>
            </div>

            {/* Card: Leads Récents */}
            <div className="rounded-xl border border-slate-200 bg-white text-slate-950 shadow">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Leads Récents</h3>
                </div>
                <div className="p-6 pt-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b border-slate-200 transition-colors hover:bg-slate-100/50">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Nom</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Téléphone</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Statut</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Date</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {leads && leads.length > 0 ? (
                                    leads.map((lead: any, i: number) => (
                                        <tr key={i} className="border-b border-slate-200 transition-colors hover:bg-slate-100/50">
                                            <td className="p-4 align-middle font-medium">{lead.name}</td>
                                            <td className="p-4 align-middle">{lead.phone}</td>
                                            <td className="p-4 align-middle">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${lead.status === 'RDV Pris' ? 'bg-green-100 text-green-800' :
                                                    lead.status === 'Réponse Reçue' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle">
                                                {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-slate-500">
                                            Aucun lead pour le moment
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
