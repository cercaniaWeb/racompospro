import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    data?: any[];
    sql?: string;
    timestamp: Date;
}

export function useChatbot() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendQuery = async (query: string) => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);

        // Add user message
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: query,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('No authenticated session');
            }

            const { data: result, error: funcError } = await supabase.functions.invoke('sales-reporter', {
                body: { query }
            });

            if (funcError) {
                throw new Error(funcError.message || 'Failed to process query');
            }

            // Add assistant message
            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.text || 'No se pudo generar una respuesta.',
                data: result.data,
                sql: result.sql,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err: any) {
            console.error('Chatbot error:', err);
            setError(err.message);

            // Add error message
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Error: ${err.message}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = () => {
        setMessages([]);
        setError(null);
    };

    return {
        messages,
        loading,
        error,
        sendQuery,
        clearHistory
    };
}
