FROM node:alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY *.mjs ./
CMD ["node", "app.mjs"]
LABEL org.opencontainers.image.source=https://github.com/kadena-io/eth-pow-beacon
