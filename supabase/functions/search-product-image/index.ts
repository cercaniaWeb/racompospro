import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { aiFetch } from "../shared/utils.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { query } = await req.json()

        if (!query) {
            throw new Error('Query parameter is required')
        }

        console.log(`Searching for image for: ${query}`)

        const GOOGLE_API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY')
        const GOOGLE_CX = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID')

        let imageUrl = null
        let data = null

        if (GOOGLE_API_KEY && GOOGLE_CX) {
            // Real Search
            const searchUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${GOOGLE_CX}&key=${GOOGLE_API_KEY}&searchType=image&num=1&safe=active`

            const response = await aiFetch(searchUrl, { method: 'GET' })
            data = await response.json()
            console.log('Google API Response:', JSON.stringify(data))

            if (data.items && data.items.length > 0) {
                imageUrl = data.items[0].link
            } else {
                console.log('No results found from Google API, using fallback')
                imageUrl = `https://placehold.co/600x400/1a1a1a/ffffff/png?text=${encodeURIComponent(query)}`
            }
        } else {
            // Mock Search / Fallback for Demo
            console.log('Google API keys not found, using fallback/mock')
            // Using a reliable placeholder service with the query as text
            imageUrl = `https://placehold.co/600x400/1a1a1a/ffffff/png?text=${encodeURIComponent(query)}`
        }

        if (!imageUrl) {
            return new Response(
                JSON.stringify({ error: 'No image found', googleResponse: data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        return new Response(
            JSON.stringify({ imageUrl, source: GOOGLE_API_KEY ? 'google' : 'mock' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
