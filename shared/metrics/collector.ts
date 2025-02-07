import type { HttpErrorMetrics, HttpMetrics } from '@shared/http';
import { Counter, Gauge, Histogram } from './models/mod.ts';

export class MetricsCollector {
    private static instance: MetricsCollector;

    private readonly httpRequestsTotal: Counter;
    private readonly httpRequestDuration: Histogram;
    private readonly httpErrorsTotal: Counter;
    private readonly activeRequests: Gauge;

    private constructor() {
        this.httpRequestsTotal = new Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labels: ['method', 'path', 'status'],
        });

        this.httpRequestDuration = new Histogram({
            name: 'http_request_duration_ms',
            help: 'HTTP request duration in milliseconds',
            labels: ['method', 'path', 'status'],
            buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
        });

        this.httpErrorsTotal = new Counter({
            name: 'http_errors_total',
            help: 'Total number of HTTP errors',
            labels: ['method', 'path', 'errorType'],
        });

        this.activeRequests = new Gauge({
            name: 'http_active_requests',
            help: 'Number of currently active HTTP requests',
            labels: ['method'],
        });
    }

    static getInstance(): MetricsCollector {
        if (!MetricsCollector.instance) {
            MetricsCollector.instance = new MetricsCollector();
        }
        return MetricsCollector.instance;
    }

    recordHttpRequest(metrics: HttpMetrics): void {
        const labels = {
            method: metrics.method,
            path: metrics.path,
            status: metrics.status.toString(),
            ...metrics.labels,
        };

        this.httpRequestsTotal.inc(labels);
    }

    recordHttpDuration(metrics: HttpMetrics): void {
        const labels = {
            method: metrics.method,
            path: metrics.path,
            status: metrics.status.toString(),
            ...metrics.labels,
        };

        this.httpRequestDuration.observe(labels, metrics.duration);
    }

    recordHttpError(metrics: HttpErrorMetrics): void {
        const labels = {
            method: metrics.method,
            path: metrics.path,
            ...metrics.labels,
        };

        this.httpErrorsTotal.inc(labels);
    }

    trackActiveRequest(method: string): () => void {
        const labels = { method };
        this.activeRequests.inc(labels);
        return () => this.activeRequests.dec(labels);
    }

    // For testing purposes
    getMetrics() {
        return {
            httpRequestsTotal: this.httpRequestsTotal,
            httpRequestDuration: this.httpRequestDuration,
            httpErrorsTotal: this.httpErrorsTotal,
            activeRequests: this.activeRequests,
        };
    }
}
