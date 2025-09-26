// portal/expirePortalToken.js
const appConfig = require('../appConfig.js');
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
const buildPortalAuthHeader = require('./authHandler.js');

async function cancelPortalAction(req, res) {
  const { tokenId} = req.body || {};

  console.log('expireNETPortal:', {
    tokenId: req.body?.tokenId
  });

  try {
    if (!tokenId) {
      return res
        .status(400)
        .send({ error: getErrorMessage("FORM_NOT_FOUND_IN_REQUEST") || "Missing tokenId" });
    }

    // Resolve portal config the same way as submit
    const rawHost = (req.get("X-Original-Server") || req.hostname);
    const portalConfig =
      appConfig[rawHost] ||
      Object.values(appConfig).find(cfg => {
        try {
          return new URL(cfg.apiHost).hostname === rawHost;
        } catch {
          return false;
        }
      }) ||
      {};

    const portalHost = portalConfig.apiHost;
    let endpoint = req.body?.path || (portalConfig.expireTokenEndPoint || process.env.PORTAL_EXPIRE_TOKEN_ENDPOINT);
    const interfaceMethod = req.body?.type || "POST";

    const url = portalHost+endpoint;

    if (!portalHost || !endpoint) {
      return res
        .status(400)
        .send({ error: getErrorMessage("ERROR_IN_EXECUTING_ACTION") || "Missing portalHost or endpoint path" });
    }

    const savedJson = { token: tokenId };

    console.log('CancelForPortalAction ->', {
      url,
      interfaceMethod,
      savedJson
    });

    const response = await fetch(url, {
      method: interfaceMethod,
      headers: {
        "Content-Type": "application/json",
        ...buildPortalAuthHeader(portalConfig),
        ...(req.body?.headers || {}),
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

    return res.json({ status: 'success', expired: true });

  } catch (err) {
    console.error('expireNETPortal error:', err);
    return res
      .status(500)
      .send({ error: getErrorMessage("ERROR_IN_EXECUTING_ACTION") || (err?.message || 'Unhandled error') });
  }
}

module.exports = cancelPortalAction;
