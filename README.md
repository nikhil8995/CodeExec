# CodeExec – DevOps Enabled Full Stack Application

## 🚀 Overview

CodeExec is a full-stack web application integrated with a complete DevOps pipeline. It demonstrates continuous integration, automated code quality analysis, containerization, and deployment using modern DevOps tools.

---

## 🛠️ Tech Stack

### Application

- Frontend: React (Vite)
- Backend: Node.js (Express)
- Database: PostgreSQL

### DevOps Tools

- Jenkins – CI/CD Pipeline
- SonarQube – Code Quality Analysis
- Docker – Containerization
- Ansible – Deployment Automation
- GitHub – Version Control

---

## 🔄 CI/CD Pipeline Flow

GitHub → Jenkins → SonarQube → Docker Build → Ansible Deploy

1. Code is pushed to GitHub
2. Jenkins triggers pipeline
3. SonarQube analyzes code quality
4. Docker builds backend & frontend images
5. Ansible deploys containers

---

## 🌐 Application URLs

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- SonarQube: http://localhost:9000
- Jenkins: http://localhost:8080

---

## 🐳 Docker Setup

### Build Images

```bash
docker build -t codeexec-backend ./backend
docker build -t codeexec-frontend ./frontend
```

### Run Containers

Handled automatically via Ansible playbook.

---

## ⚙️ Ansible Deployment

```bash
ansible-playbook ansible/playbook.yml
```

This:

- Stops old containers
- Creates network
- Starts PostgreSQL
- Runs backend & frontend
- Executes database migrations

---

## 🔍 SonarQube Integration

- Code quality is analyzed during Jenkins pipeline
- Reports include:
  - Bugs
  - Code Smells
  - Security Issues

- Dashboard available at:
  http://localhost:9000

---

## 🧪 Testing API

Example:

```bash
curl -X POST http://localhost:4000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"name":"test","email":"test@test.com","password":"123456"}'
```

---

## 📌 Features

- User Authentication (JWT)
- Full CI/CD automation
- Containerized deployment
- Automated code quality checks
- Scalable DevOps architecture

---

## 🎯 Conclusion

This project demonstrates a complete DevOps pipeline integrating CI/CD, automated testing, containerization, and deployment. It ensures faster development cycles, improved code quality, and reliable deployment.

---

## 📚 References

- Docker Documentation
- Jenkins Documentation
- SonarQube Docs
- Ansible Docs
