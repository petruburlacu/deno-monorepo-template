import type { Middleware } from '@shared/http';

export function createAuthMiddleware(getToken: () => string | Promise<string>): Middleware {
    return {
        pre: async (config) => {
            const token = await getToken();
            return {
                ...config,
                headers: {
                    ...config.headers,
                    'Authorization': `Bearer ${token}`,
                },
            };
        },
    };
}
