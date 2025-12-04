import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Twilio from 'twilio';

// Initialisation des clients (Admin pour contourner le RLS si besoin)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const twilioClient = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function POST(request: Request) {
    try {
        // 1. Lire les données envoyées par Twilio (FormData)
        const formData = await request.formData();
        const from = formData.get('From') as string;
        const body = formData.get('Body') as string;

        if (!from || !body) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

        console.log(`SMS reçu de ${from}: ${body}`);

        // 2. Retrouver le lead
        const { data: lead, error: leadError } = await supabase
            .from('leads')
            .select('*')
            .eq('phone', from)
            .single();

        if (leadError || !lead) {
            console.log("Lead non trouvé, ignoré.");
            return NextResponse.json({ message: 'Lead not found' }, { status: 200 });
        }

        // 3. Récupérer la config (Calendly) - On prend le premier profil dispo pour simplifier
        const { data: profile } = await supabase.from('profiles').select('calendly_url, ai_name, company_name').limit(1).single();
        const calendlyUrl = profile?.calendly_url || "https://calendly.com";
        const aiName = profile?.ai_name || "Sarah";
        const companyName = profile?.company_name || "SolarFlash";

        // 4. Mettre à jour l'historique (Message du Client)
        let history = lead.conversation_history || [];
        history.push({ role: 'user', content: body });

        // 5. Générer la réponse IA
        if (lead.ai_paused) {
            console.log("IA en pause, pas de réponse auto.");
            return NextResponse.json({ message: 'AI paused' });
        }

        const systemPrompt = `Tu es ${aiName}, assistante chez ${companyName}.
    Ton but est de qualifier le prospect pour le solaire.
    Si le prospect est intéressé et qualifié, propose un RDV et donne UNIQUEMENT ce lien : ${calendlyUrl}.
    Sois courte, empathique et professionnelle.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...history.map((msg: any) => ({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content }))
            ]
        });

        const aiResponse = completion.choices[0].message.content || "Désolé, je n'ai pas compris.";

        // 6. Envoyer le SMS
        await twilioClient.messages.create({
            body: aiResponse,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: from
        });

        // 7. Sauvegarder la réponse IA
        history.push({ role: 'ai', content: aiResponse });
        await supabase.from('leads').update({
            conversation_history: history,
            status: 'En Discussion',
            updated_at: new Date().toISOString()
        }).eq('id', lead.id);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Erreur API SMS:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
