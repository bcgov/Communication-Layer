const appConfig = require('../appConfig.js');
const { getErrorMessage } = require("../errorHandling/errorHandler.js");
async function submitForPortalAction (req,res) {
    const { tokenId, savedForm ,config} = req.body;   
    console.log('submitForPortalAction:', {
      tokenId: req.body?.tokenId,
      savedFormType: typeof req.body?.savedForm,
      actionCount: req.body?.config?.actions?.length
    });
    try{
      
      if (!config?.actions || !Array.isArray(config.actions)) {
        return res
              .status(400)
              .send({ error: getErrorMessage("NO_ACTION_FOUND")});
      }
      const rawHost = (req.get("X-Original-Server") || req.hostname);      
      const portalConfig = appConfig[rawHost] || Object.values(appConfig).find(cfg => {
          try {
            return new URL(cfg.apiHost).hostname === rawHost;
          } catch {
            return false;
          }
        }) || {};
      
      for (const action of config.actions) {        
        if (action.action_type === 'endpoint') {          
          await handleEndpointAction(tokenId,action, savedForm,portalConfig);
        } else {
          console.warn('Unexpected action type:', action.action_type);
          return res
              .status(400)
              .send({ error: getErrorMessage("UNKNOWN_ACTION") });
        }
      }

      res.json({ status: 'success' });
    } catch(error) {
      return res
              .status(400)
              .send({ error: getErrorMessage("ERROR_IN_EXECUTING_ACTION") });
    }
}
async function handleEndpointAction(tokenId,action, formData, portalConfig) {
    
      try {  
      const portalHost = portalConfig["apiHost"] || action.host;
      const url = portalHost+action.path;
      const headers = Object.fromEntries(action.headers.map(h => Object.entries(h)[0])); 

      const  base64EncodedJson = Buffer.from(formData, 'utf8').toString('base64');
      const savedJson = {
              "token": tokenId,        
              "formJson": base64EncodedJson,              
            };
      const actionBody = Object.fromEntries(
        (action.body || []).map(b => Object.entries(b)[0])
      );
      const payload = { ...savedJson, ...actionBody };      
      console.log('handleEndpointAction ->', {
        url,
        method: action.type,
        headers,
        payloadKeys: Object.keys(payload)
      });
      const response = await fetch(url, {
        method: action.type,
        headers: { ...headers, Authorization: `Bearer ${action.authentication}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('Fetch status:', response.status);

      if (!response.ok) {
        const text = await response.text();        
        throw new Error(`Endpoint error: ${response.status} ${text}`);
      }
    } catch(error) {
      console.error('Error in handleEndPoint:', error);
      throw error;
    }
}
module.exports = submitForPortalAction;