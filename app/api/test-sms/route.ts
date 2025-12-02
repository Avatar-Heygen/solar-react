import { NextResponse } from 'next/server';
import twilio from 'twilio';
import OpenAI from 'openai';

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

        // Generate message with OpenAI
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

        console.log('Generated SMS:', aiMessage);

        const message = await client.messages.create({
            body: aiMessage,
            from: twilioNumber,
            to: phone,
        });

        return NextResponse.json({
            success: true,
            messageSid: message.sid,
            content: aiMessage,
        });
    } catch (error: any) {
        console.error('Error sending SMS:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
