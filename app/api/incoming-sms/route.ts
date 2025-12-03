import { NextResponse } from 'next/server';
import twilio from 'twilio';
import OpenAI from 'openai';
import { createClient } from '@/utils/supabase/server';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        // 1. Parse Form Data (Twilio webhook format)
        const formData = await request.formData();
        const from = formData.get('From') as string;
        const body = formData.get('Body') as string;

        if (!from || !body) {
            return NextResponse.json(
                { success: false, error: 'From and Body are required' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // 2. Find lead in Supabase
        const { data: lead, error: fetchError } = await supabase
            .from('leads' as any)
            .select('*')
            .eq('phone', from)
            .single() as any;

        if (fetchError || !lead) {
            console.error('Lead not found or error:', fetchError);
            return NextResponse.json(
                { success: false, error: 'Lead not found' },
                { status: 404 }
            );
        }

        // 3. Update conversation history with user message
        let history = lead.conversation_history || [];
        if (!Array.isArray(history)) {
            history = [];
        }

        history.push({ role: 'user', content: body });

        // 4. Generate response with OpenAI (ONLY IF AI IS NOT PAUSED)
        let aiResponse = null;

        if (!lead.ai_paused) {
            const messages = [
                {
                    role: 'system',
                    content: `Tu es Sarah, assistante chez SolarFlash. Tu discutes par SMS avec un potentiel client (${lead.name}). Ton but est de qualifier le lead (propriétaire ? type de toit ? facture électricité ?). Sois brève, empathique et naturelle. Ne pose qu'une seule question à la fois.`,
                },
                ...history.map((msg: any) => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content
                }))
            ];

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: messages as any,
            });

            aiResponse = completion.choices[0].message.content;

            if (aiResponse) {
                // 5. Send SMS with Twilio
                await client.messages.create({
                    body: aiResponse,
                    from: twilioNumber,
                    to: from,
                });

                history.push({ role: 'assistant', content: aiResponse });
            }
        } else {
            console.log('AI is paused for this lead. Skipping auto-response.');
        }

        const { error: updateError } = await (supabase as any)
            .from('leads')
            .update({
                conversation_history: history,
                status: lead.status === 'Nouveau' ? 'En Discussion' : lead.status
            })
            .eq('id', lead.id);

        if (updateError) {
            console.error('Error updating lead:', updateError);
            throw new Error('Failed to update lead');
        }

        return NextResponse.json({
            success: true,
            message: 'Reply processed and sent'
        });

    } catch (error: any) {
        console.error('Error processing incoming SMS:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
