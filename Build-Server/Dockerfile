FROM ubuntu:focal

# Install system dependencies & Node.js
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y curl git && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Set work directory
WORKDIR /home/app

# Copy package files and install dependencies
COPY package*.json ./
COPY .env .env
RUN npm install

# Copy the remaining files
COPY main.sh script.js ./

# Make scripts executable
RUN chmod +x main.sh

# Set entrypoint to main.sh (script.js will be run inside it if needed)
ENTRYPOINT [ "/home/app/main.sh" ]
