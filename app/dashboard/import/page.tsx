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
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Réactivation de Base de Données</h2>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Collez votre liste de clients (CSV)
                    </label>
                    <p className="text-sm text-slate-500 mb-4">
                        Format attendu par ligne : <code>Nom, Téléphone</code><br />
                        Exemple :<br />
                        <code>Marc, +33612345678</code><br />
                        <code>Julie, +33687654321</code>
                    </p>
                    <textarea
                        value={csvContent}
                        onChange={(e) => setCsvContent(e.target.value)}
                        rows={10}
                        className="w-full rounded-md border border-gray-700 bg-gray-800 text-white p-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
                        placeholder="Marc, +33612345678&#10;Julie, +33687654321"
                        disabled={loading}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={handleImport}
                        disabled={loading || !csvContent.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                        <div className={`text-sm font-medium px-4 py-2 rounded-md ${result.includes('erreur') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                            }`}>
                            {result}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
