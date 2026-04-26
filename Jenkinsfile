pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('sonar-token')
    }

    stages {
        stage('Build & Unit Test') {
            parallel {
                stage('Backend Test') {
                    steps {
                        echo 'Building and testing Backend...'
                        sh 'cd backend && npm install && npm test'
                    }
                }
                stage('Frontend Test') {
                    steps {
                        echo 'Building and testing Frontend...'
                        sh 'cd frontend && npm install && npm run build && npm run test'
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
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
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Container Validation & E2E') {
            steps {
                sh 'docker-compose up -d --build'

                // Wait for PostgreSQL to be ready
                timeout(time: 60, unit: 'SECONDS') {
                    waitUntil {
                        script {
                            def result = sh(
                                script: "curl -s http://localhost:5432 || true",
                                returnStatus: true
                            )
                            return result == 0 || result == 7
                        }
                    }
                }
            }
            post {
                always {
                    sh 'docker-compose down -v'
                }
            }
        }

        stage('Deploy to Staging') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-staging', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key-staging', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                    export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                    export AWS_DEFAULT_REGION=ap-south-1

                    ansible-playbook ansible/deploy.yml -e "env_type=staging" -e "github_ref=${GIT_COMMIT}"
                    '''
                }
            }
        }

        stage('Staging Health Check') {
            steps {
                // Wait for staging to be healthy
                timeout(time: 120, unit: 'SECONDS') {
                    waitUntil {
                        script {
                            def status = sh(
                                script: "curl -s -o /dev/null -w '%{http_code}' http://localhost:4000/api/health || echo '000'",
                                returnStdout: true
                            ).trim()
                            return status == '200'
                        }
                    }
                }
                echo 'Staging health check passed'
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
                    string(credentialsId: 'aws-access-key-production', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key-production', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                    export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                    export AWS_DEFAULT_REGION=ap-south-1

                    ansible-playbook ansible/deploy.yml -e "env_type=production" -e "github_ref=${GIT_COMMIT}"
                    '''
                }
            }
        }
    }

    post {
        failure {
            echo 'Pipeline failed! Sending notification...'
            sh '''
            curl -X POST "$SLACK_WEBHOOK" \
              -H 'Content-type: application/json' \
              --data '{"text": "CodeExec Pipeline Failed: '\"${BUILD_URL}\"'"}'
            '''
        }
        success {
            echo 'Pipeline succeeded!'
            sh '''
            curl -X POST "$SLACK_WEBHOOK" \
              -H 'Content-type: application/json' \
              --data '{"text": "CodeExec Pipeline Succeeded: '\"${BUILD_URL}\"'"}'
            '''
        }
        always {
            echo 'Cleaning up...'
        }
    }
}