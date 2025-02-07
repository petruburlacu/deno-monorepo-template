For dynamic imports (true lazy loading), use:

```ts
async function main() {
    // Only import and initialize when needed
    const { S3Client } = await import("@shared/aws/mod.ts");
    const s3Client = new S3Client();
}
```
To optimize this further, update your deno.json to include import maps for specific modules:

```json
{
    "imports": {
        "@shared/": "./shared/",
        "@shared/aws/": "./shared/aws/",
        "@shared/types/": "./shared/types/",
        "@shared/core/": "./shared/core/",
        "@shared/config/": "./shared/config/"
    }
}
```
Benefits of this approach:
- Only the modules you explicitly import are loaded
- Better tree-shaking
- Smaller runtime memory footprint
- Clearer dependencies
- Faster startup time for apps that don't need all shared modules

Pro tip: Use the deno info command to verify which dependencies are being loaded:

```bash
# Check dependencies for a specific file
deno info apps/data-prep/main.ts

# Check dependencies for a specific module
deno info @shared/http/mod.ts
```

Do :check: 
- Group related functionality into separate modules
- Use dynamic imports for lazy loading
- Keep core types and constants in the base shared module
- Use explicit imports rather than importing entire modules
- Update deno.json with import maps
- Use deno info to audit dependencies





