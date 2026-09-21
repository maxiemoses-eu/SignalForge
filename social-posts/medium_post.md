Why we chose a three-repository GitOps topology for SignalForge and how we navigated our deployment hurdles

Designing SignalForge required a departure from monolithic conventions. We implemented a three-repository topology: application source code, infrastructure as code (Terraform), and GitOps deployments (ArgoCD/Helm). This modularity ensures functional autonomy across engineering teams, supported by a polyglot microservices stack including Node.js, Go, Java, and Python.

### The CI/CD Hardening Journey

With the architectural foundation established, we prioritized a security-first deployment pipeline using GitHub Actions. We integrated GitLeaks, Hadolint, and Trivy to enforce stringent vulnerability and compliance checks. However, transitioning this pipeline from initial concept to a hardened production-ready state was an iterative process of log-driven troubleshooting.

Our deployment logs revealed three critical infrastructure hurdles:

1. **Registry Path Sensitivity**: Early pushes to GitHub Container Registry (GHCR) failed due to uppercase character restrictions in repository paths. We resolved this by injecting native bash parameter expansion to dynamically lowercase our repository variables, maintaining pipeline efficiency without external dependencies.
2. **Action Resolution Stability**: Automated runner diagnostics highlighted failures in resolving specific action tags. We analyzed the logs, identified the source of the resolution failure, and reinforced pipeline stability by pinning all workflow actions to verified commit SHAs.
3. **Build Context Misconfiguration**: During service builds, `npm ci` failures occurred despite the existence of `package-lock.json`. By interpreting build logs, we corrected the Docker build context pathing to ensure the build engine could accurately locate service-specific dependency manifest files.

### Achieving the Zero-Vulnerability Milestone

Stabilizing the pipeline was only the first step. Once our automated security scanners were operational, they immediately highlighted legacy vulnerabilities and container misconfigurations across our microservices stack. We initiated an exhaustive remediation sprint to meet our "Zero Vulnerability" standard:

* **Eradicating CVEs:** We upgraded and remediated dependencies across our Go, Java, Python, and Node.js codebases. Today, five out of six services are completely free of vulnerabilities, with the final payment service registering zero actionable/exploitable risks.
* **Hadolint-Compliant Containers:** We refactored all service Dockerfiles to meet strict security standards. Every image now enforces non-root execution (`USER node` or custom application users), uses minimal base images (`-slim` or `-alpine`), applies OS-level security updates during the build phase, and prunes unused development dependencies.
* **Continuous Compliance:** We established a central `SECURITY_HARDENING.md` audit file. Adhering to our "Documentation-as-Code" policy, no pull request can be merged unless its security status is verified and documented.

### Engineering Lessons

By methodically analyzing CI logs and refactoring our application layer, we successfully transitioned our strategy to a fully automated, hardened CI/CD pipeline targeting GHCR. This journey demonstrated that building a secure microservices ecosystem is not merely about avoiding errors; it is about cultivating the log-driven diagnostic expertise required to resolve complex infrastructure failures with precision. As secure container builds now pass seamlessly to GHCR, our focus shifts to observability and telemetry—the next phase in maturing our infrastructure.
