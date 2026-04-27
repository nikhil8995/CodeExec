# CodeExec – DevOps Enabled Full Stack Application

CodeExec is a full-stack web app with a Jenkins + Ansible deployment pipeline. The pipeline provisions or reuses EC2, builds Docker images, starts PostgreSQL, backend, and frontend containers, and serves the React app from a production static build.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- CI/CD: Jenkins + Ansible
- Containerization: Docker

## How To Run

### 1. Start Docker on the host

Run this on the machine that will host Jenkins, SonarQube, and the deployment containers.

```bash
sudo systemctl start docker
sudo systemctl enable docker
docker ps
```

If Docker complains about permissions, add your user to the `docker` group and log out/in again.

### 2. Clone the repository

```bash
git clone https://github.com/nikhil8995/CodeExec.git
cd CodeExec
```

### 3. Build the custom Jenkins image

```bash
docker build -t my-jenkins ./jenkins
```

This image provides the tools Jenkins needs for the pipeline:

- Node.js and npm
- Docker CLI
- Ansible
- Sonar Scanner

### 4. Start Jenkins and SonarQube

```bash
ansible-playbook ansible/setup-devops.yml
```

Wait 1 to 2 minutes for SonarQube to finish starting.

Open:

- Jenkins: http://localhost:8080
- SonarQube: http://localhost:9000

### 5. Configure SonarQube

Log in with `admin / admin`, change the password, then go to **My Account → Security** and generate a token.

### 6. Configure Jenkins

Unlock Jenkins:

```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

Then:

- Install the suggested plugins
- Add a Jenkins credential with ID `sonar-token`
- Add AWS credentials with IDs `aws-access-key` and `aws-secret-key`

### 7. Create the pipeline job

Create a new Pipeline job in Jenkins and point it to this repository:

- Pipeline from SCM
- Repository URL: this repo
- Branch: `main`
- Script path: `Jenkinsfile`

### 8. Run the pipeline

Click **Build Now**.

The pipeline will:

- Run SonarQube analysis
- Deploy to AWS through `ansible/deploy.yml`
- Clone the repo onto EC2
- Build backend and frontend Docker images
- Start PostgreSQL, backend, and frontend
- Apply Prisma migrations

### 9. Open the website

After deploy, open the frontend in your browser:

- http://<EC2-IP>:5173

You will find the EC2-IP in the console of jenkins.
Use the current EC2 public IP from the deployment output.

## Manual Deploy

If you want to run the app deployment without Jenkins:

```bash
ansible-playbook ansible/deploy.yml
```

## Quick Checks

```bash
curl http://localhost:4000/api/health
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"test","email":"test@test.com","password":"123456"}'
```

## Stop Everything

```bash
./stop-everything.sh
```

## Notes

- `ansible/deploy.yml` is the active deployment playbook.
- The frontend Docker image serves the built `dist` folder, not the Vite dev server.
- If the EC2 public IP changes, update the frontend URL accordingly.