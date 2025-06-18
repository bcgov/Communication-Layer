// src/formRepoHandler.js
const express = require("express");
const router  = express.Router();
const axios   = require("axios");
const { keycloakForFormRepo } = require("./keycloak.js");

const FORMREPO_BASE = process.env.FORMREPO_URL; 

router.post("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const grant = await keycloakForFormRepo.grantManager.obtainFromClientCredentials();

    // call template-repo’s pdfRender/:id
    const url = `${FORMREPO_BASE}/pdfRender/${id}`;
    console.info("Proxy PDF Render to:", url);

    const pdfRes = await axios.post(url,
      // forward the incoming JSON (data elements from KILN)
      req.body,
      {
        responseType: "stream",
        headers: {
          Authorization: `Bearer ${grant.access_token.token}`,
          "Content-Type": "application/json"
        },
      }
    );

    res.status(pdfRes.status);
    res.set({
      "Content-Type":        pdfRes.headers["content-type"],
      "Content-Disposition": pdfRes.headers["content-disposition"],
    });

    // pipe the PDF stream back to the browser
    pdfRes.data.pipe(res);
  } catch (err) {
    console.error("Error proxying PDF render:", err.message);
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;
      const message = typeof data === "string"
        ? data
        : err.response.statusText || err.message;
      return res.status(status).send(message);
    }
    next(err);
  }
});

module.exports = router;