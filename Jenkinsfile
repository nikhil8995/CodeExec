pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('sonar-token')
    }

    stages {

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

        stage('Deploy to AWS') {
            steps {
                sh 'ansible-playbook ansible/deploy.yml -i ansible/inventory.ini'
            }
        }

    }
}