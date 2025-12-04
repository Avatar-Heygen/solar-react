"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

export default function SettingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")

    const [formData, setFormData] = useState({
        company_name: "",
        ai_name: "Sarah",
        calendly_url: "",
        welcome_message: ""
    })

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data, error } = await supabase
                    .from('profiles' as any)
                    .select('*')
                    .eq('id', user.id)
                    .single() as any

                if (data) {
                    setFormData({
                        company_name: data.company_name || "",
                        ai_name: data.ai_name || "Sarah",
                        calendly_url: data.calendly_url || "",
                        welcome_message: data.welcome_message || ""
                    })
                }
            }
            setLoading(false)
        }

        fetchProfile()
    }, [supabase])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSave = async () => {
        setSaving(true)
        setMessage("")

        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { error } = await (supabase as any)
                .from('profiles')
                .update({
                    company_name: formData.company_name,
                    ai_name: formData.ai_name,
                    calendly_url: formData.calendly_url,
                    welcome_message: formData.welcome_message,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (error) {
                setMessage("❌ Erreur lors de la sauvegarde")
                console.error(error)
            } else {
                setMessage("✅ Sauvegardé !")
                // Clear message after 3 seconds
                setTimeout(() => setMessage(""), 3000)
            }
        }
        setSaving(false)
    }

    if (loading) {
        return <div className="p-8 text-white">Chargement...</div>
    }

    return (
        <div className="p-8 space-y-8 max-w-2xl">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-white">Réglages</h2>
            </div>

            <div className="space-y-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-200">

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Nom de l'entreprise
                    </label>
                    <input
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        placeholder="Ex: SolarTech"
                        className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Nom de l'IA
                    </label>
                    <input
                        name="ai_name"
                        value={formData.ai_name}
                        onChange={handleChange}
                        placeholder="Ex: Sarah"
                        className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Lien Calendly
                    </label>
                    <input
                        name="calendly_url"
                        value={formData.calendly_url}
                        onChange={handleChange}
                        placeholder="https://calendly.com/..."
                        className="flex h-10 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Message de bienvenue (Prompt système)
                    </label>
                    <textarea
                        name="welcome_message"
                        value={formData.welcome_message}
                        onChange={handleChange}
                        placeholder="Personnalisez le comportement de l'IA..."
                        rows={4}
                        className="flex w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="flex items-center gap-4 pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-black hover:bg-slate-200 h-10 px-4 py-2"
                    >
                        {saving ? "Sauvegarde..." : "Sauvegarder"}
                    </button>

                    {message && (
                        <span className={`text-sm font-medium ${message.includes('Erreur') ? 'text-red-500' : 'text-green-500'}`}>
                            {message}
                        </span>
                    )}
                </div>

            </div>

            {/* Integration Section */}
            <div className="space-y-6 rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Intégration</h3>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Webhook URL (pour vos campagnes Facebook/Google Ads)
                    </label>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-zinc-400 font-mono">
                            {typeof window !== 'undefined' ? `${window.location.origin}/api/incoming-lead` : '/api/incoming-lead'}
                        </code>
                        <button
                            onClick={() => {
                                const url = `${window.location.origin}/api/incoming-lead`;
                                navigator.clipboard.writeText(url);
                                setMessage("✅ URL copiée !");
                                setTimeout(() => setMessage(""), 3000);
                            }}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-800 text-white hover:bg-slate-700 h-10 px-4 py-2"
                        >
                            Copier
                        </button>
                    </div>
                    <p className="text-xs text-slate-500">
                        Configurez votre source de leads (ex: Zapier, Make) pour envoyer une requête POST à cette URL avec les champs <code>name</code> et <code>phone</code>.
                    </p>
                </div>
            </div>
        </div>
    )
}
