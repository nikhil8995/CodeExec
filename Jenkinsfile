pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('sonar-token')
    }

    stages {

        stage('Install Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                sh '''
                sonar-scanner \
                -Dsonar.projectKey=codeexec \
                -Dsonar.sources=backend,frontend \
                -Dsonar.host.url=http://sonarqube:9000 \
                -Dsonar.token=${SONAR_TOKEN}
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker build -t codeexec-backend ./backend'
                sh 'docker build -t codeexec-frontend ./frontend'
            }
        }

        stage('Deploy to AWS') {
            steps {
                sh 'ansible-playbook ansible/deploy.yml -i ansible/inventory.ini'
            }
        }

    }
}