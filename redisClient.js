const redis = require("redis");
const env = require("dotenv").config();

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,  // Default Redis port
  }
});

client.on("error", (err) => console.error("Redis Error:", err));

async function connectRedis() {
  client.connect();
  console.log("Connected to Redis");
}

connectRedis();

module.exports = client;
