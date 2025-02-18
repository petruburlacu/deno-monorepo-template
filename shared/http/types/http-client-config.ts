import type { HttpError, HttpResponse, Middleware, RequestConfig } from '@shared/http';

export interface HttpClientConfig {
    baseUrl?: string;
    headers?: Record<string, string>;
    maxRetries?: number;
    baseDelay?: number;
    timeout?: number;
    middlewares?: Middleware[];
    maxConcurrent?: number;
    rateLimit?: {
        requests: number;
        perSeconds: number;
    };
    circuitBreaker?: {
        failureThreshold: number;
        resetTimeoutMs: number;
    };
    retry?: {
        strategies: {
            status?: number[];
            errors?: string[];
            custom?: (error: HttpError) => boolean;
        };
    };
    transforms?: {
        request?: (config: RequestConfig) => RequestConfig;
        response?: <T>(response: HttpResponse<T>) => HttpResponse<T>;
    };
}
