const redis = require("redis");
const env = require("dotenv").config();
const logger = require('./helper/logger');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,  // Default Redis port
  },
  password: process.env.REDIS_PASSWORD
});

client.on("error", (err) => logger.error(`Redis Error: ${err}`));

async function connectRedis() {
  client.connect();
  logger.info("Connected to Redis");
}

connectRedis();

module.exports = client;
