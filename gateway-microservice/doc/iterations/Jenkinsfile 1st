pipeline {
    agent any

    environment {
        /* ----------------------------------
           AWS (FRIEND'S ACCOUNT)
        ---------------------------------- */
        AWS_REGION      = 'us-west-2'
        ECR_REGISTRY    = '418384447470.dkr.ecr.us-west-2.amazonaws.com'
        AWS_CRED_ID     = 'signalforge-friend-account'

        /* ----------------------------------
           GitOps / ArgoCD
        ---------------------------------- */
        GITOPS_REPO     = 'git@github.com:maxiemoses-eu/SignalForge-ArgoCD.git'
        GITOPS_BRANCH  = 'main'
        GITOPS_SSH_KEY = 'gitops-ssh-key'

        /* ----------------------------------
           Versioning
        ---------------------------------- */
        SHORT_SHA       = "${env.GIT_COMMIT?.take(7) ?: 'dev'}"
        IMAGE_TAG       = "${SHORT_SHA}-${env.BUILD_NUMBER}"

        /* ----------------------------------
           Caching
        ---------------------------------- */
        TRIVY_CACHE      = "${WORKSPACE}/.trivy"
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
    }

    stages {

        /* -------------------------------
           1. Detect Changed Services
        --------------------------------*/
        stage('Detect Changes') {
            steps {
                script {
                    def changed = sh(
                        script: "git diff --name-only origin/main...HEAD || echo all",
                        returnStdout: true
                    ).trim().split("\n")

                    SERVICES = []
                    if (changed.any { it.startsWith("gateway-microservice/") || it == 'all' }) SERVICES << "gateway"
                    if (changed.any { it.startsWith("product-microservice/") || it == 'all' }) SERVICES << "product"
                    if (changed.any { it.startsWith("order-microservice/") || it == 'all' })   SERVICES << "order"
                    if (changed.any { it.startsWith("payment-microservice/") || it == 'all' }) SERVICES << "payment"
                    if (changed.any { it.startsWith("user-microservice/") || it == 'all' })    SERVICES << "user"
                    if (changed.any { it.startsWith("store-ui/") || it == 'all' })             SERVICES << "store-ui"

                    if (SERVICES.isEmpty()) {
                        echo "No service changes detected. Skipping pipeline."
                        currentBuild.result = 'NOT_BUILT'
                        return
                    }

                    echo "🚀 Services to build: ${SERVICES}"
                }
            }
        }

        /* -------------------------------
           2. CI: Build & Test
        --------------------------------*/
        stage('CI: Build & Test') {
            parallel {

                stage('Gateway (Node / Security)') {
                    when { expression { SERVICES.contains('gateway') } }
                    steps {
                        dir('gateway-microservice') {
                            sh 'npm ci --cache ${NPM_CONFIG_CACHE}'
                            sh 'npm test'
                        }
                    }
                }

                stage('Product (Node)') {
                    when { expression { SERVICES.contains('product') } }
                    steps {
                        dir('product-microservice') {
                            sh 'npm ci --cache ${NPM_CONFIG_CACHE}'
                            sh 'npm test'
                        }
                    }
                }

                stage('Order (Java)') {
                    when { expression { SERVICES.contains('order') } }
                    steps {
                        dir('order-microservice') {
                            sh './mvnw clean test'
                        }
                    }
                }

                stage('Payment (Go)') {
                    when { expression { SERVICES.contains('payment') } }
                    steps {
                        dir('payment-microservice') {
                            sh 'go test ./...'
                        }
                    }
                }

                stage('User (Python)') {
                    when { expression { SERVICES.contains('user') } }
                    steps {
                        dir('user-microservice') {
                            sh '''
                                python3 -m venv venv
                                venv/bin/pip install -r requirements.txt
                                venv/bin/pytest
                            '''
                        }
                    }
                }

                stage('Store UI') {
                    when { expression { SERVICES.contains('store-ui') } }
                    steps {
                        dir('store-ui') {
                            sh 'npm ci --cache ${NPM_CONFIG_CACHE}'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        /* -------------------------------
           3. Docker Build & Trivy Scan
        --------------------------------*/
        stage('Security Gate: Build & Scan') {
            steps {
                script {
                    sh "mkdir -p ${TRIVY_CACHE}"
                    sh "trivy image --download-db-only --cache-dir ${TRIVY_CACHE}"

                    SERVICES.each { svc ->
                        def path = (svc == 'store-ui') ? 'store-ui' : "${svc}-microservice"
                        def image = "signalforge-${svc}"

                        echo "🔨 Building ${image}"
                        sh "docker build -t ${image}:${IMAGE_TAG} ${path}"

                        echo "🛡️ Scanning ${image}"
                        sh """
                            trivy image \
                              --exit-code 1 \
                              --severity HIGH,CRITICAL \
                              --cache-dir ${TRIVY_CACHE} \
                              --no-progress \
                              ${image}:${IMAGE_TAG}
                        """
                    }
                }
            }
        }

        /* -------------------------------
           4. Push Images to ECR
        --------------------------------*/
        stage('Push Images') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: AWS_CRED_ID]]) {
                    script {
                        sh "aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}"

                        SERVICES.each { svc ->
                            def image = "signalforge-${svc}"
                            sh """
                                docker tag ${image}:${IMAGE_TAG} ${ECR_REGISTRY}/${image}:${IMAGE_TAG}
                                docker push ${ECR_REGISTRY}/${image}:${IMAGE_TAG}
                            """
                        }
                    }
                }
            }
        }

        /* -------------------------------
           5. GitOps Promotion (Helm Values)
        --------------------------------*/
        stage('Promote via GitOps') {
            steps {
                sshagent([GITOPS_SSH_KEY]) {
                    script {
                        sh "git clone ${GITOPS_REPO} gitops"
                        dir('gitops') {

                            SERVICES.each { svc ->
                                sh "yq -i '.image.tag = \"${IMAGE_TAG}\"' charts/${svc}/values.yaml"
                            }

                            sh """
                                git config user.name "SignalForge-CI"
                                git config user.email "ci@signalforge.io"
                                git add .
                                git commit -m "release: ${IMAGE_TAG}" || echo "No changes"
                                git push origin ${GITOPS_BRANCH}
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f'
            cleanWs()
        }
        success {
            echo "✅ SignalForge release ${IMAGE_TAG} completed successfully."
        }
        failure {
            echo "❌ SignalForge pipeline failed. Check tests or Trivy results."
        }
    }
}
