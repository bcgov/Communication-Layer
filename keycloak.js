const Keycloak = require("keycloak-connect");
const session = require("express-session");

const memoryStore = new session.MemoryStore();

const keycloakForSiebel = new Keycloak(
  {},
  {
    store: memoryStore,
    clientId: process.env.KC_CLIENTID,
    realm: process.env.KC_REALM,
    secret: process.env.KC_CLIENTSECRET,
    serverUrl: process.env.KC_SERVERURL,
    grantType: "client_credentials",
    bearerOnly: true,
    enabled: "yes",
  }
);

const keycloakForFormRepo = new Keycloak(
  {},
  {
    store: memoryStore,
    clientId: process.env.KC_FR_CLIENTID,
    realm: process.env.KC_FR_REALM,
    secret: process.env.KC_FR_CLIENTSECRET,
    serverUrl: process.env.KC_FR_SERVERURL,
    grantType: "client_credentials",
    bearerOnly: true,
    enabled: "yes",
  }
);


module.exports = {keycloakForSiebel,keycloakForFormRepo};
