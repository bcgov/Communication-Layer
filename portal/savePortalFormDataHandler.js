const appConfig = require('../appConfig.js');
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
const buildPortalAuthHeader = require('./authHandler.js');

async function saveForPortalAction(req, res) {
  const { tokenId, savedForm } = req.body;

  console.log('saveForPortalAction:', {
    tokenId: req.body?.tokenId,
    savedForm: typeof req.body?.savedForm,
  });

  try {
    if (!tokenId || !savedForm) {
      return res
        .status(400)
        .send({ error: "Missing tokenId or savedForm" });
    }

    const rawHost = (req.get("X-Original-Server") || req.hostname);
    const portalConfig =
      appConfig[rawHost] ||
      Object.values(appConfig).find(cfg => {
        try {
          return new URL(cfg.apiHost).hostname === rawHost;
        } catch {
          return false;
        }
      }) || {};

    const portalHost = portalConfig.apiHost;
    const endpoint = portalConfig.saveEndpoint;
    const url = portalHost+endpoint;
    const method = "POST";

    if (!portalHost || !endpoint) {
      return res
        .status(400)
        .send({ error: getErrorMessage("ERROR_IN_EXECUTING_ACTION") || "Missing portalHost or endpoint path" });
    }

    const base64EncodedJson = Buffer.from(savedForm, "utf8").toString("base64");
    const savedJson = { token: tokenId, jsonToSave: base64EncodedJson };

    console.log('SaveForPortalAction ->', {
      url,
      method,
      savedJson
    });

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...buildPortalAuthHeader(portalConfig),
      },
      body: JSON.stringify(savedJson),
    });

    console.log("Fetch status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      return res
        .status(400)
        .send({ error: getErrorMessage("ERROR_IN_EXECUTING_ACTION") || `Endpoint error: ${response.status} ${text}` });
    }

    res.json({ status: "success" });
  } catch (error) {
    console.error("saveForPortalAction error:", error);
    return res
      .status(400)
      .send({ error: getErrorMessage("ERROR_IN_EXECUTING_ACTION") });
  }
}

module.exports = saveForPortalAction;
