# CodeExec – DevOps Enabled Full Stack Application

---

## 🚀 Overview

CodeExec is a full-stack web application integrated with a complete end-to-end DevOps pipeline. The system automates building, code quality analysis, containerization, and deployment.

Every code change goes through an automated pipeline and is deployed without manual effort.

---

## 🛠️ Tech Stack

### Application

- Frontend: React (Vite)
- Backend: Node.js (Express)
- Database: PostgreSQL

### DevOps Tools

- GitHub – Source Code Management
- Jenkins – CI/CD Automation
- SonarQube – Code Quality Analysis
- Docker – Containerization
- Ansible – Deployment Automation

---

## 🔄 CI/CD Pipeline Flow

```text
GitHub → Jenkins → SonarQube → Docker → Ansible → Running Application
```

---

## ⚙️ COMPLETE SETUP (FOLLOW THIS ORDER EXACTLY)

---

### 1. Clone the Repository

```bash
git clone https://github.com/nikhil8995/CodeExec.git
cd CodeExec
```

---

### 2. Build Custom Jenkins Image (MANDATORY)

```bash
docker build -t custom-jenkins ./jenkins
```

Why this is required:

- Default Jenkins does NOT have npm, Docker, or Ansible
- Without this → pipeline WILL fail

This image includes:

- Node.js & npm
- Docker CLI
- Ansible
- Sonar Scanner

---

### 3. Start DevOps Infrastructure

```bash
ansible-playbook ansible/setup-devops.yml
```

This will:

- Start Jenkins (using custom image)
- Start SonarQube (with persistent storage)
- Create Docker network

⏳ Wait ~1–2 minutes for SonarQube to fully start

---

### 4. Access Services

- Jenkins: http://localhost:8080
- SonarQube: http://localhost:9000

---

### 5. SonarQube Setup

- Login: `admin / admin`
- Change password
- Go to **My Account → Security**
- Generate token

---

### 6. Jenkins Setup

Unlock Jenkins:

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Then:

- Install suggested plugins
- Go to **Manage Jenkins → Credentials**
- Add Secret Text:
  - ID: `sonar-token`
  - Value: your Sonar token

---

### 7. Create Pipeline

- New Item → Pipeline
- Pipeline from SCM
- GitHub repo URL
- Branch: `main`
- Script path: `Jenkinsfile`

---

### 8. Run Pipeline

Click **Build Now**

Pipeline will:

- Install dependencies
- Run SonarQube analysis
- Build Docker images
- Deploy using Ansible

---

## 📦 Deployment (Manual Option)

```bash
ansible-playbook ansible/playbook.yml
```

This:

- Stops old containers
- Starts PostgreSQL
- Runs backend
- Runs frontend
- Applies DB migrations

---

## 🌐 Application URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- SonarQube: http://localhost:9000
- Jenkins: http://localhost:8080

---

## 💾 Data Persistence

Docker volumes are used for:

- Jenkins (`jenkins_home`)
- SonarQube (data, users, tokens)

This ensures:

> Restart ≠ Data loss

---

## 🌐 Docker Networking

Custom network:

```text
codeexec-network
```

Allows:

- Backend ↔ Database communication
- Service-to-service communication using names

---

## 🧪 API Test

```bash
curl -X POST http://localhost:4000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"name":"test","email":"test@test.com","password":"123456"}'
```

---

## 🧨 Stop Everything

```bash
./stop-everything.sh
```

---

## ⚠️ Common Issues & Fixes

| Problem                  | Fix                      |
| ------------------------ | ------------------------ |
| npm not found            | Use custom Jenkins image |
| Docker permission error  | Add Docker group access  |
| Sonar login fails        | Regenerate token         |
| Containers can't connect | Use Docker network       |
| Data lost on restart     | Use Docker volumes       |

---

## 📌 Key Features

- Fully automated CI/CD pipeline
- Code quality checks (SonarQube)
- Containerized deployment
- One-command setup
- Persistent infrastructure
- Reproducible environment

---

## 🎯 Conclusion

This project demonstrates how automation simplifies development and deployment. By integrating Jenkins, SonarQube, Docker, and Ansible, the system ensures reliable builds, better code quality, and consistent deployment. It highlights how DevOps practices improve efficiency and reduce manual errors.

---

## 📚 References

- Docker Docs
- Jenkins Docs
- SonarQube Docs
- Ansible Docs
