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
EXPOSE 3000
CMD ["bash", "-c",  "cd build && serve -s -l 3000"]