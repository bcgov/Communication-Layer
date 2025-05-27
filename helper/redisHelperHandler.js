const { randomUUID } = require('crypto');
const client = require("../redisClient");

async function storeData(data) {
  const id = randomUUID();//Math.random().toString(36).substr(2, 9);  
  console.log("Storing on Redis");
  await client.setEx(id, 120, data); // Expires in 120 seconds  
  console.log("Redis Success! ")
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
    console.log(`Deleted key: ${id}`);
  } else {
    console.log(`Key ${id} not found.`);
  }
}

module.exports = {storeData,retrieveData,deleteData};