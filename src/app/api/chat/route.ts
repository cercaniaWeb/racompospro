import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query } = body;

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Mock response for now as we don't have the AI service configured
        // In a real implementation, this would call OpenAI or another LLM
        const mockResponse = {
            data: [
                { product: 'Coca Cola', sales: 150, revenue: 3750 },
                { product: 'Pepsi', sales: 120, revenue: 2800 },
                { product: 'Sabritas', sales: 90, revenue: 1800 },
            ],
            sql: "SELECT product, sales, revenue FROM sales_report WHERE date >= '2023-01-01' ORDER BY sales DESC LIMIT 3",
            message: `Aquí tienes los datos simulados para tu consulta: "${query}". (La integración real con IA requiere configuración de API Key)`
        };

        return NextResponse.json(mockResponse);
    } catch (error: any) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
