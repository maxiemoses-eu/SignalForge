# SignalForge
Security as a code project

---

# 🛒 SignalForge E-Commerce Microservices Platform

A **production-ready, security-hardened e-commerce platform** built with multiple microservices, a React UI, and telemetry-first design principles.
This project is designed not only to sell products, but to **generate high-fidelity security and operational signals** for detection engineering and SOC workflows.

---

## GitOps Multi-Repository Deployment Pipeline

```mermaid
graph TD
    classDef repo fill:#eceff1,stroke:#607d8b,stroke-width:2px,color:#000;
    classDef registry fill:#ffebee,stroke:#c62828,stroke-width:2px,color:#b71c1c;
    classDef cluster fill:#e1f5fe,stroke:#0288d1,stroke-width:2px,color:#01579b;
    classDef gitops fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c;

    AppRepo["📁 1. APP REPO<br>(Microservices & UI)"]:::repo
    ACR["📦 Azure Container Registry<br>(ACR)"]:::registry
    IaCRepo["📁 2. IaC REPO<br>(Terraform)"]:::repo
    AKS["☸️ Azure Kubernetes Service<br>(AKS Cluster)"]:::cluster
    GitOpsRepo["📁 3. GITOPS REPO<br>(Manifests / Helm)"]:::gitops

    AppRepo-->|CI Pipeline: Test, Scan & Build|ACR
    IaCRepo-->|Terraform Apply: Provision Cluster|AKS
    GitOpsRepo-->|Argo CD ApplicationSet: Dynamic Sync|AKS
    ACR-.->|Pulls Secure Images|AKS

Each service:

* Is independently deployable
* Is containerized
* Runs as non-root
* Uses minimal base images
* Is designed to pass **Trivy scans**
* Emits signals suitable for **SignalForge ingestion**

---

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




