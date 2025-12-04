'use server'

import { createClient } from '@/utils/supabase/server'
import Twilio from 'twilio'
import OpenAI from 'openai'

const twilioClient = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
)

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

export async function processCsvImport(csvContent: string) {
    const supabase = createClient()
    const lines = csvContent.split('\n')
    let successCount = 0
    let errorCount = 0
    const results = []

    // Fetch profile for company name
    const { data: { user } } = await supabase.auth.getUser()
    let companyName = 'SolarFlash'

    if (user) {
        const { data: profile } = await supabase
            .from('profiles' as any)
            .select('company_name')
            .eq('id', user.id)
            .single() as any
        if (profile?.company_name) companyName = profile.company_name
    }

    for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        const [name, phone] = trimmedLine.split(',').map(s => s.trim())

        if (!name || !phone) {
            errorCount++
            continue
        }

        try {
            // 1. Create Lead in Supabase
            const { data: lead, error: createError } = await (supabase as any)
                .from('leads')
                .insert([
                    {
                        name,
                        phone,
                        status: 'Nouveau',
                        source: 'Import CSV',
                        conversation_history: []
                    }
                ])
                .select()
                .single()

            if (createError) {
                console.error('Error creating lead:', createError)
                errorCount++
                continue
            }

            // 2. Generate AI Welcome Message
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Tu es Sarah, assistante chez ${companyName}. Tu contactes un ancien prospect (${name}) pour savoir s'il est toujours intéressé par le solaire. Sois brève, amicale et naturelle. Pas de bla-bla commercial lourd.`
                    },
                    {
                        role: 'user',
                        content: "Génère le premier SMS d'approche."
                    }
                ]
            })

            const messageBody = completion.choices[0].message.content || `Bonjour ${name}, c'est Sarah de chez ${companyName}. Êtes-vous toujours intéressé par une installation solaire ?`

            // 3. Send SMS via Twilio
            await twilioClient.messages.create({
                body: messageBody,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phone
            })

            // 4. Update Lead History
            const newHistory = [{ role: 'assistant', content: messageBody }]

            await (supabase as any)
                .from('leads')
                .update({
                    conversation_history: newHistory,
                    status: 'Contacté'
                })
                .eq('id', lead.id)

            successCount++
            results.push({ name, status: 'success' })

        } catch (err) {
            console.error(`Error processing ${name}:`, err)
            errorCount++
            results.push({ name, status: 'error' })
        }
    }

    return {
        success: true,
        count: successCount,
        errors: errorCount,
        message: `${successCount} leads importés et contactés. ${errorCount} erreurs.`
    }
}
