FROM jenkins/jenkins:lts

USER root

# Install required tools
RUN apt-get update && \
    apt-get install -y \
    nodejs \
    npm \
    docker.io \
    ansible \
    wget \
    unzip \
    && apt-get clean

# Install Sonar Scanner
RUN wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip && \
    unzip sonar-scanner-cli-*.zip && \
    mv sonar-scanner-* /opt/sonar-scanner && \
    ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/bin/sonar-scanner && \
    rm sonar-scanner-cli-*.zip

USER jenkins
