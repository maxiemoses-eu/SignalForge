pipeline {
    agent any
    
    environment {
        AWS_REGION       = 'us-west-2'
        ECR_REGISTRY     = '418384447470.dkr.ecr.us-west-2.amazonaws.com'
        AWS_CRED_ID      = 'signalforge-friend-account'
        GITOPS_REPO      = 'git@github.com:maxiemoses-eu/SignalForge-ArgoCD.git'
        GITOPS_BRANCH    = 'main'
        
        // --- NEW SEMANTIC VERSIONING LOGIC ---
        IMAGE_TAG        = sh(script: "git describe --tags --always", returnStdout: true).trim()
        
        TRIVY_CACHE      = "${WORKSPACE}/.trivy"
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
        SERVICES         = "api-gateway,order-microservice,payment-service,product-service"
    }

    stages {
        stage('Initialize') {
            steps {
                sh "mkdir -p ${TRIVY_CACHE} ${NPM_CONFIG_CACHE}"
                echo "Building SignalForge version: ${IMAGE_TAG}"
            }
        }

        stage('Parallel Build & Test') {
            parallel {
                stage('Node (Gateway)') {
                    steps {
                        dir('gateway-microservice') {
                            sh "npm ci --cache ${NPM_CONFIG_CACHE}"
                            sh "npm test -- --watchAll=false"
                        }
                    }
                }
                stage('Node (Product)') {
                    steps {
                        dir('product-microservice') {
                            sh "npm ci --cache ${NPM_CONFIG_CACHE}"
                            sh "npm test -- --watchAll=false"
                        }
                    }
                }
                stage('Go (Payment)') {
                    steps {
                        dir('payment-microservice') {
                            sh "go test -v ./..."
                        }
                    }
                }
                stage('Java (Order)') {
                    steps {
                        dir('order-microservice') {
                            sh "chmod +x mvnw && ./mvnw clean test"
                        }
                    }
                }
            }
        }

        stage('DockerBuild & Security Scan') {
            steps {
                script {
                    sh "trivy image --download-db-only --cache-dir ${TRIVY_CACHE} --timeout 15m"

                    def serviceList = env.SERVICES.split(',')
                    serviceList.each { svc ->
                        def imageName = "signalforge-prod-${svc}"
                        def folderMap = [
                            'api-gateway': 'gateway-microservice',
                            'product-microservice': 'product-microservice',
                            'order-microservice': 'order-microservice',
                            'payment-service': 'payment-microservice'
                        ]
                        def path = folderMap[svc]

                        echo "--- Building: ${imageName}:${IMAGE_TAG} ---"
                        sh "docker build -t ${ECR_REGISTRY}/${imageName}:${IMAGE_TAG} ./${path}"
                        sh "docker tag ${ECR_REGISTRY}/${imageName}:${IMAGE_TAG} ${ECR_REGISTRY}/${imageName}:latest"
                        
                        sh "trivy image --exit-code 1 --severity HIGH,CRITICAL --cache-dir ${TRIVY_CACHE} --timeout 15m ${ECR_REGISTRY}/${imageName}:${IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Push to ECR') {
            steps {
                script {
                    withAWS(credentials: "${AWS_CRED_ID}", region: "${AWS_REGION}") {
                        sh "aws ecr get-login-password --region ${env.AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"

                        env.SERVICES.split(',').each { svc ->
                            def imageName = "signalforge-prod-${svc}"
                            echo "Pushing version ${IMAGE_TAG} to ECR..."
                            sh "docker push ${ECR_REGISTRY}/${imageName}:${IMAGE_TAG}"
                            sh "docker push ${ECR_REGISTRY}/${imageName}:latest"
                        }
                    }
                }
            }
        }

        stage('Update GitOps Repo') {
            steps {
                dir('gitops-update') {
                    git url: "${GITOPS_REPO}", branch: "${GITOPS_BRANCH}", credentialsId: 'gitops-ssh-key'
                    sh """
                        sed -i 's/tag: .*/tag: "${IMAGE_TAG}"/g' values.yaml
                        git config user.email "jenkins@signalforge.com"
                        git config user.name "Jenkins CI"
                        git add .
                        git commit -m "Update SignalForge images to ${IMAGE_TAG}" || true
                        git push origin ${GITOPS_BRANCH}
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
