FROM node:22-slim

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . .

ARG VITE_API_URL=https://farm-management-production-1c61.up.railway.app
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

EXPOSE 3000 8080

CMD ["node", "server.mjs"]
