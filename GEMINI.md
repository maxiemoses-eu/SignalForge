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

## Security Hardening
- For detailed information on the security hardening standards and the current status of all microservices, see [SECURITY_HARDENING.md](./SECURITY_HARDENING.md).

---

## Agent Operational Guardrails
- **Targeted Directory Scanning**: Before using the `codebase_investigator` or running file searches, locate files matching the target microservice first. Do not scan the entire root directory recursively unless explicitly requested.
- **Quota Management**: Prioritize lightweight, specific tools. If a task requires scanning multiple files, list the candidate files to the user first before reading them to avoid hitting API rate limits.

---

the social media iles should be updated in bits as we take steps in the progress it should be recorded and written as posts. the should be done such that as the write up gets to the number of characters required by each platorm a new post starts it should be written in a conversational pattern of a human technical writer. the post should able to stand alond and pass a solid message and also make sense like it is part of a series. no mistakes always taking records of all the details as we progress

---

all apps of the microservices should be such that there no vunerability it should be code at a standard of  a hundred percent so when passed through the trivy gate it will pass the vunerability testing 