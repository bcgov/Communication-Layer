// portal/expirePortalToken.js
const appConfig = require('../appConfig.js');
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
const { expireTokenInPortal } = require('./loadPortalDataHandler.js');

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

    const apiHost = portalConfig.apiHost;
    let expirePath = req.body?.path || (portalConfig.expireTokenEndPoint || process.env.PORTAL_EXPIRE_TOKEN_ENDPOINT);

    if (!apiHost || !expirePath) {
      return res
        .status(500)
        .send({ error: getErrorMessage("PORTAL_CONFIG_NOT_FOUND") || "Missing apiHost or expire endpoint in appConfig" });
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(req.body?.headers || {})
    };

    const expired = await expireTokenInPortal(portalConfig, tokenId, headers);

    if (!expired) {
      return res.status(502).send({ error: "Portal did not confirm token expiration" });
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
