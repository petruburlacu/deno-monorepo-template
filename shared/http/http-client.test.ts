import { assert } from 'https://deno.land/std/assert/mod.ts';
import { assertSpyCall, assertSpyCalls, type Spy, spy } from 'jsr:@std/testing/mock';
import { assertEquals, assertRejects } from 'jsr:@std/assert';
import { HttpClient } from './http-client.ts';
import type { HttpError, Middleware } from '@shared/http';

Deno.test('HttpClient', async (t) => {
    const originalFetch = globalThis.fetch;
    const mockResponse = (status = 200, data = {}) => Promise.resolve(new Response(JSON.stringify(data), { status }));

    await t.step('Basic HTTP Methods', async (t) => {
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

        await t.step('should make POST request with data', async () => {
            globalThis.fetch = spy(() => mockResponse());

            const client = new HttpClient({ baseUrl: 'http://api.test' });
            const data = { name: 'test' };

            await client.post('/users', data);

            assertSpyCalls(globalThis.fetch as unknown as Spy, 1);
            assertSpyCall(globalThis.fetch as unknown as Spy, 0, {
                args: [
                    'http://api.test/users',
                    {
                        method: 'POST',
                        headers: new Headers({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify(data),
                        signal: new AbortController().signal,
                    },
                ],
            });

            globalThis.fetch = originalFetch;
        });

        await t.step('should make PUT request with data', async () => {
            globalThis.fetch = spy(() => mockResponse());

            const client = new HttpClient({ baseUrl: 'http://api.test' });
            const data = { name: 'updated' };

            await client.put('/users/1', data);

            assertSpyCalls(globalThis.fetch as unknown as Spy, 1);
            assertSpyCall(globalThis.fetch as unknown as Spy, 0, {
                args: [
                    'http://api.test/users/1',
                    {
                        method: 'PUT',
                        headers: new Headers({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify(data),
                        signal: new AbortController().signal,
                    },
                ],
            });

            globalThis.fetch = originalFetch;
        });

        await t.step('should make DELETE request', async () => {
            globalThis.fetch = spy(() => mockResponse());

            const client = new HttpClient({ baseUrl: 'http://api.test' });
            await client.delete('/users/1');

            assertSpyCalls(globalThis.fetch as unknown as Spy, 1);
            assertSpyCall(globalThis.fetch as unknown as Spy, 0, {
                args: [
                    'http://api.test/users/1',
                    {
                        method: 'DELETE',
                        headers: new Headers({ 'Content-Type': 'application/json' }),
                        body: null,
                        signal: new AbortController().signal,
                    },
                ],
            });

            globalThis.fetch = originalFetch;
        });
    });

    await t.step('URL Handling', async (t) => {
        await t.step('should handle trailing slashes in baseUrl', async () => {
            globalThis.fetch = spy(() => mockResponse());

            const client = new HttpClient({ baseUrl: 'http://api.test/' });
            await client.get('/users');

            assertSpyCall(globalThis.fetch as unknown as Spy, 0, {
                args: ['http://api.test/users', {
                    method: 'GET',
                    headers: new Headers({ 'Content-Type': 'application/json' }),
                    body: null,
                    signal: new AbortController().signal,
                }],
            });

            globalThis.fetch = originalFetch;
        });

        await t.step('should handle query parameters', async () => {
            globalThis.fetch = spy(() => mockResponse());

            const client = new HttpClient({ baseUrl: 'http://api.test' });
            await client.get('/users', {
                params: { page: '1', limit: '10' },
            });

            assertSpyCall(globalThis.fetch as unknown as Spy, 0, {
                args: [
                    'http://api.test/users?page=1&limit=10',
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
    });

    await t.step('Headers Management', async (t) => {
        await t.step('should merge default and request headers', async () => {
            globalThis.fetch = spy(() => mockResponse());

            const client = new HttpClient({
                baseUrl: 'http://api.test',
                headers: { 'X-API-Key': 'test' },
            });

            await client.get('/users', {
                headers: { 'Custom-Header': 'value' },
            });

            assertSpyCall(globalThis.fetch as unknown as Spy, 0, {
                args: [
                    'http://api.test/users',
                    {
                        method: 'GET',
                        headers: new Headers({
                            'Content-Type': 'application/json',
                            'X-API-Key': 'test',
                            'Custom-Header': 'value',
                        }),
                        body: null,
                        signal: new AbortController().signal,
                    },
                ],
            });

            globalThis.fetch = originalFetch;
        });
    });

    await t.step('Circuit Breaker', async (t) => {
        const originalNow = Date.now;

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

            // Circuit should be open now
            await assertRejects(
                () => client.get('/test'),
                Error,
                'Circuit breaker is open',
            );

            globalThis.fetch = originalFetch;
            Date.now = originalNow;
        });

        await t.step('should reset circuit after cooldown period', async () => {
            let shouldFail = true;
            globalThis.fetch = spy(() => {
                if (shouldFail) {
                    return Promise.reject(new Error('Network error'));
                }
                return mockResponse();
            });

            const client = new HttpClient({ baseUrl: 'http://api.test' });
            Date.now = () => 0; // Start at 0

            // Force circuit open
            for (let i = 0; i < 5; i++) {
                try {
                    await client.get('/test');
                } catch {
                    // Expected error
                }
            }

            // Move time forward and allow requests to succeed
            shouldFail = false;
            Date.now = () => 70000; // 70 seconds later

            await client.get('/test'); // Should succeed

            globalThis.fetch = originalFetch;
            Date.now = originalNow;
        });
    });

    await t.step('Request Queue & Rate Limiting', async (t) => {
        await t.step('should queue requests when hitting concurrency limit', async () => {
            const client = new HttpClient({
                baseUrl: 'http://api.test',
                maxConcurrent: 2,
            });

            const delays = [100, 50, 25];
            globalThis.fetch = spy(async () => {
                await new Promise((resolve) => setTimeout(resolve, delays.shift() ?? 0));
                return mockResponse();
            });

            const startTime = Date.now();
            await Promise.all([
                client.get('/1'),
                client.get('/2'),
                client.get('/3'),
            ]);
            const duration = Date.now() - startTime;

            assert(duration >= 100);
            globalThis.fetch = originalFetch;
        });

        await t.step('should enforce rate limits', async () => {
            const client = new HttpClient({
                baseUrl: 'http://api.test',
                rateLimit: {
                    requests: 2,
                    perSeconds: 1,
                },
            });

            globalThis.fetch = spy(() => mockResponse());
            const startTime = Date.now();
            await Promise.all([
                client.get('/1'),
                client.get('/2'),
                client.get('/3'),
            ]);
            const duration = Date.now() - startTime;

            assert(duration >= 1000);
            globalThis.fetch = originalFetch;
        });
    });

    await t.step('Caching', async (t) => {
        const originalNow = Date.now;
        await t.step('should cache responses', async () => {
            globalThis.fetch = spy(() => mockResponse());
            const client = new HttpClient({ baseUrl: 'http://api.test' });

            await client.get('/users', { cache: { ttl: 1000 } });
            await client.get('/users', { cache: { ttl: 1000 } });

            assertSpyCalls(globalThis.fetch as unknown as Spy, 1);
            globalThis.fetch = originalFetch;
        });

        await t.step('should respect cache TTL', async () => {
            globalThis.fetch = spy(() => mockResponse());
            const client = new HttpClient({ baseUrl: 'http://api.test' });

            const now = Date.now();
            Date.now = () => now;

            await client.get('/users', { cache: { ttl: 1000 } });
            Date.now = () => now + 1001;
            await client.get('/users', { cache: { ttl: 1000 } });

            assertSpyCalls(globalThis.fetch as unknown as Spy, 2);

            Date.now = originalNow;
            globalThis.fetch = originalFetch;
        });
    });

    await t.step('Middleware', async (t) => {
        await t.step('should execute middleware in correct order', async () => {
            globalThis.fetch = spy(() => mockResponse());
            const order: string[] = [];
            const middleware: Middleware = {
                pre: (config) => {
                    order.push('pre');
                    return Promise.resolve(config);
                },
                post: (response) => {
                    order.push('post');
                    return Promise.resolve(response);
                },
                error: (error) => {
                    order.push('error');
                    throw Promise.reject(error);
                },
            };

            const client = new HttpClient({
                baseUrl: 'http://api.test',
                middlewares: [middleware],
            });

            await client.get('/test');
            assertEquals(order, ['pre', 'post']);
            globalThis.fetch = originalFetch;
        });

        await t.step('should handle middleware errors', async () => {
            globalThis.fetch = spy(() => mockResponse());
            const middleware: Middleware = {
                pre: () => Promise.reject(new Error('Middleware error')),
            };

            const client = new HttpClient({
                baseUrl: 'http://api.test',
                middlewares: [middleware],
            });

            await assertRejects(
                () => client.get('/test'),
                Error,
                'Middleware error',
            );
            globalThis.fetch = originalFetch;
        });
    });

    await t.step('Error Handling', async (t) => {
        await t.step('should handle network errors', async () => {
            globalThis.fetch = spy(() => Promise.reject(new Error('Network error')));

            const client = new HttpClient({ baseUrl: 'http://api.test' });

            await assertRejects(
                () => client.get('/test'),
                Error,
                'Network error',
            );

            globalThis.fetch = originalFetch;
        });

        await t.step('should handle malformed JSON responses', async () => {
            globalThis.fetch = spy(() => Promise.resolve(new Response('invalid json')));

            const client = new HttpClient({ baseUrl: 'http://api.test' });

            const error = await assertRejects(() => client.get('/test')) as HttpError;
            assertEquals(error.code, 'PARSE_ERROR');

            globalThis.fetch = originalFetch;
        });
    });
});
