# deno-monorepo-template

A production-ready Deno monorepo template for building scalable microservices with Kubernetes.

## 🚀 Overview

This monorepo contains two main jobs that work together in a workflow. In the future, the jobs could be triggered by further user input.

1. **Data Preparation Job**: Processes and prepares data, writing output to a shared storage
2. **Applying Changes Job**: Consumes the prepared data and applies necessary changes

# Documentation

## 📚 Table of Contents

1. [Getting Started](./docs/getting-started.md)
2. [Architecture](./docs/architecture.md)
3. [Development Guidelines](./docs/guidelines/README.md) 3.1 [Code Style Guidelines](./docs/guidelines/code-style.md) 3.2
   [Contributing Guidelines](./docs/guidelines/contributing.md) 3.3 [Git Workflow Guidelines](./docs/guidelines/git-workflow.md)
4. [Troubleshooting](./docs/troubleshooting.md)

## 🔧 Requirements

- [Deno 2.x](https://docs.deno.com/runtime/getting_started/installation/)
- [Docker](https://docs.docker.com/get-docker/)
- [Kubernetes](https://kubernetes.io/docs/setup/)
- [Helm](https://helm.sh/docs/intro/install/)
- [Git](https://git-scm.com/downloads)

## 🚦 Getting Started

1. Clone the repository: `git clone https://github.com/x-repo/deno-monorepo.git`

2. Install dependencies: `deno install`

3. Start the data preparation job: `deno run --allow-net --allow-read --allow-write apps/data-prep/main.ts`

4. Start the application job: `deno run --allow-net --allow-read --allow-write apps/processor/main.ts`

## Project Structure

```
shared/
├── decorators/
│   ├── mod.ts           # Exports all decorators
│   ├── with-metrics.ts
│   ├── with-retry.ts
│   └── with-cache.ts
├── metrics/
│   ├── mod.ts           # Exports all metrics related
│   ├── collectors/
│   │   ├── mod.ts       # Exports all collectors
│   │   ├── base-collector.ts
│   │   └── prometheus-collector.ts
│   └── writer.ts        # Renamed from metrics-writer.ts
├── utils/
│   ├── mod.ts           # Exports common utilities
│   ├── logger.ts
│   └── http-client.ts
├── types/
│   ├── mod.ts           # Exports all types
│   └── step.ts
└── factories/
    ├── mod.ts           # Exports all factories
    └── step-factory.ts
```

## Development Environment

### VSCode Setup

This project provides a `.vscode` folder with recommended settings and extensions:

- [Deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.deno)

### Environment Variables

Copy `.env.example` to `.env.local` and adjust values according to your needs.
