import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { aiFetch } from '../shared/utils.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatbotRequest {
    query: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { query }: ChatbotRequest = await req.json();

        if (!query) {
            return new Response(
                JSON.stringify({ error: 'Query is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        );

        // Multi-provider AI support: Try Gemini (free) -> DeepSeek (cheap) -> OpenAI (fallback)
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

        const systemPrompt = `You are a SQL expert. Convert natural language queries about sales data into PostgreSQL queries.
Available tables:
- sales (id, store_id, customer_id, sale_date, total_amount, status, processed_by, created_at)
- sale_items (id, sale_id, product_id, quantity, unit_price, total_price)
- products (id, name, sku, price, cost)
- stores (id, name, address, type)

Only generate SELECT queries. No INSERT, UPDATE, DELETE, or DROP.
Always include proper JOINs and use meaningful column aliases.
Return ONLY the SQL query without explanation.`;

        let sqlQuery: string | undefined;
        let aiProvider = 'none';

        // Try Gemini first (free tier available)
        if (geminiApiKey && !sqlQuery) {
            try {
                const geminiResponse = await aiFetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: `${systemPrompt}\n\nUser query: ${query}`
                                }]
                            }],
                            generationConfig: {
                                temperature: 0.3,
                                maxOutputTokens: 1000,
                            }
                        }),
                    }
                );

                if (geminiResponse.ok) {
                    const geminiData = await geminiResponse.json();
                    sqlQuery = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                    if (sqlQuery) aiProvider = 'gemini';
                }
            } catch (error) {
                console.log('Gemini failed, trying DeepSeek...', error);
            }
        }

        // Try DeepSeek (very cheap)
        if (deepseekApiKey && !sqlQuery) {
            try {
                const deepseekResponse = await aiFetch('https://api.deepseek.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${deepseekApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: query }
                        ],
                        temperature: 0.3,
                    }),
                });

                if (deepseekResponse.ok) {
                    const deepseekData = await deepseekResponse.json();
                    sqlQuery = deepseekData.choices?.[0]?.message?.content?.trim();
                    if (sqlQuery) aiProvider = 'deepseek';
                }
            } catch (error) {
                console.log('DeepSeek failed, trying OpenAI...', error);
            }
        }

        // Fallback to OpenAI
        if (openaiApiKey && !sqlQuery) {
            try {
                const openaiResponse = await aiFetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${openaiApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: query }
                        ],
                        temperature: 0.3,
                    }),
                });

                if (openaiResponse.ok) {
                    const openaiData = await openaiResponse.json();
                    sqlQuery = openaiData.choices?.[0]?.message?.content?.trim();
                    if (sqlQuery) aiProvider = 'openai';
                }
            } catch (error) {
                console.error('All AI providers failed:', error);
            }
        }

        if (!sqlQuery) {
            return new Response(
                JSON.stringify({ error: 'Failed to generate SQL query' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate SQL query (ensure it's read-only)
        const lowerQuery = sqlQuery.toLowerCase();
        if (
            lowerQuery.includes('insert') ||
            lowerQuery.includes('update') ||
            lowerQuery.includes('delete') ||
            lowerQuery.includes('drop') ||
            lowerQuery.includes('truncate') ||
            lowerQuery.includes('alter')
        ) {
            return new Response(
                JSON.stringify({ error: 'Only SELECT queries are allowed' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Execute SQL query
        const { data, error } = await supabaseClient.rpc('execute_sql', {
            query: sqlQuery
        });

        if (error) {
            console.error('SQL execution error:', error);
            return new Response(
                JSON.stringify({ error: 'Failed to execute query', details: error.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({
                data,
                sql: sqlQuery,
                userQuery: query
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Chatbot function error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
