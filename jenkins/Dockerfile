FROM jenkins/jenkins:lts

USER root

# Fix SSL + install required tools
RUN apt-get update && \
    apt-get install -y \
    ca-certificates \
    nodejs \
    npm \
    docker.io \
    ansible \
    wget \
    unzip \
    && apt-get clean

# Install Sonar Scanner (stable + explicit)
RUN wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip -O /tmp/sonar.zip && \
    unzip /tmp/sonar.zip -d /opt && \
    mv /opt/sonar-scanner-5.0.1.3006-linux /opt/sonar-scanner && \
    ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/bin/sonar-scanner && \
    rm /tmp/sonar.zip

USER jenkins