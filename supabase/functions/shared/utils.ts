/**
 * Utility for executing a function with exponential backoff and retries.
 * Optimized for handling 503 (Overloaded) and 429 (Rate Limit) errors.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // If it's a Fetch response with error status
            if (error instanceof Response) {
                if (error.status !== 503 && error.status !== 429) {
                    throw error;
                }
            } else if (error.message && !error.message.includes('503') && !error.message.includes('429')) {
                // Simple heuristic for generic error messages
                // In a real scenario, we might want to check the actual response status from the AI provider
            }

            if (attempt === maxRetries - 1) break;

            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms... (Error: ${error.message || error.statusText || 'Unknown'})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Enhanced fetch with retry specifically for AI providers.
 */
export async function aiFetch(
    url: string,
    options: RequestInit,
    maxRetries: number = 3
): Promise<Response> {
    return withRetry(async () => {
        const response = await fetch(url, options);

        if (!response.ok) {
            // Throw the response object so withRetry can check the status
            if (response.status === 503 || response.status === 429) {
                throw response;
            }
        }

        return response;
    }, maxRetries);
}
