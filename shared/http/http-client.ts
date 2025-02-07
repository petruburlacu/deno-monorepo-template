import { default as PQueue } from '@pqueue';
import type { HttpError, HttpResponse, Middleware, RequestConfig } from '@shared/http';

interface HttpClientConfig {
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

export class HttpClient {
    private readonly baseUrl: string;
    private readonly headers: Record<string, string>;
    private readonly timeout: number;
    private readonly middlewares: Middleware[];
    private readonly maxConcurrent: number;
    private readonly rateLimit: { requests: number; perSeconds: number } | undefined;
    private readonly requestQueue: PQueue;
    private circuitState = {
        failures: 0,
        lastFailure: 0,
        isOpen: false,
    };
    private cache = new Map<string, { data: unknown; expires: number }>();
    private readonly transforms?: HttpClientConfig['transforms'];

    constructor(config: HttpClientConfig = {}) {
        this.baseUrl = config.baseUrl ?? '';
        this.headers = {
            'Content-Type': 'application/json',
            ...config.headers,
        };
        this.timeout = config.timeout ?? 30000;
        this.middlewares = config.middlewares ?? [];
        this.maxConcurrent = config.maxConcurrent ?? 10;
        this.rateLimit = config.rateLimit;
        this.requestQueue = new PQueue({
            concurrency: this.maxConcurrent,
            interval: this.rateLimit?.perSeconds ? this.rateLimit.perSeconds * 1000 : 0,
            intervalCap: this.rateLimit?.requests ?? Number.POSITIVE_INFINITY,
        });
        this.transforms = config.transforms;
    }

    get<T>(path: string, config?: RequestConfig): Promise<HttpResponse<T>> {
        return this.request<T>(path, {
            ...config,
            method: 'GET',
        });
    }

    post<T>(path: string, data?: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
        return this.request<T>(path, {
            ...config,
            method: 'POST',
            body: data ? JSON.stringify(data) : null,
        });
    }

    put<T>(path: string, data?: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
        return this.request<T>(path, {
            ...config,
            method: 'PUT',
            body: data ? JSON.stringify(data) : null,
        });
    }

    delete<T>(path: string, config?: RequestConfig): Promise<HttpResponse<T>> {
        return this.request<T>(path, {
            ...config,
            method: 'DELETE',
        });
    }

    private async request<T>(path: string, config?: RequestConfig): Promise<HttpResponse<T>> {
        if (this.isCircuitOpen()) {
            throw new Error('Circuit breaker is open');
        }

        if (config?.cache) {
            const cacheKey = config.cache.key ?? `${config.method}:${path}`;
            const cached = this.cache.get(cacheKey);

            if (cached && cached.expires > Date.now()) {
                return cached.data as HttpResponse<T>;
            }
        }

        return await this.requestQueue.add(async () => {
            try {
                const response = await this.executeRequest<T>(path, config);

                if (config?.cache) {
                    const cacheKey = config.cache.key ?? `${config.method}:${path}`;
                    this.cache.set(cacheKey, {
                        data: response,
                        expires: Date.now() + config.cache.ttl,
                    });
                }

                this.recordSuccess();
                return response;
            } catch (error) {
                this.recordFailure();
                throw error;
            }
        });
    }

    private async executeRequest<T>(path: string, config?: RequestConfig): Promise<HttpResponse<T>> {
        const transformedConfig = this.transforms?.request?.(config ?? {}) ?? config;
        const response = await this.rawRequest<T>(path, transformedConfig);
        return this.transforms?.response?.(response) ?? response;
    }

    private async prepareConfig(path: string, config?: RequestConfig): Promise<RequestConfig> {
        const currentConfig: RequestConfig = {
            ...config,
            headers: { ...this.headers, ...config?.headers },
            timeout: config?.timeout ?? this.timeout,
            url: this.resolveUrl(path, config?.params),
        };

        for (const middleware of this.middlewares) {
            if (middleware.pre) {
                await middleware.pre(currentConfig);
            }
        }

        return currentConfig;
    }

    private async handleResponse<T>(response: Response, config: RequestConfig): Promise<HttpResponse<T>> {
        if (!response.ok) {
            throw await this.createHttpError(response, config);
        }

        const processedResponse: HttpResponse<T> = {
            data: null as T, // Will be populated in try block
            status: response.status,
            headers: response.headers,
            config,
            url: response.url,
        };

        try {
            processedResponse.data = await response.json();
            return processedResponse;
        } catch (error) {
            // Enhance error with request details
            const httpError = error as HttpError;
            httpError.status = response.status;
            httpError.config = config;
            httpError.url = response.url;
            httpError.code = 'PARSE_ERROR';
            httpError.message = 'Failed to parse response data';

            // Call error middlewares
            for (const middleware of this.middlewares) {
                if (middleware.error) {
                    await middleware.error(httpError);
                }
            }

            throw httpError;
        } finally {
            // Always run post middlewares
            for (const middleware of this.middlewares) {
                if (middleware.post) {
                    await middleware.post(processedResponse);
                }
            }
        }
    }

    private async fetchWithTimeout(url: string, config: RequestConfig): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        const signal = config.signal ?? controller.signal;

        try {
            const fetchConfig: RequestInit = {
                method: config.method || 'GET',
                headers: new Headers(config.headers ?? {}),
                body: config.body ?? null,
                signal,
            };

            return await fetch(url, fetchConfig);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private resolveUrl(path: string, params?: Record<string, string>): string {
        const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const url = `${baseUrl}${normalizedPath}`;

        if (!params) return url;

        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            searchParams.append(key, value);
        });

        return `${url}?${searchParams.toString()}`;
    }

    private async createHttpError(response: Response, config: RequestConfig): Promise<HttpError> {
        const error = new Error(`HTTP Error ${response.status} for ${response.url}`) as HttpError;
        error.status = response.status;
        error.config = config;
        error.code = response.statusText;
        error.url = response.url;
        try {
            error.data = await response.json();
        } catch {
            error.data = await response.text();
        }
        return error;
    }

    private isCircuitOpen(): boolean {
        if (!this.circuitState.isOpen) return false;

        const cooldownPeriod = 60000; // 1 minute
        if (Date.now() - this.circuitState.lastFailure > cooldownPeriod) {
            this.circuitState.isOpen = false;
            return false;
        }
        return true;
    }

    private recordSuccess(): void {
        this.circuitState.failures = 0;
        this.circuitState.isOpen = false;
    }

    private recordFailure(): void {
        this.circuitState.failures++;
        this.circuitState.lastFailure = Date.now();

        if (this.circuitState.failures >= 5) { // Threshold
            this.circuitState.isOpen = true;
        }
    }

    private async rawRequest<T>(path: string, config?: RequestConfig): Promise<HttpResponse<T>> {
        const currentConfig = await this.prepareConfig(path, config);
        const url = this.resolveUrl(path, currentConfig.params);
        const response = await this.fetchWithTimeout(url, currentConfig);
        return await this.handleResponse<T>(response, currentConfig);
    }
}
