import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Twilio from 'twilio';

// Initialize Supabase Admin Client (to bypass RLS for webhooks)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Twilio Client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const client = Twilio(accountSid, authToken);

export async function POST(req: Request) {
    try {
        // 1. Parse Form Data from Twilio
        const formData = await req.formData();
        const from = formData.get('From') as string;
        const to = formData.get('To') as string;

        console.log(`📞 Incoming call from ${from}`);

        // 2. Fetch Company Name from Profiles (take the first one found for MVP)
        const { data: profile } = await supabase
            .from('profiles')
            .select('company_name')
            .limit(1)
            .single();

        const companyName = profile?.company_name || 'SolarFlash';

        // 3. Check if lead exists
        const { data: existingLead } = await supabase
            .from('leads')
            .select('*')
            .eq('phone', from)
            .single();

        let leadId = existingLead?.id;

        // 4. Create or Update Lead
        if (!existingLead) {
            const { data: newLead, error: createError } = await supabase
                .from('leads')
                .insert([
                    {
                        name: 'Appel Manqué', // Placeholder name
                        phone: from,
                        status: 'Nouveau',
                        source: 'Appel Manqué',
                        conversation_history: [{
                            role: 'system',
                            content: 'Appel manqué détecté. SMS de rattrapage envoyé.'
                        }]
                    }
                ])
                .select()
                .single();

            if (newLead) leadId = newLead.id;
        } else {
            // Update history for existing lead
            const currentHistory = existingLead.conversation_history || [];
            const newHistory = [
                ...currentHistory,
                {
                    role: 'system',
                    content: 'Appel manqué détecté. SMS de rattrapage envoyé.'
                }
            ];

            await supabase
                .from('leads')
                .update({ conversation_history: newHistory })
                .eq('id', leadId);
        }

        // 5. Send Text Back SMS
        const smsBody = `Bonjour, c'est ${companyName}. Je suis actuellement sur un toit. Comment puis-je vous aider ?`;

        await client.messages.create({
            body: smsBody,
            from: twilioNumber,
            to: from,
        });

        // Update history with the sent SMS
        if (leadId) {
            const { data: lead } = await supabase
                .from('leads')
                .select('conversation_history')
                .eq('id', leadId)
                .single();

            if (lead) {
                const updatedHistory = [
                    ...(lead.conversation_history || []),
                    { role: 'assistant', content: smsBody }
                ];

                await supabase
                    .from('leads')
                    .update({ conversation_history: updatedHistory, status: 'SMS Envoyé' })
                    .eq('id', leadId);
            }
        }

        // 6. Return TwiML Response
        const twiml = `
            <Response>
                <Say voice="alice" language="fr-FR">Bonjour, nous sommes actuellement sur un chantier. Nous vous envoyons un SMS tout de suite.</Say>
                <Hangup/>
            </Response>
        `;

        return new NextResponse(twiml, {
            headers: {
                'Content-Type': 'text/xml',
            },
        });

    } catch (error: any) {
        console.error('Error processing incoming voice:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
