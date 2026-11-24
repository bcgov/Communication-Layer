const { randomUUID } = require('crypto');
const client = require("../redisClient");
const logger = require('./logger');

async function storeData(data) {
  const id = randomUUID();//Math.random().toString(36).substr(2, 9);  
  logger.info("Storing on Redis");
  await client.setEx(id, 120, data); // Expires in 120 seconds  
  logger.info("Redis Success! ")
  return id;
}

// Retrieve JSON
async function retrieveData(id) {
  const data = await client.get(id);
  return data ? data : null;
}

async function deleteData(id) {
  const result = await client.del(id);
  if (result) {
    logger.info(`Deleted key`);
    logger.debug(`with id: ${id}`);
  } else {
    logger.info(`Key not found`);
    logger.debug(id);
  }
}

module.exports = {storeData,retrieveData,deleteData};