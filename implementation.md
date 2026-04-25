# DevOps Pipeline and Testing Plan

This plan outlines the steps to build a robust DevOps pipeline for the CodeExec project, integrating automated testing, code quality analysis with SonarQube, and automated deployment.

## User Review Required

> [!IMPORTANT]
> The current setup lacks any automated tests. I will be adding basic test frameworks (Jest for Backend, Vitest for Frontend) and initial tests.
> 
> [!WARNING]
> SonarQube Quality Gate will be enabled in the pipeline. If the code does not meet the quality standards, the build will fail and deployment will be blocked.

## Proposed Changes

### 1. Automated Testing Setup (Expanded)

#### Backend Testing (Jest + Supertest)
We will implement integration tests for core API endpoints:
- **Auth Service**:
  - `POST /api/auth/register`: Test user creation and duplicate email handling.
  - `POST /api/auth/login`: Test credential validation and JWT issuance.
- **Questions Service**:
  - `GET /api/questions`: Verify students see all questions.
  - `POST /api/questions`: Verify ONLY users with `TEACHER` role can create questions.
  - `DELETE /api/questions/:id`: Verify role-based access control (RBAC).
- **Submissions Service**:
  - `POST /api/submissions/run`: Test code execution logic with mocks.
  - `GET /api/submissions/mine`: Verify user-specific data isolation.

#### Frontend Testing (Vitest + RTL)
We will implement component and logic tests:
- **Authentication**: Test login form validation and error message display.
- **Question Dashboard**: Verify question cards render correctly and filters work.
- **Code Editor**: Test that the editor passes code changes to the parent state properly.
- **Role-Based UI**: Verify specific buttons (e.g., "Create Question") are hidden for students.

#### E2E Workflow Testing (System Integration)
To reflect real-world usage, we will add a script to test the complete lifecycle:
- **Flow**: `Auth` (Teacher) -> `Create Question` -> `Auth` (Student) -> `Submit Code` -> `Verify Result`.
- This ensures that the frontend, backend, database, and code-runner are all communicating correctly.
- This will be implemented as a separate integration test suite in the backend.

#### [MODIFY] [backend/package.json](file://wsl$/Ubuntu/home/jovaan05/projects/CodeExec/backend/package.json)
- Add `jest`, `supertest` for API testing.
- Add `"test": "jest --coverage --forceExit"` script.
- Add `"test:e2e": "jest --config jest.e2e.config.js"` script.

#### [NEW] [backend/tests/](file://wsl$/Ubuntu/home/jovaan05/projects/CodeExec/backend/tests/) [NEW]
- `auth.test.js`, `questions.test.js`, `submissions.test.js`.

#### [MODIFY] [frontend/package.json](file://wsl$/Ubuntu/home/jovaan05/projects/CodeExec/frontend/package.json)
- Add `vitest`, `@testing-library/react`, `jsdom`, `@vitest/coverage-v8`.
- Add `"test": "vitest run --coverage"` script.

---

### 2. SonarQube Integration & Configuration Plan

#### SonarQube Server Configuration
We will configure the following on the SonarQube server:
1. **Quality Profile**: Use "Sonar way" as base, but enforce strict rules for:
   - Forbidding `console.log` in backend code.
   - Forbidding `any` types if we move to TypeScript.
   - Enforcing React Hook dependency rules.
2. **Quality Gate Settings**:
   - **Coverage on New Code**: > 80% (Mandatory for passing).
   - **Bugs**: 0 (Block build if any).
   - **Vulnerabilities**: 0 (Block build if any).
   - **Maintainability Rating**: Level A.
3. **Webhooks**: 
   - Configure a webhook to point back to `http://jenkins-server/sonarqube-webhook/` to provide immediate feedback to the pipeline.

#### Project Analysis Properties
#### [MODIFY] [sonar-project.properties](file://wsl$/Ubuntu/home/jovaan05/projects/CodeExec/sonar-project.properties)
- `sonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info`
- `sonar.test.inclusions=**/*.test.js,**/*.test.jsx`
- `sonar.exclusions=**/node_modules/**,**/dist/**`

---

### 3. Container Validation Stage (CI Docker Check)

To ensure the Docker images are production-ready, we will add a validation stage in the pipeline:
- **Build**: Build the `codeexec-backend` and `codeexec-frontend` Docker images.
- **Spin-up**: Use `docker-compose` to start the entire stack (DB + Backend + Frontend) within the Jenkins agent.
- **Validation**: 
  - Execute a "Smoke Test" (e.g., `curl http://localhost:4000/api/health`) to ensure the backend is reachable inside the container.
  - Run the `Supertest` suite against the containerized API directly.
- **Clean-up**: Tear down the containers after validation.

#### [MODIFY] [docker-compose.yml](file://wsl$/Ubuntu/home/jovaan05/projects/CodeExec/docker-compose.yml)
- Update to include `backend` and `frontend` service definitions for local/CI orchestration.

---

### 4. Monitoring & Observability

To transform this into a production-grade system, we will implement integrated monitoring:
- **Metrics Collection**:
  - Integrate Prometheus into the backend using `express-prometheus-bundle`.
  - Capture **API response times**, **request rates**, and **error rates**.
  - Monitor **system load** specifically during the execution of user code submissions.
- **Visualization**:
  - Deploy **Grafana** alongside the application.
  - Create a dashboard showing:
    - Container CPU/Memory usage.
    - Number of code submissions per minute.
    - Database connection health.

---

### 5. Staging → Production Deployment Flow

We will move away from direct-to-production deployments to a tiered approach:
- **Staging Environment**: 
  - Automatically deployed after all CI checks (Tests, SonarQube, Container Validation) pass.
  - Used for final visual and E2E verification.
- **Manual Approval**: 
  - Jenkins will pause and wait for a "Go/No-Go" from a developer before touching Production.
- **Production Environment**:
  - Only deployed after explicit manual approval.
  - Ensures zero-surprise deployments.

---

### 6. DevOps Pipeline (Jenkins)

#### [MODIFY] [Jenkinsfile](file://wsl$/Ubuntu/home/jovaan05/projects/CodeExec/Jenkinsfile)
Update the pipeline to include the following stages:
1. **Build & Unit Test**: `npm install` and run unit tests.
2. **SonarQube Analysis**: Deep scan and Quality Gate check.
3. **Container Validation & E2E**: 
   - `docker-compose up -d`
   - Run `npm run test:e2e` against the local containerized stack.
4. **Deploy to Staging**: Automated Ansible run targeting the staging EC2.
5. **Production Approval**: `input message: 'Promote to Production?'`
6. **Deploy to Production**: Final Ansible run targeting production EC2.

---

## Open Questions

> [!QUESTION]
> Do you have a specific SonarQube server already configured with a Quality Gate, or should we use the default "Sonar way" gate?
> 
> [!QUESTION]
> For the deployment stage, should we include a "Staging" environment check before pushing to the production EC2 instance?

## Verification Plan

### Automated Tests
- Run `npm test` manually in both `backend` and `frontend` directories after setup.
- Trigger the Jenkins pipeline and verify all stages complete successfully.

### Manual Verification
- Check the SonarQube dashboard to ensure metrics and coverage are being reported correctly.
- Verify the application is still accessible on the EC2 instance after the pipeline deployment.
