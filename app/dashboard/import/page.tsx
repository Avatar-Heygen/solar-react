'use client'

import { useState } from 'react'
import { processCsvImport } from '@/app/actions/import'

export default function ImportPage() {
    const [csvContent, setCsvContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<string | null>(null)

    const handleImport = async () => {
        if (!csvContent.trim()) return

        setLoading(true)
        setResult(null)

        try {
            const response = await processCsvImport(csvContent)
            setResult(response.message)
            if (response.success) {
                setCsvContent('') // Clear input on success
            }
        } catch (error) {
            setResult("Une erreur est survenue lors de l'import.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight text-white">Réactivation de Base de Données</h2>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Collez votre liste de clients (CSV)
                    </label>
                    <p className="text-sm text-zinc-500 mb-4">
                        Format attendu par ligne : <code>Nom, Téléphone</code><br />
                        Exemple :<br />
                        <code>Marc, +33612345678</code><br />
                        <code>Julie, +33687654321</code>
                    </p>
                    <textarea
                        value={csvContent}
                        onChange={(e) => setCsvContent(e.target.value)}
                        rows={10}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-950 text-white p-4 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono placeholder:text-zinc-600"
                        placeholder="Marc, +33612345678&#10;Julie, +33687654321"
                        disabled={loading}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={handleImport}
                        disabled={loading || !csvContent.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span> Traitement en cours...
                            </>
                        ) : (
                            'Lancer la Réactivation'
                        )}
                    </button>

                    {result && (
                        <div className={`text-sm font-medium px-4 py-2 rounded-md ${result.includes('erreur') ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                            }`}>
                            {result}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
