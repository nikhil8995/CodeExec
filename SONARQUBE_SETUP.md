# SonarQube Docker Setup & Configuration

Follow these steps to set up SonarQube for the CodeExec project.

## 1. Run SonarQube Container
If you haven't started SonarQube yet, use the following command to run it in a Docker container:

```bash
docker run -d \
  --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  -v sonarqube_logs:/opt/sonarqube/logs \
  sonarqube:lts
```

## 2. Initial Login
- **URL**: `http://localhost:9000` (or the IP of your server)
- **Default Credentials**: `admin` / `admin`
- *You will be prompted to change the password on first login.*

## 3. Create Project
1. Click on **"Create Project"** -> **"Manually"**.
2. **Project Key**: `codeexec`
3. **Display Name**: `CodeExec Project`
4. Click **"Set Up"**.

## 4. Generate Analysis Token
1. Go to **"My Account"** (top right) -> **"Security"**.
2. Under **"Tokens"**, provide a name (e.g., `jenkins-token`).
3. **Type**: `User Token`.
4. Click **"Generate"** and **SAVE THIS TOKEN**. You will need to add it to Jenkins as a "Secret Text" credential named `sonar-token`.

## 5. Configure Webhook (For Jenkins Feedback)
This allows SonarQube to tell Jenkins if the Quality Gate passed or failed.
1. Go to **Administration** (top bar) -> **Configuration** -> **Webhooks**.
2. Click **"Create"**.
3. **Name**: `Jenkins Webhook`
4. **URL**: `http://<jenkins_url>:8080/sonarqube-webhook/`
5. Click **"Create"**.

## 6. Define Quality Gate (Strict Mode)
1. Go to **"Quality Gates"** (top bar).
2. Click **"Create"** or modify the default one.
3. Add the following conditions:
   - **Coverage on New Code**: `is less than 80.0%`
   - **Bugs on New Code**: `is greater than 0`
   - **Vulnerabilities on New Code**: `is greater than 0`
   - **Maintainability Rating on New Code**: `is worse than A`
4. Navigate to your `codeexec` project -> **Project Settings** -> **Quality Gate** and select your new gate.

## 7. Analysis Properties
The project is already configured to look for `sonar-project.properties` in the root. Ensure it contains:
```properties
sonar.projectKey=codeexec
sonar.sources=backend,frontend
sonar.host.url=http://sonarqube:9000
sonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info
sonar.test.inclusions=**/*.test.js,**/*.test.jsx
sonar.exclusions=**/node_modules/**,**/dist/**
```
