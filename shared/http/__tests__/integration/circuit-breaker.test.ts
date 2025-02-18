import { assertRejects } from 'jsr:@std/assert';
import { spy } from 'jsr:@std/testing/mock';
import { HttpClient } from '../../http-client.ts';

Deno.test('Circuit Breaker', async (t) => {
    const originalFetch = globalThis.fetch;
    // const originalNow = Date.now;
    // const mockResponse = (status = 200, data = {}) => Promise.resolve(new Response(JSON.stringify(data), { status }));

    await t.step('should open circuit after threshold failures', async () => {
        globalThis.fetch = spy(() => Promise.reject(new Error('Network error')));
        const client = new HttpClient({ baseUrl: 'http://api.test' });

        // Force 5 failures
        for (let i = 0; i < 5; i++) {
            try {
                await client.get('/test');
            } catch {
                // Expected error
            }
        }

        await assertRejects(
            () => client.get('/test'),
            Error,
            'Circuit breaker is open',
        );

        globalThis.fetch = originalFetch;
    });

    // ... other circuit breaker tests
});
