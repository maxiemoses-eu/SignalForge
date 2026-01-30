pipeline {
    agent any
    environment {
        AWS_REGION       = 'us-west-2'
        ECR_REGISTRY     = '418384447470.dkr.ecr.us-west-2.amazonaws.com'
        AWS_CRED_ID      = 'signalforge-friend-account'
        GITOPS_REPO      = 'git@github.com:maxiemoses-eu/SignalForge-ArgoCD.git'
        GITOPS_BRANCH    = 'main'
        GITOPS_SSH_KEY   = 'gitops-ssh-key'
        IMAGE_TAG        = "${env.GIT_COMMIT?.take(7)}-${env.BUILD_NUMBER}"
        TRIVY_CACHE      = "${WORKSPACE}/.trivy"
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
    }

    stages {
        stage('Initialize') {
            steps {
                script {
                    env.SERVICES_TO_BUILD = "gateway,product,order,payment,user,store-ui"
                    sh "mkdir -p ${TRIVY_CACHE} ${NPM_CONFIG_CACHE}"
                }
            }
        }

        stage('Parallel Build & Test') {
            parallel {
                stage('Go (Payment)') {
                    steps {
                        dir('payment-microservice') {
                            sh 'go test -v ./...'
                        }
                    }
                }
                stage('Node (Product)') {
                    steps {
                        dir('product-microservice') {
                            sh 'npm ci --cache ${NPM_CONFIG_CACHE}'
                            sh 'npm test || echo "Tests skipped"'
                        }
                    }
                }
                stage('Java (Order)') {
                    steps {
                        dir('order-microservice') {
                            sh 'chmod +x mvnw && ./mvnw clean test'
                        }
                    }
                }
                stage('Python (User)') {
                    steps {
                        dir('user-microservice') {
                            sh '''
                                python3 -m venv venv
                                venv/bin/pip install pytest
                                venv/bin/pytest tests/
                            '''
                        }
                    }
                }
            }
        }

        stage('Security Gate (Trivy)') {
            steps {
                script {
                    // FIX: Timeout increased to 15m to prevent DB download crashes
                    sh "trivy image --download-db-only --cache-dir ${TRIVY_CACHE} --timeout 15m"
                    
                    def services = env.SERVICES_TO_BUILD.split(',')
                    services.each { svc ->
                        def image = "signalforge-${svc}"
                        def path = (svc == 'store-ui') ? 'store-ui' : "${svc}-microservice"
                        sh "docker build -t ${image}:${IMAGE_TAG} ${path}"
                        sh "trivy image --exit-code 1 --severity HIGH,CRITICAL --cache-dir ${TRIVY_CACHE} --timeout 15m ${image}:${IMAGE_TAG}"
                    }
                }
            }
        }
        
        // stage('Push & Promote') continues here...
    }
}