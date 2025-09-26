const appConfig = require('../appConfig.js');
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
const buildPortalAuthHeader = require('./authHandler.js');

async function submitForPortalAction(req, res) {
  const { tokenId } = req.body;

  try {
    if (!tokenId) {
      return res
        .status(400)
        .send({ error:"Missing tokenId or form" });
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
      }) ||
      {};

    const interfaceHost = portalConfig.apiHost;
    let submitPath = req.body?.path ||portalConfig.submitEndpoint;
    
    //Skip "API." request paths
    if (submitPath && /API\./i.test(submitPath)) {
      submitPath = portalConfig.submitEndpoint;
    }

    if (!interfaceHost || !submitPath) {
      return res
        .status(500)
        .send({ error: getErrorMessage("PORTAL_CONFIG_NOT_FOUND") || "Missing interface host/endpoints in appConfig" });
    }

    const submitUrl =  interfaceHost+submitPath;

    console.log("SUBMIT URL",submitUrl);

    const headers = {
      'Content-Type': 'application/json',
      ...buildPortalAuthHeader(portalConfig),
      ...(req.body?.headers || {}),
    };

    const savePayload = {
      token: tokenId
    };


    const submitResp = await fetch(submitUrl.toString(), {
      method: 'POST',
      headers,
      body: JSON.stringify(savePayload) 
    });

    console.log("SUBMIT RESPONSE",submitResp);

    if (!submitResp.ok) {
      const text = await submitResp.text();
      return res
        .status(502)
        .send({ error: `Submit failed: ${submitResp.status} ${text}` });
    }

    return res.json({ status: 'success' });
  } catch (err) {
    console.error('submitNETPortal error:', err);
    return res
      .status(500)
      .send({ error: getErrorMessage("ERROR_IN_EXECUTING_ACTION") || (err?.message || 'Unhandled error') });
  }
}

module.exports = submitForPortalAction;
