//Build Header Auth based on Portal config
function buildPortalAuthHeader(portal) {
  if (
    portal?.portalAuth === "basic" &&
    (
      (portal.basicAuth && portal.basicAuth.username && portal.basicAuth.password) ||
      portal.apiSecret
    )
  ) {
    const creds = (portal.basicAuth && portal.basicAuth.username && portal.basicAuth.password)
      ? `${portal.basicAuth.username}:${portal.basicAuth.password}`
      : portal.apiSecret; // allow "user:pass" as apiSecret
    const auth = "Basic " + Buffer.from(creds, "utf8").toString("base64");
    return { Authorization: auth };
  }
  return {};
}

module.exports = buildPortalAuthHeader;
