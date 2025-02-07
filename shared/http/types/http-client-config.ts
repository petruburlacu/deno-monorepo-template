export interface HttpClientConfig {
    baseUrl?: string;
    headers?: Record<string, string>;
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
    transforms?: {
        request?: (config: RequestConfig) => RequestConfig;
        response?: <T>(response: HttpResponse<T>) => HttpResponse<T>;
    };
}
