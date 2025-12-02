"use client"

import { useState } from "react"
import { Send } from "lucide-react"

export default function SimulatePage() {
    const [name, setName] = useState("")
    const [phone, setPhone] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSimulateLead = async () => {
        if (!name || !phone) {
            alert("Veuillez remplir tous les champs")
            return
        }

        setLoading(true)
        try {
            const response = await fetch("/api/test-sms", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, phone }),
            })

            const data = await response.json()

            if (data.success) {
                alert("✅ Simulation réussie ! SMS envoyé.")
            } else {
                alert("❌ Erreur : " + data.error)
            }
        } catch (error) {
            alert("❌ Erreur de connexion")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white text-slate-950 shadow">
                <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold leading-none tracking-tight text-2xl text-center">Simulateur de Lead Entrant</h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Nom du prospect</label>
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Ex: Jean Dupont"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Numéro de téléphone</label>
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="+336..."
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <button
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-8 w-full gap-2 bg-black text-white"
                        onClick={handleSimulateLead}
                        disabled={loading}
                    >
                        <Send className="h-4 w-4" />
                        {loading ? "Envoi en cours..." : "Simuler l'arrivée du Lead"}
                    </button>
                </div>
            </div>
        </div>
    )
}
