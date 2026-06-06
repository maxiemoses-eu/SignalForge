# SignalForge CI System: Architecture & Security Controls

This directory contains the decoupled, parallelized GitHub Actions CI engine for the SignalForge ecosystem. The entire pipeline architecture shifts left on security and runtime efficiency, adhering strictly to Zero-Trust cloud paradigms.


## 1. Passwordless Authentication via Azure Federated OIDC


To completely eliminate the risk of long-lived, static secret exposure (such as Azure Service Principal Client Secrets), authentication to Microsoft Azure is executed using **OpenID Connect (OIDC) Federated Workload Identities**. 


### Cryptographic Identity Exchange Workflow

```mermaid
flowchart LR

    Runner["GitHub Actions<br/>Runner"]

    OIDC["GitHub OIDC<br/>Provider"]

    Entra["Microsoft Entra ID<br/>Federated Credential"]

    Azure["Azure Subscription<br/>ACR / AKS / Resources"]

    Runner -->|"1. Request JWT"| OIDC

    OIDC -->|"2. Signed JWT"| Runner

    Runner -->|"3. Exchange JWT"| Entra

    Entra -->|"4. Short-Lived Access Token"| Azure

    classDef github fill:#24292e,color:#fff,stroke:#24292e,stroke-width:2px;
    classDef azure fill:#0078D4,color:#fff,stroke:#005A9E,stroke-width:2px;
    classDef resource fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px;

    class Runner,OIDC github;
    class Entra azure;
    class Azure resource;
```