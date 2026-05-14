FROM node:20-slim

RUN apt-get update && apt-get install -y chromium chromium-sandbox --no-install-recommends && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

ENV CHROME_PATH=/usr/bin/chromium
ENV PORT=3001

EXPOSE 3001
CMD ["npm", "start"]
