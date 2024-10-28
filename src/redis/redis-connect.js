const { createClient } = require('redis');

let client;
const connectRedis = async (retries = 5) => {
  if (client) return client;

  let attempts = 0;
  while (attempts < retries) {
    try {
      client = createClient({
        socket: {
          host: 'redis',  // Docker Compose 中 Redis 服務名稱
          port: 6379      // Redis 默認端口
        }
      })
      .on('error', (err) => {
        console.log('Redis Client Error', err);
      });

      await client.connect();

      console.log('Connected to Redis successfully');
      return client;
    } catch (error) {
      attempts++;
      console.log(`Attempt ${attempts} to connect to Redis failed:`, err);

      if (attempts >= retries) {
        console.log('Max retries reached, continuing without Redis.');
        return null; // 或者根據需要返回一個標誌，繼續執行其他邏輯
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 1 秒後重試
    }
  }
}

module.exports = {
  connectRedis
}