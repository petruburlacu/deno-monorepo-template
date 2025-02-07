# Architecture Overview

## System Design
This monorepo implements a two-phase job processing system:

1. Data Preparation Job
2. Data Processing Job

### Components Diagram 

```mermaid
mermaid
graph TD
A[Data Preparation Job] -->|Writes| B[Shared Storage]
B -->|Reads| C[Processing Job]
A -->|Metrics| D[Monitoring]
C -->|Metrics| D
```

## Core Concepts

### Steps
Each job is composed of multiple steps:
- Each step has clear input/output interfaces
- Steps are independently testable
- Steps handle their own error cases
- Steps report metrics

### Shared Components
Located in `/shared`:
- HTTP clients
    - HTTP client for Service-1
    - HTTP client for Service-2
    - HTTP client for AWS S3
- Logging
- Metrics
- Type definitions
- Utilities

## External Dependencies
- Service-1: User data service
- Service-2: Processing service
- AWS S3: File storage

## Security
- All external calls use retry mechanisms
- Rate limiting implemented
- Secrets managed via Kubernetes secrets
