const appConfig = require('../appConfig.js');
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
const buildPortalAuthHeader = require('./authHandler.js');
const logger = require('../helper/logger');

async function saveForPortalAction(req, res) {
  const { tokenId, savedForm } = req.body;

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
    let endpoint = req.body?.path ||portalConfig.saveEndpoint;
    const interfaceMethod = req.body?.type || "POST";

    
    const url = portalHost+endpoint;

    if (!portalHost || !endpoint) {
      return res
        .status(400)
        .send({ error: getErrorMessage("ERROR_IN_EXECUTING_ACTION") || "Missing portalHost or endpoint path" });
    }

    const base64EncodedJson = Buffer.from(savedForm, "utf8").toString("base64");
    const savedJson = { token: tokenId, jsonToSave: base64EncodedJson };

    logger.debug({
      tokenId,
      url,
      interfaceMethod,
      savedJson
    },`SaveForPortalAction`);

    const response = await fetch(url, {
      method: interfaceMethod,
      headers: {
        "Content-Type": "application/json",
        ...buildPortalAuthHeader(portalConfig),
        ...(req.body?.headers || {}),
      },
      body: JSON.stringify(savedJson),
    });

    logger.info(`Fetch status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      return res
        .status(400)
        .send({ error: getErrorMessage("ERROR_IN_EXECUTING_ACTION") || `Endpoint error: ${response.status} ${text}` });
    }

    res.json({ status: "success" });
  } catch (error) {
    logger.error(`saveForPortalAction error: ${error}`);
    return res
      .status(400)
      .send({ error: getErrorMessage("ERROR_IN_EXECUTING_ACTION") });
  }
}

module.exports = saveForPortalAction;
