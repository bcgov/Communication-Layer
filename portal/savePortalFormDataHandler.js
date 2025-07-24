async function submitForPortalAction (req,res) {
    console.log("in here submitForPortalAction"); 

    const { tokenId, savedForm ,config} = req.body;
    console.log("tokenId",tokenId);    
    console.log("savedForm",savedForm); 
    console.log("config",config); 
try{
  if (!config?.actions || !Array.isArray(config.actions)) {
    return res
          .status(400)
          .send({ error: getErrorMessage("FORM_ID_REQUIRED") });
  }
  for (const action of config.actions) {
    if (action.actionType === 'endpoint') {
      await handleEndpointAction(tokenId,action, savedForm);
    } else if (action.actionType === 'email') {
      await handleEmailAction(action, formData);
    } else {
      console.warn('Unexpected action type:', action.type);
      return res
          .status(400)
          .send({ error: "Unexpected action type" });
    }
  }

  res.json({ status: 'success' });
} catch(error) {
  return res
          .status(400)
          .send({ error: "Error in executing action type" });
}
}
async function handleEndpointAction(tokenId,action, formData) {
    console.log("action",action);
  try {  
  const url = `${action.host}${action.path}`;
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
    console.log("Error",text)
    throw new Error(`Endpoint error: ${response.status} ${text}`);
  }
} catch(error) {
  console.error('Error in handleEndPoint:', error);
  throw error;
}
}
module.exports = submitForPortalAction;