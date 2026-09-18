pipeline {
    agent any



    environment {
    PATH = "/Users/chhairin/.nvm/versions/node/v24.14.1/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
}

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Node') {
            steps {
                sh '''
                    echo "PATH=$PATH"
                    which node
                    which npm
                    node -v
                    npm -v
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Frontend') {
            steps {
                sh 'npm run build'
            }
        }
    }

    post {
        success {
            echo '🎉 Frontend CI passed successfully!'
        }

        failure {
            echo '❌ Frontend CI failed!'
        }
    }
}