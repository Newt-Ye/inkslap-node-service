# 使用 Node.js 的官方映像
FROM node:18

# 設定工作目錄
WORKDIR /var/www/html

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製應用程式代碼
COPY . .

# 暴露應用程式運行的端口
EXPOSE 3005

# 啟動應用程式
CMD ["npm", "run", "start:prod"]
