FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci --only=production

COPY src/ ./src/
COPY prisma/ ./prisma/

RUN npx prisma generate

RUN npm run build

RUN addgroup -g 1001 -S nodejs
RUN adduser -S trustiq -u 1001

RUN chown -R trustiq:nodejs /app
USER trustiq

EXPOSE 3001

CMD ["node", "dist/index.js"]