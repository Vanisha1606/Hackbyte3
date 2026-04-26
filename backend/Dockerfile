FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .

ENV PORT=5001
EXPOSE 5001

CMD ["npm", "run", "dev"]
