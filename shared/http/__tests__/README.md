# HTTP Client Tests

## Structure

The tests are organized into the following structure:

```
__tests__/
├── unit/                 # Unit tests for basic functionality
├── integration/          # Integration tests for complex behaviors
├── middleware/           # Middleware-specific tests
├── transforms/           # Transform-related tests
├── errors/              # Error handling tests
└── __fixtures__/        # Shared test fixtures
```

## Test Categories

### Unit Tests

Located in `unit/`, these test basic HTTP client functionality:

- HTTP methods (GET, POST, PUT, DELETE)
- URL handling and query parameters
- Header management
- Basic request/response flow

### Integration Tests

Located in `integration/`, these test complex behaviors:

- Circuit breaker patterns
- Rate limiting
- Request queueing
- Caching mechanisms

### Middleware Tests

Located in `middleware/`, these test middleware functionality:

- Authentication middleware
- Logging middleware
- Metrics middleware
- Custom middleware behaviors

### Transform Tests

Located in `transforms/`, these test data transformation:

- Request transforms
- Response transforms
- Error transforms

## Test Fixtures

Common test fixtures are located in `__fixtures__/`:

```typescript
// responses.ts - Common response fixtures
export const mockResponses = {
    success: (data = {}) => new Response(JSON.stringify(data), { status: 200 }),
    notFound: () => new Response(JSON.stringify({ message: 'Not found' }), { status: 404 }),
    // ...
};
```

## Running Tests

```bash
# Run all tests
deno test shared/http/__tests__/

# Run specific category
deno test shared/http/__tests__/unit/
deno test shared/http/__tests__/integration/

# Run with coverage
deno test --coverage shared/http/__tests__/
```

## Writing New Tests

1. Place tests in appropriate category folder
2. Use shared fixtures when possible
3. Follow the existing patterns for setup/teardown
4. Include proper type assertions
5. Clean up resources (e.g., spy mocks)

Example:

```typescript
Deno.test('Feature Name', async (t) => {
    const originalFetch = globalThis.fetch;

    await t.step('should behave in specific way', async () => {
        // Arrange
        globalThis.fetch = spy(() => mockResponses.success());

        // Act
        const result = await someOperation();

        // Assert
        assertSpyCalls(globalThis.fetch as unknown as Spy, 1);

        // Cleanup
        globalThis.fetch = originalFetch;
    });
});
```
