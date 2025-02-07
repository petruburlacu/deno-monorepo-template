# HTTP Client Documentation

## Overview

The `HttpClient` is a robust, production-ready HTTP client designed for distributed systems. It implements enterprise-grade reliability patterns and provides extensive monitoring capabilities.

## Table of Contents
- [Architecture](#architecture)
- [Features](#features)
- [Configuration](#configuration)
- [Usage](#usage)
- [Reliability Patterns](#reliability-patterns)
- [Middleware System](#middleware-system)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Architecture

### Core Components
```typescript
export class HttpClient {
private readonly baseUrl: string;
private readonly headers: Record<string, string>;
private readonly maxRetries: number;
private readonly baseDelay: number;
private readonly timeout: number;
private readonly middlewares: Middleware[];
private readonly requestQueue: PQueue;
private readonly cache: Map<string, { data: unknown; expires: number }>;
private circuitState: { failures: number; lastFailure: number; isOpen: boolean };
}
```

The client is built around several key architectural patterns:
- **Factory Pattern**: Used via `ClientFactory` for client instance management
- **Middleware Pattern**: For extensible request/response processing
- **Decorator Pattern**: For cross-cutting concerns like metrics and logging
- **Circuit Breaker Pattern**: For failure isolation
- **Queue Pattern**: For request rate management

## Features

### 1. HTTP Methods
```typescript
// Basic HTTP operations
client.get<T>(path: string, config?: RequestConfig)
client.post<T>(path: string, data?: unknown, config?: RequestConfig)
client.put<T>(path: string, data?: unknown, config?: RequestConfig)
client.delete<T>(path: string, config?: RequestConfig)
```

### 2. Request Configuration
```typescript
interface RequestConfig {
    method?: string;
    headers?: Record<string, string>;
    body?: string | null;
    params?: Record<string, string>;
    timeout?: number;
    signal?: AbortSignal;
    cache?: {
        ttl: number;
        key?: string;
    };
}
```


## Reliability Patterns

### 1. Circuit Breaker
Prevents cascading failures by stopping requests when a failure threshold is reached.
```typescript
private circuitState = {
    failures: 0,
    lastFailure: 0,
    isOpen: false,
};
// Usage in request flow
if (this.isCircuitOpen()) {
throw new Error('Circuit breaker is open');
}
```
**When to Use**:
- External service dependencies
- Rate-limited APIs
- Services with known instability
- Critical system integrations

### 2. Request Queueing & Rate Limiting
Controls request flow to prevent system overload.
```typescript
const client = new HttpClient({
    maxConcurrent: 10,
    rateLimit: {
        requests: 100,
        perSeconds: 60
    }
});
```
**When to Use**:
- API rate limit compliance
- Resource-intensive operations
- High-concurrency systems
- Batch processing

### 3. Request Caching
Improves performance and reduces API calls.
```typescript
await client.get('/data', {
    cache: {
        ttl: 60000, // 1 minute
        key: 'custom-cache-key'
    }
});
```

**When to Use**:
- Frequently accessed data
- Slow API responses
- Rate-limited services
- Static or semi-static data

### 4. Request Cancellation
Manages request lifecycles and timeouts.
```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
await client.get('/data', {
    signal: controller.signal,
    timeout: 30000
});
```

**When to Use**:
- Time-sensitive operations
- Long-running requests
- Abortable operations

### 5. Transforms
The transforms feature in the HttpClient allows for global request/response modifications.
```typescript
interface HttpClientConfig {
    ...
    transforms?: {
        // Transform request before it's sent
        request?: (config: RequestConfig) => RequestConfig;
        // Transform response before it's returned
        response?: (response: HttpResponse<unknown>) => HttpResponse<unknown>;
    };
}
```
**Common Use Cases**:
1. **Request Transformation**:
    - Modify headers
    - Add authentication tokens
    - Modify request body
```typescript
const client = new HttpClient({
    transforms: {
        request: (config) => ({
            ...config,
            headers: {
                ...config.headers,
                'X-Correlation-ID': generateCorrelationId(),
                'X-Client-Version': APP_VERSION,
            }
        })
    }
});
```
2. **Response Transformation**:
    - Parse JSON responses
    - Handle pagination
```typescript
const client = new HttpClient({
    transforms: {
        response: (response) => ({
            ...response,
            data: {
                ...response.data,
                timestamp: Date.now(),
                // Convert dates from strings to Date objects
                createdAt: new Date(response.data.createdAt),
                updatedAt: new Date(response.data.updatedAt),
            }
        })
    }
});
```
3. **Error Response Standardization**:
    - Standardize error responses
    - Add error details
```typescript
const client = new HttpClient({
    transforms: {
        response: (response) => {
            if (response.status >= 400) {
                return {
                    ...response,
                    data: {
                        code: response.status,
                        message: standardizeErrorMessage(response.data),
                        details: response.data
                    }
                };
            }
            return response;
        }
    }
});
```

**When to Use**:
- Standardize error responses
- Add error details
- Parse JSON responses
- Handle pagination
1. Data normalization
```typescript
// Normalize different API response formats
const client = new HttpClient({
    transforms: {
        response: (response) => ({
            ...response,
            data: normalizeApiResponse(response.data)
        })
    }
});

function normalizeApiResponse(data: unknown) {
    // Convert various API formats to a standard format
    if (Array.isArray(data)) {
        return { items: data };
    }
    if (data && typeof data === 'object') {
        return { item: data };
    }
    return { value: data };
}
```
2. Security Headers
```typescript
const client = new HttpClient({
    transforms: {
        request: (config) => ({
            ...config,
            headers: {
                ...config.headers,
                'Content-Security-Policy': 'default-src "self"',
                'X-XSS-Protection': '1; mode=block'
            }
        })
    }
});
```
3. API Versioning
```typescript
const client = new HttpClient({
    transforms: {
        request: (config) => ({
            ...config,
            headers: {
                ...config.headers,
                'Accept-Version': 'v2',
            },
            // Modify URLs to include version
            url: config.url?.replace('/api/', '/api/v2/')
        })
    }
});
```

## Middleware System

The middleware system allows for request/response transformation and monitoring.
```typescript
interface Middleware {
pre?: (config: RequestConfig) => Promise<RequestConfig>;
post?: (response: HttpResponse<unknown>) => Promise<HttpResponse<unknown>>;
error?: (error: HttpError) => Promise<never>;
}
```


### Built-in Middlewares

1. **Logging Middleware**
```typescript
createLoggingMiddleware(logger: Logger): Middleware
```
- Request/response logging
- Error tracking
- Debug information

1. **Metrics Middleware**
```typescript
createMetricsMiddleware(metrics: Metrics): Middleware
```
- Response times
- Error rates
- Request counts

1. **Authentication Middleware**
```typescript
createAuthMiddleware(auth: Auth): Middleware
```
- Token management
- Authentication headers
- Authorization flow

## Error Handling
```typescript
interface HttpError extends Error {
status?: number;
code?: string;
data?: unknown;
config?: RequestConfig;
url?: string;
}
```

### Error Types
- Network errors
- Timeout errors
- API errors
- Circuit breaker errors
- Rate limit errors

## Best Practices

### 1. Configuration
```typescript
const client = new HttpClient({
baseUrl: 'https://api.example.com',
maxRetries: 3,
baseDelay: 1000,
timeout: 30000,
middlewares: [
createLoggingMiddleware(logger),
createMetricsMiddleware(metrics),
createAuthMiddleware(getToken)
]
});
```

### 2. Error Handling
```typescript
try {
const response = await client.get('/data');
} catch (error) {
if (error instanceof HttpError) {
// Handle HTTP-specific errors
logger.error('Request failed', {
status: error.status,
code: error.code,
url: error.url
});
}
throw error;
}
```

### 3. Resource Management
- Set appropriate timeouts
- Configure retry strategies
- Use circuit breakers for external services
- Implement request cancellation

## Integration Examples

### 1. Basic Service Integration
```typescript
class UserService {
private client: HttpClient;
constructor() {
this.client = new HttpClient({
baseUrl: 'https://api.users.com',
maxRetries: 3
});
}
async getUser(id: string): Promise<User> {
return this.client.get(/users/${id});
}
}
```

### 2. Advanced Integration with Reliability Patterns
```typescript
class DataService {
private client: HttpClient;
constructor() {
this.client = new HttpClient({
baseUrl: 'https://api.data.com',
maxConcurrent: 5,
rateLimit: {
requests: 100,
perSeconds: 60
}
});
}
async getData(id: string): Promise<Data> {
return this.client.get(/data/${id}, {
cache: {
ttl: 60000,
key: data-${id}
}
});
}
}
```

## Performance Considerations

1. **Caching Strategy**
   - Use appropriate TTLs
   - Consider cache invalidation
   - Monitor cache hit rates

2. **Concurrency Management**
   - Set appropriate queue limits
   - Monitor queue length
   - Configure rate limits

3. **Resource Usage**
   - Monitor memory usage
   - Track active connections
   - Watch for memory leaks

## Monitoring and Debugging

### Metrics
- Request counts and rates
- Error rates and types
- Response times
- Circuit breaker status
- Queue length
- Cache hit/miss rates

### Logging
- Request/response details
- Error contexts
- Performance metrics
- System state changes

## Testing

### Unit Testing
```typescript
describe('HttpClient', () => {
it('should handle retries', async () => {
const client = new HttpClient({
maxRetries: 3
});
// Test implementation
});
});
```

### Integration Testing
```typescript
typescript
describe('HttpClient Integration', () => {
it('should handle real API calls', async () => {
const client = new HttpClient({
baseUrl: 'https://api.test.com'
});
// Test implementation
});
});
```


## Troubleshooting Guide

### Common Issues

1. **Circuit Breaker Trips**
   - Check external service health
   - Review error thresholds
   - Monitor service metrics

2. **Rate Limiting**
   - Review rate limit configuration
   - Check API quotas
   - Monitor request patterns

3. **Cache Issues**
   - Verify TTL settings
   - Check memory usage
   - Monitor cache hit rates

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Code style
- Testing requirements
- PR process
- Documentation standards