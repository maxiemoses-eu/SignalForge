# SignalForge Project Instructions

## Architectural Philosophy
- **3-Repository Topology**: App (this repo), IaC (Terraform), GitOps (Helm/Kubernetes).
- **Security-as-Code**: Zero static secrets, non-root containers, shift-left security scanning.
- **Telemetry-First**: All services must emit structured logs and signals for observability to support detection engineering and SOC workflows.

## Development Standards
- **Independently Deployable**: Each microservice must be fully runnable in isolation with its own test suite.
- **No Hardcoded Secrets**: All configuration must be injected via environment variables or Kubernetes secrets. Credentials must never be committed.
- **Containerization**: All services must use multi-stage Docker builds with minimal, hardened base images (e.g., Alpine/Slim).

## Repository Scope
This repository contains the application source code for the SignalForge microservices and frontend. 
- Infrastructure provisioning logic resides in the `SignalForge-AzureInfra` repository.
- Deployment and environment-specific configuration resides in the `SignalForge-Argocd-2` repository.

---

## Agent Operational Guardrails
- **Targeted Directory Scanning**: Before using the `codebase_investigator` or running file searches, locate files matching the target microservice first. Do not scan the entire root directory recursively unless explicitly requested.
- **Quota Management**: Prioritize lightweight, specific tools. If a task requires scanning multiple files, list the candidate files to the user first before reading them to avoid hitting API rate limits.