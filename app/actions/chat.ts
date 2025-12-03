'use server'

import { createClient } from '@/utils/supabase/server'
import Twilio from 'twilio'
import { revalidatePath } from 'next/cache'

const twilioClient = Twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
)

export async function sendManualMessage(leadId: string, message: string) {
    const supabase = createClient()

    // 1. Fetch lead to get phone number
    const { data: lead, error } = await supabase
        .from('leads' as any)
        .select('*')
        .eq('id', leadId)
        .single() as any

    if (!lead || error) {
        console.error('Lead not found or error:', error)
        return { success: false, error: 'Lead not found' }
    }

    try {
        // 2. Send SMS via Twilio
        await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: lead.phone
        })

        // 3. Update Supabase
        // Append message to history and pause AI
        const newHistory = [
            ...(lead.conversation_history || []),
            { role: 'assistant', content: message, type: 'manual' }
        ]

        const { error: updateError } = await supabase
            .from('leads' as any)
            .update({
                conversation_history: newHistory,
                ai_paused: true // Pause AI when human intervenes
            })
            .eq('id', leadId)

        if (updateError) {
            console.error('Error updating lead:', updateError)
            return { success: false, error: 'Failed to update lead' }
        }

        revalidatePath(`/dashboard/chat/${leadId}`)
        return { success: true }

    } catch (err: any) {
        console.error('Error sending SMS:', err)
        return { success: false, error: err.message }
    }
}
