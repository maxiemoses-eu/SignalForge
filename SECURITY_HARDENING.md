# Security Hardening Documentation

This document summarizes the security hardening efforts applied to the SignalForge microservices and frontend.

## Hardening Standards
- **Zero Vulnerabilities**: All services must pass a Trivy scan (0 vulnerabilities, including transitive dependencies).
- **Hardened Containers**: All Dockerfiles use non-root users, patched base images, and pruned dependencies.
- **Dependency Management**: Vulnerable dependencies are explicitly remediated via updates or `dependencyManagement` overrides.

## Verified Remediation Strategies

These strategies are the verified standards for maintaining the security posture of all SignalForge services. Any new service or dependency update MUST adhere to these patterns.

### 1. Container Hardening (Dockerfile)
- **Non-Root Execution**: Every Dockerfile must explicitly create and switch to a non-privileged user (e.g., `USER appuser` or `USER node`).
- **Minimal Base Images**: Always use `-slim` or `-alpine` variants to reduce the attack surface.
- **OS-Level Patching**: Containers must run updates (e.g., `apt-get upgrade -y`) during the build process to incorporate latest OS security patches.
- **Dependency Pruning**: Production builds must prune development dependencies (e.g., `npm prune --production`).

### 2. Dependency Management
- **Explicit Version Pinning**: All dependencies must be pinned to specific, secure versions in `package.json`, `requirements.txt`, or `pom.xml`.
- **Transitive Vulnerability Override**: If a secure version of a library is not pulled in automatically, use explicit overrides (e.g., Maven `dependencyManagement` or direct `npm install` pinning) to force the use of patched versions.
- **Vulnerability Lifecycle**: All services must achieve a "clean" status (0 vulnerabilities) via `trivy` scanning before being considered production-ready.

## Maintenance Policy

To ensure our security posture remains transparent and accurate, the following "Documentation-as-Code" policy is mandatory:

- **Definition of Done (DoD)**: No Pull Request that includes security remediation, dependency updates, or container hardening is considered complete unless this document (`SECURITY_HARDENING.md`) is updated to reflect the changes.
- **Verification**: Pipeline verification (Trivy scans) must be updated and re-verified for any service modified in a Pull Request.
- **Auditability**: All changes made to this document must correspond to specific commits in the Git history, ensuring a clear audit trail for compliance and review.


## Status Summary
- [x] `gateway-microservice`: 0 vulnerabilities
- [x] `order-microservice`: 0 vulnerabilities
- [x] `user-microservice`: 0 vulnerabilities
- [x] `store-ui`: 0 vulnerabilities
- [x] `product-microservice`: 0 vulnerabilities
- [x] `payment-microservice`: 0 actionable vulnerabilities (transitive non-exploitable dependency remaining)
