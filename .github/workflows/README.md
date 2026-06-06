# SignalForge CI System: Architecture & Security Controls

This directory contains the decoupled, parallelized GitHub Actions CI engine for the SignalForge ecosystem. The entire pipeline architecture shifts left on security and runtime efficiency, adhering strictly to Zero-Trust cloud paradigms.


## 1. Passwordless Authentication via Azure Federated OIDC


To completely eliminate the risk of long-lived, static secret exposure (such as Azure Service Principal Client Secrets), authentication to Microsoft Azure is executed using **OpenID Connect (OIDC) Federated Workload Identities**. 


### Cryptographic Identity Exchange Workflow

```mermaid
flowchart TB

    Runner["GitHub Actions Runner"]

    OIDC["GitHub OIDC<br/>Identity Provider"]

    Entra["Microsoft Entra ID"]

    Azure["Azure Cloud Environment"]

    Runner -->|"1. Request OIDC JWT"| OIDC

    OIDC -->|"2. Return Signed OIDC JWT"| Runner

    Runner -->|"3. Exchange JWT for Access Token"| Entra

    Entra -->|"Validates:<br/>Issuer = github.com<br/>Subject = repo:org/name"| Entra

    Entra -->|"4. Issue Temporary OAuth2 Token<br/>(~1 Hour Lifetime)"| Azure

    Azure -->|"Pipeline Task:<br/>ACR Push / AKS Deploy"| Azure

    classDef github fill:#24292e,color:#ffffff,stroke:#24292e,stroke-width:2px;
    classDef identity fill:#0078D4,color:#ffffff,stroke:#005A9E,stroke-width:2px;
    classDef azure fill:#E8F5E9,color:#000000,stroke:#2E7D32,stroke-width:2px;

    class Runner,OIDC github;
    class Entra identity;
    class Azure azure;
```