/**
 * Utility for retrying asynchronous operations with exponential backoff.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelay?: number;
        backoffFactor?: number;
        retryableStatuses?: number[];
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        backoffFactor = 2,
        retryableStatuses = [429, 502, 503, 504],
    } = options;

    let lastError: any;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            const isRetryable =
                error.status && retryableStatuses.includes(error.status) ||
                error.message?.includes('fetch') ||
                error.code === 'PGRST116'; // Possible conflict or network error

            if (!isRetryable || attempt === maxRetries) {
                throw error;
            }

            console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= backoffFactor;
        }
    }

    throw lastError;
}
