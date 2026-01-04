FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci

EXPOSE 3000
EXPOSE 24678

CMD ["npm", "run", "dev"]