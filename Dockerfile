ARG SERVICE_NAME=gateway

FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY nest-cli.json tsconfig*.json ./
COPY apps ./apps
COPY libs ./libs

RUN npm run build

ENV NODE_ENV=production
ENV SERVICE_NAME=${SERVICE_NAME}

CMD ["sh", "-c", "node dist/apps/$SERVICE_NAME/main.js"]

