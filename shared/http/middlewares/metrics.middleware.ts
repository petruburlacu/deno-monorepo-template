import type { HttpError, HttpErrorMetrics, HttpMetrics, HttpResponse, Middleware, RequestConfig } from '@shared/http';
import type { MetricsCollector } from '@shared/metrics';

export function createMetricsMiddleware(collector: MetricsCollector): Middleware {
    return {
        pre: (config: RequestConfig) => {
            // Attach start time to config for duration calculation
            return Promise.resolve({
                ...config,
                startTime: Date.now(),
            });
        },
        post: (response: HttpResponse<unknown>) => {
            const duration = Date.now() - (response.config?.startTime ?? Date.now());
            const url = new URL(response.url);

            const metrics: HttpMetrics = {
                method: response.config?.method ?? 'GET',
                path: url.pathname,
                status: response.status,
                duration,
                labels: {
                    method: response.config?.method ?? 'GET',
                    path: url.pathname,
                    status: response.status.toString(),
                },
            };

            collector.recordHttpRequest(metrics);
            collector.recordHttpDuration(metrics);

            return Promise.resolve(response);
        },
        /**
         * Call template data type -> fields[]
         * Call all data types for every workspace that then matches the sourceFieldId = fields[].id (passing a list of ids)
         * Compose the query of different data types
         * @param error 
         */
        error: (error: HttpError) => {
            const duration = Date.now() - (error.config?.startTime ?? Date.now());
            const url = new URL(error.config?.url ?? '');

            const errorMetrics: HttpErrorMetrics = {
                method: error.config?.method ?? 'GET',
                path: url.pathname,
                status: error.status ?? 500,
                duration,
                errorType: error.code ?? 'unknown',
                error: error.message,
                labels: {
                    method: error.config?.method ?? 'GET',
                    path: url.pathname,
                    errorType: error.code ?? 'unknown',
                },
            };

            collector.recordHttpRequest(errorMetrics);
            collector.recordHttpError(errorMetrics);

            throw error;
        },
    };
}
