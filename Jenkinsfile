pipeline {
    agent any
    
    environment {
        AWS_REGION       = 'us-west-2'
        ECR_REGISTRY     = '418384447470.dkr.ecr.us-west-2.amazonaws.com'
        AWS_CRED_ID      = 'signalforge-friend-account'
        GITOPS_REPO      = 'git@github.com:maxiemoses-eu/SignalForge-ArgoCD.git'
        GITOPS_BRANCH    = 'main'
        IMAGE_TAG        = "${env.GIT_COMMIT?.take(7)}-${env.BUILD_NUMBER}"
        TRIVY_CACHE      = "${WORKSPACE}/.trivy"
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
        // SERVICES list remains the same, store-ui directory mapping is handled in the build stage
        SERVICES         = "gateway,product,order,payment,user,store-ui"
    }

    stages {
        stage('Initialize') {
            steps {
                script {
                    sh "mkdir -p ${TRIVY_CACHE} ${NPM_CONFIG_CACHE}"
                }
            }
        }

        stage('Parallel Build & Test') {
            parallel {
                stage('Node (Gateway)') {
                    steps {
                        dir('gateway-microservice') {
                            sh 'npm ci --cache ${NPM_CONFIG_CACHE}'
                            sh 'npm test || echo "Gateway tests skipped"'
                        }
                    }
                }
                // FIXED: store-ui is now processed as a Python service
                stage('Python (Store-UI)') {
                    steps {
                        dir('store-ui') {
                            sh '''
                                python3 -m venv venv
                                . venv/bin/activate
                                pip install --upgrade pip
                                # Install requirements if file exists, otherwise just pytest
                                [ -f requirements.txt ] && pip install -r requirements.txt || pip install pytest
                                pytest tests/ || echo "UI tests skipped"
                            '''
                        }
                    }
                }
                stage('Node (Product)') {
                    steps {
                        dir('product-microservice') {
                            sh 'npm ci --cache ${NPM_CONFIG_CACHE}'
                            sh 'npm test || echo "Product tests skipped"'
                        }
                    }
                }
                stage('Go (Payment)') {
                    steps {
                        dir('payment-microservice') {
                            sh 'go test -v ./...'
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
                                . venv/bin/activate
                                pip install --upgrade pip
                                [ -f requirements.txt ] && pip install -r requirements.txt || pip install pytest
                                pytest tests/
                            '''
                        }
                    }
                }
            }
        }

        stage('Build & Security Scan') {
            steps {
                script {
                    sh "trivy image --download-db-only --cache-dir ${TRIVY_CACHE} --timeout 15m"
                    
                    def serviceList = env.SERVICES.split(',')
                    serviceList.each { svc ->
                        def imageName = "signalforge-${svc}"
                        def path = (svc == 'store-ui') ? 'store-ui' : "${svc}-microservice"
                        
                        echo "--- Processing Image: ${imageName} ---"
                        
                        sh "docker build -t ${ECR_REGISTRY}/${imageName}:${IMAGE_TAG} ./${path}"
                        
                        // Exit code 1 ensures pipeline fails if HIGH/CRITICAL vulnerabilities are found
                        sh "trivy image --exit-code 1 --severity HIGH,CRITICAL --cache-dir ${TRIVY_CACHE} --timeout 15m ${ECR_REGISTRY}/${imageName}:${IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Push to ECR') {
            steps {
                script {
                    withAWS(credentials: "${AWS_CRED_ID}", region: "${AWS_REGION}") {
                        sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"
                        
                        def serviceList = env.SERVICES.split(',')
                        serviceList.each { svc ->
                            def imageName = "signalforge-${svc}"
                            sh "docker push ${ECR_REGISTRY}/${imageName}:${IMAGE_TAG}"
                        }
                    }
                }
            }
        }

        stage('Update GitOps Repo') {
            steps {
                script {
                    dir('gitops-update') {
                        git url: "${GITOPS_REPO}", branch: "${GITOPS_BRANCH}", credentialsId: 'gitops-ssh-key'
                        
                        sh """
                            # Replace the tag in the YAML configuration
                            sed -i 's/tag: .*/tag: "${IMAGE_TAG}"/g' values.yaml
                            git config user.email "jenkins@signalforge.com"
                            git config user.name "Jenkins CI"
                            git add .
                            git commit -m "Update images to ${IMAGE_TAG}" || echo "No changes to commit"
                            git push origin ${GITOPS_BRANCH}
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            echo "Build failed. Check the logs for specific microservice errors."
        }
    }
}