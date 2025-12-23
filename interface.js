const appConfig = require('./appConfig.js');
const { interfaces } = require("./dictionary/interfaces.js");
async function interface(req, res) {
  try {
    const rawHost = (req.get("X-Original-Server") || req.hostname);
    const configOpt = appConfig[rawHost];

    // If no interface configured, return early 
    if (!configOpt || !configOpt.interface) {
      return res.status(200).json({
        host: rawHost,
        interfaceKey: null,
        interface: null,
        note: "No interface configured for this host"
      });
    }

    const interfaceKey = configOpt.interface;
    const interfaceTemplate = interfaces[interfaceKey];

    if (!interfaceTemplate) {
      return res.status(404).json({
        error: "INTERFACE_NOT_FOUND",
        message: `Interface "${interfaceKey}" not found in interfaces.js.`
      });
    }

    const interfaceJson = JSON.parse(JSON.stringify(interfaceTemplate));

    return res.json({
      host: rawHost,
      interfaceKey: interfaceKey,
      interface: interfaceJson
    });
  } 
  
  catch (err) {
    console.error("interfaceRoute error:", err);
    return res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Failed to build interface for this host"
    });
  }
}

module.exports = interface;