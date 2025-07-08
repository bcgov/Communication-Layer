let appCfg
try {
  appCfg = JSON.parse(process.env.APP_CONFIG)
} catch (err) {
  console.error("Failed to parse APP_CONFIG:", err)
  appCfg = {}
}
module.exports = appCfg

// module.exports = {
//   CAREGIVER: {
//     baseUrl: process.env.PORTAL_CAREGIVER_BASE_URL,
//     apihost: process.env.PORTAL_CAREGIVER_API_HOST,
//     apiKey: process.env.PORTAL_CAREGIVER_API_KEY,
//     getParametersEndpoint:process.env.PORTAL_VALIDATE_TOKEN_ENDPOINT,
//     expireTokenEndPoint:process.env.PORTAL_EXPIRE_TOKEN_ENDPOINT
//   },
//   PORTALB: {
//     baseUrl: 'https:myportalBbaseurl',
//     apiKey: 'portalB-secret',
//   },
//   // Add more apps as needed
// };