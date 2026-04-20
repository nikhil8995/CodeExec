FROM jenkins/jenkins:lts

USER root

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    ca-certificates \
    curl \
    nodejs \
    npm \
    docker.io \
    python3 \
    python3-pip \
    ansible \
    rsync \
    unzip \
    wget \
    && apt-get clean

# Install AWS SDK for Ansible
RUN pip3 install boto3 botocore

# Install Ansible AWS collection
RUN ansible-galaxy collection install amazon.aws

# Install Sonar Scanner
RUN wget https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip -O /tmp/sonar.zip && \
    unzip /tmp/sonar.zip -d /opt && \
    mv /opt/sonar-scanner-5.0.1.3006-linux /opt/sonar-scanner && \
    ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner && \
    rm /tmp/sonar.zip

# Give Jenkins access to Docker
RUN usermod -aG docker jenkins

USER jenkins