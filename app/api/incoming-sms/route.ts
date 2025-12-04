import { NextResponse } from 'next/server';
import twilio from 'twilio';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase Admin Client (to bypass RLS for webhooks)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

        // 2. Fetch Company Name and Calendly URL from Profiles (take the first one found for MVP)
        // Using admin client so no auth.getUser() needed
        const { data: profile } = await supabase
            .from('profiles' as any)
            .select('company_name, calendly_url')
            .limit(1)
            .single() as any;

        const companyName = profile?.company_name || 'SolarFlash';
        const calendlyUrl = profile?.calendly_url || '';

        // 3. Find lead in Supabase
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

        // 4. Update conversation history with user message
        let history = lead.conversation_history || [];
        if (!Array.isArray(history)) {
            history = [];
        }

        history.push({ role: 'user', content: body });

        // 5. Generate response with OpenAI (ONLY IF AI IS NOT PAUSED)
        // Wrapped in try/catch to ensure user message is saved even if AI fails
        let aiResponse = null;

        if (!lead.ai_paused) {
            try {
                const systemPrompt = `Tu es Sarah, assistante chez ${companyName}. Tu discutes par SMS avec un potentiel client (${lead.name}). 
                Ton but est de qualifier le lead (propriétaire ? type de toit ? facture électricité ?). 
                Sois brève, empathique et naturelle. Ne pose qu'une seule question à la fois.
                
                Ton but ultime est le RDV. Si le prospect semble qualifié (propriétaire) et intéressé, propose un RDV et envoie ce lien exact : ${calendlyUrl}. 
                N'envoie le lien que si l'intérêt est confirmé.`;

                const messages = [
                    {
                        role: 'system',
                        content: systemPrompt,
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
                    // Send SMS with Twilio
                    await client.messages.create({
                        body: aiResponse,
                        from: twilioNumber,
                        to: from,
                    });

                    history.push({ role: 'assistant', content: aiResponse });
                }
            } catch (aiError) {
                console.error('Error generating/sending AI response:', aiError);
                // We don't throw here, so we can still save the user message
            }
        } else {
            console.log('AI is paused for this lead. Skipping auto-response.');
        }

        // 6. Save conversation history (User message + potential AI response)
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
