import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3?target=deno';
import { aiFetch } from '../shared/utils.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SalesAnalysis {
    product_id: string;
    product_name: string;
    current_stock: number;
    avg_daily_sales: number;
    sales_trend: string;
    seasonal_pattern?: string;
}

interface ReorderSuggestion {
    product_id: string;
    suggested_quantity: number;
    days_until_depletion: number;
    confidence: number;
    reasoning: string;
    priority: 'urgent' | 'high' | 'normal' | 'low';
    store_id?: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

        if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
            throw new Error('Missing environment variables');
        }

        // Initialize Supabase client
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

        // Get store_id from request (optional, defaults to all stores)
        const { store_id } = await req.json().catch(() => ({ store_id: null }));

        // Fetch products with sales data
        const { data: salesData, error: salesError } = await supabaseClient.rpc(
            'get_sales_analysis',
            { p_store_id: store_id }
        );

        if (salesError) {
            console.error('Error fetching sales data:', salesError);
            return new Response(
                JSON.stringify({ error: 'Failed to fetch sales data', details: salesError }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!salesData || salesData.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No products to analyze', suggestions: [] }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Call Gemini API for AI analysis
        if (!geminiApiKey) {
            return new Response(
                JSON.stringify({ error: 'Gemini API key not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const systemPrompt = `You are an expert inventory management AI assistant for a retail store.
Analyze the provided sales data and current stock levels to suggest reorder quantities.
Focus on preventing stockouts for high-velocity items.

Rules:
1. Calculate daily sales rate based on the last 30 days of sales.
2. Estimate days until depletion: current_stock / daily_sales_rate.
3. Suggest reorder quantity to cover 14 days of demand + safety stock.
4. Priority levels:
   - "urgent": Depletion in < 3 days.
   - "high": Depletion in < 7 days.
   - "normal": Depletion in > 7 days but below reorder point.
5. Provide a brief reasoning for each suggestion STRICTLY IN SPANISH.
6. Ensure the response is valid JSON matching this schema:
   [
     {
       "product_id": "string",
       "suggested_quantity": number,
       "days_until_depletion": number,
       "confidence": number (0-1),
       "reasoning": "string",
       "priority": "urgent" | "high" | "normal" | "low",
       "store_id": "string" (optional)
     }
   ]

Return ONLY the JSON array.`;

        const geminiResponse = await aiFetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiApiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `${systemPrompt}\n\nSales Data:\n${JSON.stringify(salesData.slice(0, 50), null, 2)}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 8192,
                    }
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error after retries:', errorText);
            return new Response(
                JSON.stringify({ error: 'Failed to analyze with AI', details: errorText }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const geminiData = await geminiResponse.json();
        const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!aiResponse) {
            return new Response(
                JSON.stringify({ error: 'No AI response received', details: geminiData }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('DEBUG: Raw AI Response:', aiResponse);

        // Parse AI response
        let suggestions: ReorderSuggestion[];
        try {
            // Extract JSON array using regex
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            let cleanedResponse = jsonMatch ? jsonMatch[0] : aiResponse;

            // Clean up any remaining markdown or whitespace
            cleanedResponse = cleanedResponse.replace(/```json/g, '').replace(/```/g, '').trim();

            // Attempt to fix truncated JSON
            if (!cleanedResponse.endsWith(']')) {
                const lastClosingBrace = cleanedResponse.lastIndexOf('}');
                if (lastClosingBrace !== -1) {
                    cleanedResponse = cleanedResponse.substring(0, lastClosingBrace + 1) + ']';
                }
            }

            suggestions = JSON.parse(cleanedResponse);
        } catch (e) {
            console.error('Failed to parse AI response:', aiResponse);
            return new Response(
                JSON.stringify({ error: 'Failed to parse AI suggestions', details: aiResponse }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Deduplicate suggestions based on product_id and store_id
        const uniqueSuggestions = suggestions.reduce((acc, current) => {
            const x = acc.find(item => item.product_id === current.product_id && item.store_id === current.store_id);
            if (!x) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, [] as ReorderSuggestion[]);

        // Store suggestions in database
        const now = new Date();
        const suggestionsToInsert = uniqueSuggestions.map(sug => {
            const product = salesData.find((p: SalesAnalysis) => p.product_id === sug.product_id);
            const depletionDate = new Date(now);
            depletionDate.setDate(depletionDate.getDate() + sug.days_until_depletion);

            return {
                product_id: sug.product_id,
                store_id: product?.store_id || store_id,
                current_stock: product?.current_stock || 0,
                daily_sales_rate: product?.avg_daily_sales || 0,
                days_until_depletion: Math.round(sug.days_until_depletion),
                suggested_quantity: Math.ceil(sug.suggested_quantity),
                confidence_score: sug.confidence,
                estimated_depletion_date: depletionDate.toISOString(),
                status: 'pending',
                priority: sug.priority,
                ai_reasoning: sug.reasoning,
                analysis_date: now.toISOString(),
            };
        });

        const { data: insertedSuggestions, error: insertError } = await supabaseClient
            .from('reorder_suggestions')
            .upsert(suggestionsToInsert, { onConflict: 'product_id,store_id,status,analysis_date' })
            .select();

        if (insertError) {
            console.error('Error inserting suggestions:', insertError);
            return new Response(
                JSON.stringify({
                    error: 'Failed to store suggestions',
                    details: insertError.message,
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Return success with suggestions
        return new Response(
            JSON.stringify({
                success: true,
                analyzed_products: salesData.length,
                suggestions: insertedSuggestions,
                message: `Generated ${insertedSuggestions.length} reorder suggestions`
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Smart reorder analyzer error:', error);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
