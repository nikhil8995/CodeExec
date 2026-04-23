pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('sonar-token')
        // Using same AWS credentials for both staging and production environments
        AWS_CREDS = credentials('aws-access-key')
        AWS_SECRET = credentials('aws-secret-key')
    }

    stages {
        stage('Build & Unit Test') {
            steps {
                echo 'Building and testing Backend...'
                sh 'cd backend && npm install && npm test'
                
                echo 'Building and testing Frontend...'
                sh 'cd frontend && npm install && npm run build && npm run test'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                // Ensure Sonar uses the LCOV generated in the previous step
                sh '''
                sonar-scanner \
                  -Dsonar.projectKey=codeexec \
                  -Dsonar.sources=backend/src,frontend/src \
                  -Dsonar.tests=backend/tests,frontend/src/__tests__ \
                  -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info \
                  -Dsonar.host.url=http://sonarqube:9000 \
                  -Dsonar.token=${SONAR_TOKEN}
                '''
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    // Requires "SonarQube Scanner" plugin configuration on Jenkins
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Container Validation & E2E') {
            steps {
                // Spin up local containers
                sh 'docker-compose up -d --build'
                
                // Give Postgres and API time to start
                sleep 5
                
                // Run E2E logic inside the Jenkins Workspace pointing to the local containers
                sh 'export E2E_BASE_URL=http://localhost:4000 && cd backend && npm run test:e2e'
            }
            post {
                always {
                    // Clean up validation containers
                    sh 'docker-compose down -v'
                }
            }
        }

        stage('Deploy to Staging') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                    export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                    export AWS_DEFAULT_REGION=ap-south-1

                    ansible-playbook ansible/deploy.yml -e "env_type=staging"
                    '''
                }
            }
        }

        stage('Production Approval') {
            steps {
                input message: "Promote Staging to Production?", ok: "Deploy!"
            }
        }

        stage('Deploy to Production') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                    export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                    export AWS_DEFAULT_REGION=ap-south-1

                    ansible-playbook ansible/deploy.yml -e "env_type=production"
                    '''
                }
            }
        }
    }
}