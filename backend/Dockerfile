FROM node:22-slim

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/hydrosmart?schema=public"
RUN npm run build

EXPOSE 3000 5000 8000 8080

CMD ["npm", "run", "start"]
