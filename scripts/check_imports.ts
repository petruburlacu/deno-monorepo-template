import { walk } from "https://deno.land/std/fs/walk.ts";

const RULES = {
    "shared/http/middlewares": {
        forbidden: ["shared/config", "shared/storage"],
        allowed: ["shared/logging", "shared/metrics"]
    },
    "apps": {
        forbidden: ["apps"],
        allowed: ["shared"]
    }
};

async function checkImports() {
    for await (const entry of walk(".", {
        includeDirs: false,
        match: [/\.ts$/],
        skip: [/node_modules/, /dist/, /docs/]
    })) {
        const content = await Deno.readTextFile(entry.path);
        const imports = content.match(/from ['"]([^'"]+)['"]/g) || [];

        for (const rule of Object.entries(RULES)) {
            if (entry.path.includes(rule[0])) {
                checkRule(entry.path, imports, rule[1]);
            }
        }
    }
}

function checkRule(file: string, imports: string[], rule: { forbidden: string[]; allowed: string[] }) {
    for (const imp of imports) {
        const importPath = imp.match(/from ['"]([^'"]+)['"]/)?.[1];
        if (!importPath) continue;

        if (rule.forbidden.some(f => importPath.includes(f))) {
            console.error(`❌ Forbidden import in ${file}: ${importPath}`);
            Deno.exit(1);
        }

        if (!rule.allowed.some(a => importPath.includes(a))) {
            console.error(`❌ Import not allowed in ${file}: ${importPath}`);
            Deno.exit(1);
        }
    }
}

if (import.meta.main) {
    await checkImports();
    console.log("✅ All imports follow boundary rules");
} 