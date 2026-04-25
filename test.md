# CodeExec: End-to-End DevOps Testing Guide

This guide covers how to verify the entire project locally and on AWS, from the initial code change to the final deployment and monitoring.

---

## 1. Local Infrastructure Setup (Jenkins & SonarQube)
Before running the pipeline, you must set up your local DevOps lab.

### Step 1: Build & Run
1.  **Build Jenkins:** `docker build -t my-jenkins ./jenkins`
2.  **Start Tools:** `ansible-playbook ansible/setup-devops.yml`
3.  **Unlock Jenkins:**
    ```bash
    docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
    ```
4.  **Access:**
    - Jenkins: [http://localhost:8080](http://localhost:8080)
    - SonarQube: [http://localhost:9000](http://localhost:9000) (Default: `admin/admin`)

### Step 2: Connect the Tools
1.  **SonarQube:** Generate a "Global Analysis Token" in **My Account > Security**.
2.  **Jenkins Credentials:** Add the following "Secret Text" credentials:
    - `sonar-token`: (The token from SonarQube)
    - `aws-access-key`: (Your IAM Access Key)
    - `aws-secret-key`: (Your IAM Secret Key)

---

## 2. Testing the Pipeline Locally
To verify the full flow without a real AWS account, you can simulate the deployment by running the stack in your local Docker environment.

1.  **Run the Stack:**
    ```bash
    docker-compose up -d --build
    ```
2.  **Run Backend E2E Tests:**
    ```bash
    cd backend && npm run test:e2e
    ```
3.  **Run Frontend Unit Tests:**
    ```bash
    cd frontend && npm test
    ```
4.  **Verify Monitoring:**
    ```bash
    cd monitoring
    docker-compose -f docker-compose.monitoring.yml up -d
    ```
    - **Prometheus:** `http://localhost:9090` (Check for `http_request_duration_seconds` metrics)
    - **Grafana:** `http://localhost:3000` (Default: `admin/admin`)

---

## 3. AWS Deployment Guide
This project is pre-configured to deploy to an EC2 instance in `ap-south-1`.

### Step 1: AWS Prerequisites
1.  **IAM User:** Create a user with `AmazonEC2FullAccess` and get the Access/Secret keys.
2.  **Key Pair:** Create an EC2 Key Pair named `codeexec-key`. Download the `.pem` file.
3.  **Inject Key to Jenkins:**
    ```bash
    docker cp codeexec-key.pem jenkins:/var/jenkins_home/.ssh/codeexec-key.pem
    docker exec -u root jenkins chmod 400 /var/jenkins_home/.ssh/codeexec-key.pem
    ```

### Step 2: Triggering the Deploy
1.  **Create Jenkins Job:** New Item > Pipeline > "Pipeline script from SCM" > Point to your Git Repo.
2.  **Build Now:** Jenkins will provision the EC2, open ports (22, 4000, 5173), and deploy the app.
3.  **Access App:** `http://<EC2-PUBLIC-IP>:5173`

---

## 4. Summary of DevOps Stack

| Tool | Purpose | Status |
| :--- | :--- | :--- |
| **Jenkins** | CI/CD Orchestrator | Automated via `Jenkinsfile` |
| **Ansible** | Infrastructure & Deployment | Playbooks in `ansible/` |
| **SonarQube** | Static Code Analysis | Configured in `sonar-project.properties` |
| **Prometheus** | Metrics Collection | Setup in `monitoring/prometheus/` |
| **Grafana** | Visualization | Provisioned in `monitoring/grafana/` |
| **Docker** | Containerization | `Dockerfile` in each service |
| **Prisma** | DB Migrations | Automated in the deployment stage |

---

## 5. Automatic CI (GitHub Actions)
Pushing to the `main` branch triggers the workflow defined in `.github/workflows/ci.yml`, which runs:
- **Linting**
- **Backend Unit & E2E Tests** (via ephemeral Postgres service)
- **Frontend Unit Tests**
