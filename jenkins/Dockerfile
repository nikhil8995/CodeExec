FROM jenkins/jenkins:lts

USER root

# Install system dependencies (LEANER)
RUN apt-get update && \
    apt-get install -y \
    ca-certificates \
    curl \
    git \
    python3 \
    python3-pip \
    ansible \
    rsync \
    unzip \
    wget \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 🔥 FIX: allow pip install in system env (PEP 668 workaround)
RUN pip3 install --break-system-packages boto3 botocore

# Install Ansible AWS collection
RUN ansible-galaxy collection install amazon.aws

# Install Sonar Scanner (lighter + cleaner)
RUN wget -q https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip -O /tmp/sonar.zip && \
    unzip -q /tmp/sonar.zip -d /opt && \
    mv /opt/sonar-scanner-5.0.1.3006-linux /opt/sonar-scanner && \
    ln -s /opt/sonar-scanner/bin/sonar-scanner /usr/local/bin/sonar-scanner && \
    rm /tmp/sonar.zip


USER jenkins