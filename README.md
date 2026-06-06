# SignalForge: Security as a code project

---

## 🛠️ Enterprise DevSecOps & FinOps Summary

This project is a production-ready, security-hardened platform built with multiple microservices, and telemetry-first design principles. This project is built using a **3-Repository Enterprise Topology** (App, IaC, and GitOps) deployed on **Microsoft Azure (AKS/ACR)**. The delivery infrastructure is engineered to solve real-world cloud scaling, cost, and security bottlenecks. This project is designed to **generate high-fidelity security and operational signals** for detection engineering and SOC workflows.

## Project Repo Structure

```mermaid
flowchart TB

    APP["Application Repository<br/>Microservices & Frontend"]
    IAC["Infrastructure Repository<br/>Terraform Modules"]
    GITOPS["GitOps Repository<br/>Helm Charts / Kustomize<br/>Kubernetes Manifests"]

    ACR["Azure Container Registry (ACR)"]

    AKS["Azure Kubernetes Service (AKS)"]

    APP -->|"CI Pipeline<br/>Tests, Security Scans,<br/>Build & Push Docker Image"| ACR

    IAC -->|"Terraform Apply<br/>Infrastructure Provisioning"| AKS

    ACR -->|"Pull Container Images"| AKS

    GITOPS -->|"GitOps Synchronization<br/>Desired State Reconciliation"| AKS

    classDef app fill:#E3F2FD,stroke:#1565C0,stroke-width:2px;
    classDef iac fill:#FFEBEE,stroke:#C62828,stroke-width:2px;
    classDef registry fill:#FFF3E0,stroke:#EF6C00,stroke-width:2px;
    classDef platform fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px;
    classDef gitops fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px;

    class APP app;
    class IAC iac;
    class ACR registry;
    class AKS platform;
    class GITOPS gitops;
```

Each service:

* Is independently deployable
* Is containerized
* Runs as non-root
* Uses minimal base images
* Is designed to pass **Trivy scans**
* Emits signals suitable for **SignalForge ingestion**

---

## 📊 Business & Infrastructure Metrics

| Engineering Focus | The Legacy Problem | My Hardened Solution | Business Impact |
| :--- | :--- | :--- | :--- |
| **Cloud Cost (FinOps)** | Typos or single-service edits trigger redundant builds across all 6 microservices ("Ghost Runs"). | **Dynamic Path-Filtering Gates** compute exact code deltas to target micro-matrix threads. | **80% reduction** in GitHub Actions runner billing minutes. |
| **Identity & Access** | Hardcoded Azure Service Principal Client Secrets stored in repository configurations. | **Workload Identity Federation (OIDC)** using ephemeral JSON Web Tokens. | **Zero Static Secrets.** Completely immunizes pipeline against credential leaks. |
| **Supply Chain** | Vulnerable base images or rogue container injections bypassing registry verification layers. | **Shift-Left Trivy Diagnostics** + Cryptographic **SBOM / Provenance Attestations**. | **Zero-Trust Validation.** AKS admission controllers reject unsigned container injections. |

👉 *For the deep-dive technical diagrams, OIDC token exchange breakdown, and configuration mechanics, see the [Advanced Workflow Security Documentation](.github/workflows/README.md).*

## 🔧 Tech Stack

### Frontend (UI)

* React
* Axios (centralized API client)
* Jest + React Testing Library
* nginx (static serving, hardened config)

### Backend

| Service         | Language | Framework   |
| --------------- | -------- | ----------- |
| User / Auth     | Python   | Flask       |
| Product Catalog | Node.js  | Express     |
| Orders          | Java     | Spring Boot |
| Payments        | Go       | Gin         |

### Security & Ops

* Docker (multi-stage builds)
* Non-root containers
* Minimal Alpine / Slim images
* Telemetry hooks for logs & errors
* CI-friendly testing

---

## 🎯 Design Goals

### Customer-Facing

* Browse products
* Add to cart
* Checkout securely
* Clear loading and error states

### Security / DevOps-Facing

* Centralized error handling
* Structured UI telemetry
* Observable API interactions
* Easy extension into SOC dashboards

> **The UI is a signal generator, not just a shop front.**

---

## 📁 Project Structure

```
.
├── ui/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   ├── catalog.js
│   │   │   └── order.js
│   │   ├── components/
│   │   │   ├── ProductList.jsx
│   │   │   └── Notification.jsx
│   │   ├── pages/
│   │   │   └── Shop.jsx
│   │   ├── telemetry/
│   │   │   └── logger.js
│   │   └── App.jsx
│   ├── nginx/
│   │   └── nginx.conf
│   ├── Dockerfile
│   └── README.md
│
├── user-service/
├── catalog-service/
├── order-service/
├── payment-service/
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

* Docker
* Node.js 20+ (for local UI dev)
* Java 21 (for local order service dev)
* Go 1.22+
* Python 3.11+

---

## 🧪 Running Tests

### UI Tests

```bash
cd ui
npm install
npm test
```

### Backend Tests

Each service includes basic unit tests.
Run them individually inside each service directory.

---

## 🐳 Building Containers

### UI

```bash
docker build -t signalforge-ui ./ui
```

### Backend Services

```bash
docker build -t user-service ./user-service
docker build -t catalog-service ./catalog-service
docker build -t order-service ./order-service
docker build -t payment-service ./payment-service
```

---

## 🔍 Security Scanning (Trivy)

```bash
trivy image signalforge-ui
trivy image user-service
trivy image catalog-service
trivy image order-service
trivy image payment-service
```

**Design choices to reduce findings:**

* No hardcoded secrets
* Non-root containers
* Minimal base images
* Pinned dependencies
* No unnecessary OS packages

---

## 📊 Telemetry & SignalForge

The UI and services are designed to emit:

* API success/failure events
* Frontend errors
* Checkout failures
* Abuse patterns (future extension)

Telemetry is centralized via:

* Axios interceptors (UI)
* Structured logs (backend)
* `/telemetry` endpoint (UI → SignalForge)

This enables:

* Detection engineering
* Fraud analysis
* Incident response simulations
* Blue team training environments

---

## 🧠 Key Engineering Principles

* **Separation of concerns** (UI ≠ API ≠ telemetry)
* **Fail loudly, fail safely**
* **Everything observable**
* **Security by default**
* **Minimal attack surface**

---

## 🛣️ Roadmap

Planned extensions:

* Admin / SOC dashboard
* OpenTelemetry instrumentation
* Feature flags for incident response
* WAF-aware UI patterns
* Auth service integration with HttpOnly cookies
* Rate-limit and abuse detection signals

---

## 📌 Disclaimer


* Architecture demonstrations
* Security engineering practice
* CI/CD and detection pipeline experiments

It is **not a complete commercial storefront**, but a **realistic, production-grade foundation**.




