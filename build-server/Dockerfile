FROM ubuntu:focal

# Updating the package list
RUN apt-get update
# Installing the necessary packages(Curl)
RUN apt-get install -y curl
# Installing the Nodejs
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get upgrade -y
RUN apt-get install -y nodejs

# Installing the git
RUN apt-get install git -y

# Setting the working directory
WORKDIR /home/app

# Copying the main.sh file
COPY main.sh main.sh

# Copying the package.json file
COPY package*.json .
COPY  script.js script.js
COPY .env .env

RUN npm install

# Give execute permission to the main.sh file
RUN chmod +x main.sh
RUN chmod +x script.js

# Setting the main.sh file as executable
ENTRYPOINT [ "/home/app/main.sh" ]