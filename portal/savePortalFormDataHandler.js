const appConfig = require('../appConfig.js');
async function submitForPortalAction (req,res) {
    const { tokenId, savedForm ,config} = req.body;   
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
        if (action.actionType === 'endpoint') {          
          await handleEndpointAction(tokenId,action, savedForm,portalConfig);
        } else {
          console.warn('Unexpected action type:', action.type);
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

      const savedJson = {
              "token": tokenId,        
              "formJson": formData
            };
      const actionBody = Object.fromEntries(
        (action.body || []).map(b => Object.entries(b)[0])
      );
      const payload = { ...savedJson, ...actionBody };      
      const response = await fetch(url, {
        method: action.type,
        headers: { ...headers, Authorization: `Bearer ${action.authentication}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
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