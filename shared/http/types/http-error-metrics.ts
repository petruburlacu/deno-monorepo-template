export interface HttpErrorMetrics {
    method: string;
    path: string;
    errorType: string;
    labels?: Record<string, string>;
    status: number;
    duration: number;
    error?: string;
}
