# Code Style Guidelines

## General Principles

1. **File Organization**
   - Maximum 300 lines per file
   - One class/interface per file
   - Clear file naming: `kebab-case.ts`

2. **Naming Conventions**
   - Classes: `PascalCase`
   - Interfaces: `PascalCase`
   - Methods: `camelCase`
   - Variables: `camelCase`
   - Constants: `UPPER_SNAKE_CASE`

3. **Comments** 
    - Use JSDoc for all public functions
    - Use inline comments for private functions
    - Use TODO comments for future work
    - Use FIXME comments for issues that need to be addressed
    - Use DEBUG comments for debugging information
    - Use INFO comments for general information
    - Use WARN comments for warnings

4. **Error Handling**
   - Always use typed errors
   - Include error context
   - Log appropriately

5. **Testing**
   - Unit tests for all business logic
   - Integration tests for external services
   - E2E tests for critical paths 