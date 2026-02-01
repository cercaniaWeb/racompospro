import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno";
import { aiFetch } from "../shared/utils.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { query } = await req.json();

        if (!query) {
            throw new Error('Query is required');
        }

        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!geminiApiKey || !supabaseUrl || !supabaseServiceKey) {
            throw new Error('Missing environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // --- STEP 1: Text to SQL ---
        const schemaContext = `
        Tables:
        - sales (id, total, payment_method, created_at, user_id)
        - sale_items (id, sale_id, product_id, quantity, price, subtotal)
        - products (id, name, category, price, stock, min_stock)
        
        Rules:
        - Use Postgres SQL dialect.
        - Use 'created_at' for date filtering.
        - For "today", use CURRENT_DATE.
        - For "last week", use created_at >= NOW() - INTERVAL '7 days'.
        - For "top products", JOIN sale_items with products ON sale_items.product_id = products.id, group by products.name and sum quantity.
        - Limit results to 20 rows max unless specified.
        - ALWAYS use Spanish aliases for columns (e.g., SELECT count(*) AS "Total Ventas").
        - Translate common values using CASE:
          - payment_method: 'card' -> 'Tarjeta', 'cash' -> 'Efectivo', 'transfer' -> 'Transferencia'.
        - Return ONLY the raw SQL query. No markdown, no explanations.
        `;

        const sqlPrompt = `
        You are a SQL expert. Convert this natural language query into a SQL query for the provided schema.
        Query: "${query}"
        ${schemaContext}
        `;

        const sqlResponse = await aiFetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: sqlPrompt }] }]
                })
            }
        );

        const sqlData = await sqlResponse.json();
        let generatedSql = sqlData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Clean SQL (remove markdown code blocks)
        generatedSql = generatedSql.replace(/```sql/g, '').replace(/```/g, '').trim();

        console.log('Generated SQL:', generatedSql);

        // --- STEP 2: Execute SQL ---
        const { data: queryResult, error: dbError } = await supabase.rpc('execute_report_query', {
            query_text: generatedSql
        });

        if (dbError) {
            // If SQL fails, return the error but try to be helpful
            console.error('SQL Execution Error:', dbError);
            return new Response(
                JSON.stringify({
                    text: `No pude ejecutar la consulta. Error técnico: ${dbError.message}`,
                    sql: generatedSql,
                    data: []
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Handle empty results
        if (!queryResult || queryResult.length === 0 || (queryResult.error)) {
            return new Response(
                JSON.stringify({
                    text: "No encontré datos que coincidan con tu búsqueda.",
                    sql: generatedSql,
                    data: []
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // --- STEP 3: Summarize Data ---
        const summaryPrompt = `
        You are a helpful data analyst assistant.
        User Query: "${query}"
        Data Found: ${JSON.stringify(queryResult).slice(0, 5000)} (truncated if too long)

        Task:
        1. Answer the user's query based ONLY on the data provided.
        2. Be concise and professional.
        3. Respond in SPANISH.
        4. If the data is a list, summarize the top items.
        5. Format numbers as currency if they look like money.
        `;

        const summaryResponse = await aiFetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: summaryPrompt }] }]
                })
            }
        );

        const summaryData = await summaryResponse.json();
        const summaryText = summaryData.candidates?.[0]?.content?.parts?.[0]?.text || 'Aquí están los datos encontrados.';

        return new Response(
            JSON.stringify({
                text: summaryText,
                data: queryResult,
                sql: generatedSql
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
