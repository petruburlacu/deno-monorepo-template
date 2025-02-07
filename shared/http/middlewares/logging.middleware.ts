import type { Logger } from '@shared/logging';
import type { HttpError, HttpResponse, Middleware, RequestConfig } from '@shared/http';

export function createLoggingMiddleware(logger: Logger): Middleware {
    return {
        pre: (config: RequestConfig) => {
            logger.debug('HTTP Request', {
                method: config.method,
                url: config.url,
                headers: config.headers,
            });
            return Promise.resolve(config);
        },
        post: (response: HttpResponse<unknown>) => {
            logger.debug('HTTP Response', {
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
            });
            return Promise.resolve(response);
        },
        error: (error: HttpError) => {
            logger.error('HTTP Error', error, {
                label: 'HTTP_ERROR',
                status: error.status,
                data: error.data,
                url: error.url,
                method: error.config?.method,
                headers: error.config?.headers,
                params: error.config?.params,
                timeout: error.config?.timeout,
            });
            return Promise.reject(error);
        },
    };
}
