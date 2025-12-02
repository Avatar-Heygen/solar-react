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
        const body = await request.json();
        const { phone, name } = body;

        if (!phone || !name) {
            return NextResponse.json(
                { success: false, error: 'Phone and name are required' },
                { status: 400 }
            );
        }

        const supabase = createClient();

        // 1. Insert lead into Supabase
        const { data: lead, error: insertError } = await (supabase as any)
            .from('leads')
            .insert([
                { name, phone, status: 'Nouveau', conversation_history: [] }
            ])
            .select()
            .single() as any;

        if (insertError) {
            console.error('Error inserting lead:', insertError);
            throw new Error('Failed to insert lead');
        }

        // 2. Generate message with OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Tu es Sarah, assistante chez SolarFlash. Un nouveau lead vient d'arriver : ${name}. Rédige un SMS très court (max 160 caractères), empathique et professionnel pour valider qu'il est bien propriétaire. Ne sois pas trop formelle, sois humaine.`,
                },
            ],
        });

        const aiMessage = completion.choices[0].message.content;

        if (!aiMessage) {
            throw new Error('Failed to generate message from OpenAI');
        }

        // 3. Send SMS with Twilio
        const message = await client.messages.create({
            body: aiMessage,
            from: twilioNumber,
            to: phone,
        });

        // 4. Update lead status to "SMS Envoyé"
        if (message.sid) {
            const { error: updateError } = await (supabase as any)
                .from('leads')
                .update({ status: 'SMS Envoyé' })
                .eq('id', lead.id);

            if (updateError) {
                console.error('Error updating lead status:', updateError);
                // We don't throw here because the SMS was sent successfully
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Lead processed and SMS sent',
            leadId: lead.id
        });

    } catch (error: any) {
        console.error('Error processing incoming lead:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
