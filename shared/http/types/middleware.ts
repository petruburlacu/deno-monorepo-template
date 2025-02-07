import type { HttpError, HttpResponse, RequestConfig } from '@shared/http';

export interface Middleware {
    pre?: (config: RequestConfig) => Promise<RequestConfig>;
    post?: (response: HttpResponse<unknown>) => Promise<HttpResponse<unknown>>;
    error?: (error: HttpError) => Promise<never>;
}
