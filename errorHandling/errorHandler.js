const errorMessages = require("./errorMessages.json");

const getErrorMessage = (code ,params = {}) => {  
  const env = process.env.NODE_ENV || "prod"; // Default to prod as it might have the most generic messaage
  console.log("env >>",env);
  let errorMessage = errorMessages[env]?.[code] || "Unknown error";
  console.log("errorMessage >>",errorMessage);
    // Replace placeholders with actual values
    Object.keys(params).forEach((key) => {
        errorMessage = errorMessage.replace(`{${key}}`, params[key]);
    });

  return errorMessage;
};

module.exports = { getErrorMessage };