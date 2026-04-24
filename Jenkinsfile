pipeline {
    agent any

    environment {
        SONAR_TOKEN = credentials('sonar-token')
    }

    stages {

        stage('SonarQube Analysis') {
            steps {
                sh '''
                ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
                -Dsonar.projectKey=codeexec \
                -Dsonar.sources=backend,frontend \
                -Dsonar.host.url=http://sonarqube:9000 \
                -Dsonar.token=${SONAR_TOKEN}
                '''
            }
        }

        stage('Deploy to AWS') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                    export AWS_DEFAULT_REGION=ap-south-1

                    ansible-playbook ansible/deploy.yml
                    '''
                }
            }
        }
    }
}