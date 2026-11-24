const errorMessages = require("./errorMessages.json");
const logger = require('../helper/logger');

const getErrorMessage = (code ,params = {}) => {  
  const env = process.env.NODE_ENV || "prod"; // Default to prod as it might have the most generic messaage
  logger.info(`env ${env}`);
  let errorMessage = errorMessages[env]?.[code] || "Unknown error";
  logger.info(`errorMessage ${errorMessage}`);
    // Replace placeholders with actual values
    Object.keys(params).forEach((key) => {
        errorMessage = errorMessage.replace(`{${key}}`, params[key]);
    });

  return errorMessage;
};

module.exports = { getErrorMessage };