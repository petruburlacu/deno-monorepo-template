import { assertSpyCall, assertSpyCalls, type Spy, spy } from 'jsr:@std/testing/mock';
import { HttpClient } from '../../http-client.ts';

Deno.test('HTTP Methods', async (t) => {
    const originalFetch = globalThis.fetch;
    const mockResponse = (status = 200, data = {}) => Promise.resolve(new Response(JSON.stringify(data), { status }));

    await t.step('should make GET request', async () => {
        globalThis.fetch = spy(() => mockResponse());

        const client = new HttpClient({ baseUrl: 'http://api.test' });
        await client.get('/users');

        assertSpyCalls(globalThis.fetch as unknown as Spy, 1);
        assertSpyCall(globalThis.fetch as unknown as Spy, 0, {
            args: [
                'http://api.test/users',
                {
                    method: 'GET',
                    headers: new Headers({ 'Content-Type': 'application/json' }),
                    body: null,
                    signal: new AbortController().signal,
                },
            ],
        });

        globalThis.fetch = originalFetch;
    });

    // ... other method tests
});
