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
                        sh 'cd backend && npm install && npm test'
                    }
                }
                stage('Frontend Test') {
                    steps {
                        sh 'cd frontend && npm install && npm run build && npm run test'
                    }
                }
            }
        }

        // SonarQube stages commented out - uncomment if you have SonarQube plugin configured
        // stage('SonarQube Analysis') {
        //     steps {
        //         withSonarQubeEnv('SonarQube') {
        //             sh '''
        //             sonar-scanner \
        //               -Dsonar.projectKey=codeexec \
        //               -Dsonar.sources=backend/src,frontend/src \
        //               -Dsonar.tests=backend/tests,frontend/src/__tests__ \
        //               -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info \
        //               -Dsonar.login=$SONAR_TOKEN
        //             '''
        //         }
        //     }
        // }

        stage('Deploy to App EC2 Only') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key-staging', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key-staging', variable: 'AWS_SECRET_ACCESS_KEY'),
                    sshUserPrivateKey(credentialsId: 'ec2-key', keyFileVariable: 'SSH_KEY')
                ]) {
                    sh """
                    export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
                    export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
                    export AWS_DEFAULT_REGION=ap-south-1

                    ssh -o StrictHostKeyChecking=no -i $SSH_KEY ubuntu@13.233.31.132 << EOF
                    cd /home/ubuntu/CodeExec

                    git fetch origin
                    git checkout jovan-aws-2ec2 || git checkout main
                    git pull origin jovan-aws-2ec2 || git pull origin main

cd backend
                    docker build --no-cache -t codeexec-backend:latest .
                    docker rm -f codeexec-backend 2>/dev/null || true
                    docker run -d \
                        --name codeexec-backend \
                        --network codeexec-network \
                        -p 4000:4000 \
                        -e DATABASE_URL=postgresql://postgres:strongpassword123@codeexec-postgres:5432/codeexec \
                        -e JWT_SECRET=supersecretjwtkey123 \
                        -e PORT=4000 \
                        --restart unless-stopped \
                        codeexec-backend:latest

cd ../frontend
                    docker build --no-cache --build-arg VITE_API_URL=http://13.233.31.132:4000/api -t codeexec-frontend:latest .
                    docker rm -f codeexec-frontend || true
                    docker run -d --name codeexec-frontend --network codeexec-network -p 5173:5173 --restart unless-stopped codeexec-frontend:latest

                    echo "Deployment complete!"
                    docker ps
EOF
                    """
                }
            }
        }

        stage('App Health Check') {
            steps {
                timeout(time: 120, unit: 'SECONDS') {
                    waitUntil {
                        script {
                            def status = sh(
                                script: "curl -s -o /dev/null -w '%{http_code}' http://13.233.31.132:4000/api/health || echo 000",
                                returnStdout: true
                            ).trim()
                            return status == '200'
                        }
                    }
                }
                echo 'App health check passed!'
            }
        }

    }

    post {
        failure {
             echo "Pipeline failed"
        }

        success {
            echo "Pipeline succeeded"

        }

        always {
            echo 'Cleanup complete'
        }
    }
}