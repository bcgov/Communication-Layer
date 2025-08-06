FROM node:20

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxrender1 \
    xdg-utils \
    tini \
  && rm -rf /var/lib/apt/lists/*

# Install Chromium
RUN apt-get update && apt-get install -y chromium && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium    

COPY package*.json ./

RUN npm install

COPY . .

ENTRYPOINT ["/usr/bin/tini", "--"]

EXPOSE 3030

CMD ["npm", "run", "start"]
