# CodeExec – DevOps Enabled Full Stack Application

---

## 🚀 Overview

CodeExec is a full-stack web application integrated with a complete end-to-end DevOps pipeline. The project automates the process of building, analyzing, containerizing, and deploying the application using modern DevOps tools.

The system ensures that every code change is automatically tested, analyzed for quality, and deployed without manual intervention.

---

## 🛠️ Tech Stack

### Application

- Frontend: React (Vite)
- Backend: Node.js (Express)
- Database: PostgreSQL

### DevOps Tools

- GitHub – Source Code Management
- Jenkins – CI/CD Pipeline Automation
- SonarQube – Code Quality Analysis
- Docker – Containerization
- Ansible – Deployment Automation

---

## 🔄 CI/CD Pipeline Flow

```text
GitHub → Jenkins → SonarQube → Docker → Ansible → Running Application
```

### Steps:

1. Code is pushed to GitHub
2. Jenkins pipeline is triggered
3. Dependencies are installed (backend & frontend)
4. SonarQube performs code quality analysis
5. Docker builds application images
6. Ansible deploys the application containers
7. Application becomes live

---

## 🌐 Application URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- SonarQube: http://localhost:9000
- Jenkins: http://localhost:8080

---

## ⚙️ Infrastructure Setup (IMPORTANT)

Before running the pipeline, DevOps tools must be started:

```bash
ansible-playbook ansible/setup-devops.yml
```

This sets up:

- Jenkins (custom Docker image with tools installed)
- SonarQube (with persistent storage)
- Docker network for communication

---

## 🐳 Custom Jenkins Setup

A custom Jenkins Docker image is used with pre-installed tools:

- Node.js & npm
- Docker CLI
- Ansible
- Sonar Scanner

### Why?

To ensure Jenkins always has required tools and does not break after restart.

---

## 📦 Deployment using Ansible

Run:

```bash
ansible-playbook ansible/playbook.yml
```

This performs:

- Stops old containers
- Creates Docker network
- Starts PostgreSQL
- Waits for database readiness
- Runs backend container
- Executes database migrations
- Runs frontend container

---

## 🔍 SonarQube Integration

- Automatically runs during Jenkins pipeline

- Checks for:
  - Bugs
  - Code smells
  - Security issues

- Results available at:
  http://localhost:9000

---

## 🔐 Authentication Handling

- SonarQube uses a **token-based authentication system**
- Token is securely stored in Jenkins credentials
- Ensures secure communication between Jenkins and SonarQube

---

## 💾 Data Persistence

Docker volumes are used for:

- Jenkins configuration (`jenkins_home`)
- SonarQube data (users, tokens, reports)

This ensures:

> Data is not lost even after container restart

---

## 🌐 Docker Networking

A custom Docker network is used:

```text
codeexec-network
```

This allows:

- Backend to connect to PostgreSQL
- Services to communicate using container names

---

## 🧪 API Testing Example

```bash
curl -X POST http://localhost:4000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"name":"test","email":"test@test.com","password":"123456"}'
```

---

## 🧨 Utility Script

To stop everything:

```bash
./stop-everything.sh
```

---

## 📌 Key Features

- Fully automated CI/CD pipeline
- Code quality analysis integration
- Containerized architecture
- One-command deployment
- Persistent infrastructure setup
- Reproducible environment

---

## ⚠️ Challenges & Solutions

| Problem                        | Solution                                        |
| ------------------------------ | ----------------------------------------------- |
| Jenkins missing tools          | Created custom Jenkins Docker image             |
| Docker permission issues       | Added Docker socket + correct group permissions |
| SonarQube reset on restart     | Added Docker volumes                            |
| Container communication issues | Used Docker network                             |
| Token authentication failure   | Stored token securely in Jenkins                |

---

## 🎯 Conclusion

This project demonstrates how automation simplifies the development and deployment lifecycle. By integrating Jenkins, SonarQube, Docker, and Ansible, the system ensures reliable deployments and improved code quality. It highlights the importance of automation, consistency, and scalability in modern software development practices.

---

## 📚 References

- Docker Documentation
- Jenkins Documentation
- SonarQube Documentation
- Ansible Documentation
