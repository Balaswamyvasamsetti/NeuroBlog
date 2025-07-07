FROM node:18

WORKDIR /app
COPY package.json .
RUN apt-get update && apt-get install -y python3 make g++ \
    && npm install \
    && npm rebuild bcrypt --build-from-source \
    && apt-get remove -y python3 make g++ && apt-get autoremove -y
COPY . .
COPY server/.env ./server/.env
EXPOSE 8080 8081
CMD ["node", "server/server.js"]