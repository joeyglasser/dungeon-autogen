FROM node:16
ENV HTTPS=true
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY package*.json ./
ADD public /home/node/app/public
ADD src /home/node/app/src
RUN npm install
RUN npm run build
RUN npm install -g serve
COPY --chown=node:node . .
USER node
EXPOSE 443
CMD ["bash", "-c",  "cd build && openssl req -x509 -newkey rsa:2048 -keyout keytmp.pem -out cert.pem -days 365 && openssl rsa -in keytmp.pem -out key.pem && export HTTPS=true && SSL_CRT_FILE=cert.pem &&SSL_KEY_FILE=key.pem && serve -s -l 443"]