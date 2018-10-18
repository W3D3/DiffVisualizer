FROM node:8
# Install webpack
RUN npm install webpack@3.12 -g
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install
# Bundle app source
COPY . /usr/src/app
#RUN webpack

CMD [ "npm", "start" ]