pipeline {
    agent any

    stages {

        stage('Pull Code') {
            steps {
                git 'https://github.com/nikhil8995/CodeExec.git'
            }
        }

        stage('Deploy to AWS via Ansible') {
            steps {
                sh '''
                ansible-playbook ansible/deploy.yml -i ansible/inventory.ini
                '''
            }
        }
    }
}