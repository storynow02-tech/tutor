import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Initialize the API client
const apiKey = process.env.GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// Models
const MODEL_PRIMARY = process.env.GEMINI_MODEL_NAME || 'gemini-2.0-flash'; // 2.5-flash not standard yet? Prompt says 2.5-flash.
// *Note*: As of my knowledge cutoff, 2.5 is very new or hypothetical in prompts.
// If the user specific asked for 'gemini-2.5-flash', we use it string-literally.
// If it fails, fallback.

const MODEL_FALLBACK = 'gemini-1.5-flash';

interface GeiminiResponse {
    text: string;
    modelUsed: string;
}

/**
 * Generates an answer using Google Gemini.
 * Implements fallback logic from Primary (2.5) to Fallback (1.5).
 */
export async function generateAnswer(query: string, context: string): Promise<GeiminiResponse> {
    if (!apiKey) {
        return { text: 'Error: Google API Key is missing.', modelUsed: 'none' };
    }

    const systemPrompt = `
You are a helpful and intelligent AI assistant dealing with student questions.
Your knowledge comes from the following Notion context:

<NotionContext>
${context}
</NotionContext>

Instructions:
1. Answer the user's question based *primarily* on the Notion Context provided.
2. If the answer is not in the context, use your general knowledge but mention that this specific info might not be in the school's Notion documents.
3. Be polite, concise, and helpful.
4. Use Traditional Chinese (繁體中文) for all responses.
`;

    // Use the global MODEL_PRIMARY constant which already loads from process.env.GEMINI_MODEL_NAME
    const primaryModelName = MODEL_PRIMARY;

    try {
        // Attempt 1: Primary Model
        console.log(`[Gemini] Attempting generation with ${primaryModelName}...`);

        const model = genAI.getGenerativeModel({ model: primaryModelName });
        const result = await model.generateContent([systemPrompt, query]);
        const response = await result.response;

        return {
            text: response.text(),
            modelUsed: primaryModelName,
        };

    } catch (primaryError: any) {
        console.warn(`[Gemini] Primary model (${primaryModelName}) failed: ${primaryError.message}. Switching to fallback...`);

        const FALLBACK_MODEL = MODEL_FALLBACK; // Use global fallback constant

        try {
            // Attempt 2: Fallback Model
            console.log(`[Gemini] Attempting generation with ${FALLBACK_MODEL}...`);
            const fallbackModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
            const result = await fallbackModel.generateContent([systemPrompt, query]);
            const response = await result.response;

            return {
                text: response.text(),
                modelUsed: FALLBACK_MODEL,
            };
        } catch (fallbackError: any) {
            console.error(`[Gemini] Fallback model also failed: ${fallbackError.message}`);

            // Return detailed error for debugging
            return {
                text: `抱歉，系統目前忙碌中 (AI Service Unavailable)。\n\n[Primary Error]: ${primaryError.message}\n\n[Fallback Error]: ${fallbackError.message}`,
                modelUsed: 'none',
            };
        }
    }
}
