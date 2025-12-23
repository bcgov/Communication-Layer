const axios = require("axios");
const puppeteer = require('puppeteer');
const fs = require('fs');
const { validateJson } = require('./validate');
const {storeData,retrieveData,deleteData} = require('./helper/redisHelperHandler');
const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const appCfg = require('./appConfig.js');

async function generatePDFFromJSON(req, res) {
  try {
    const rawHost = (req.get("X-Original-Server") || req.hostname);
    const configOpt = appCfg[rawHost];
    let attachment = req.body.attachment ?? req.body[0];    

    // Validate attachment is present in incoming message
    if (!attachment) {
      return res.status(400).json({
        errorCode: 1,
        errorMessage: "Invalid JSON . No attachment found.",
        pdf: null
      });
    }

    const savedJsonString = Buffer.from(attachment, 'base64').toString('utf-8');
    let savedJson;
    
    try {
      
      savedJson = JSON.parse(savedJsonString);      
      const { valid, errors } = validateJson(savedJson);

      if (valid) {
        console.log('JSON is valid ✅');
      } else {
        console.error('Validation errors ❌:', errors);
        return res.status(400).json({
          errorCode: 3,
          errorMessage: "JSON does not match the schema expected.",
          pdf: null
        });
      }
    }
    catch (error) {
      console.error("Error converting incoming json:", error);

      return res.status(400).json({
        errorCode: 2,
        errorMessage: "Invalid JSON after base 64 conversion. Must be a valid JSON object.",
        pdf: null
      });
    }

    if (!savedJson || typeof savedJson !== "object") {
      return res.status(400).json({
        errorCode: 2,
        errorMessage: "Invalid JSON after base 64 conversion. Must be a valid JSON object.",
        pdf: null
      });
    }

    // Generate PDF buffer
    const pdfBuffer = await generatePDF(savedJsonString,configOpt); //get the pdf from the savedJson
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');    
    
    res.status(200).json({
      errorCode: 0,
      errorMessage: "Success",
      pdf: pdfBase64
    });
  } catch (error) {
    console.error("Error generating PDF:", error);

    res.status(500).json({
      errorCode: 3,
      errorMessage: "Internal Server Error: Failed to generate PDF",
      pdf: null
    });
  }
}

async function generatePDF(savedJson, params) {

  const id = await storeData(savedJson);
  const rawGenerateEndpoint = params?.generateEndpoint;
  const generateEndpoint = rawGenerateEndpoint?.trim() || process.env.GENERATE_KILN_URL;
  console.log("Generate APP config:",generateEndpoint);
  const endPointForPDF = generateEndpoint + "?jsonId=" + id; 
  const pdfBufferFromURL = await getPDFFromURL(endPointForPDF);  
  await deleteData(id);
  return pdfBufferFromURL;

}

async function generatePDFFromHTML(req, res) {
  const { htmlContent } = req.body;
  if (!htmlContent) {
    return res.status(400).send('HTML content is required');
  }

  try {

    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--headless",
      ],
    });
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log('Browser logs:', msg.type(), msg.text());
    });
    
    page.on('request', req => {
      console.log('Request:', req.url(), req.failure());
    });

    // Set the HTML content of the page
    await page.setContent(htmlContent, { waitUntil: 'load' });

    // Optional: Set print-specific styles
    await page.emulateMediaType('print');
    // Debug: Save screenshot of the page
    //await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });

    // Generate PDF with print CSS applied
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      tagged: true,
      preferCSSPageSize: true
    });

    await browser.close();

    // Send PDF back to client
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="output.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Failed to generate PDF');
  }

}

async function generatePDFFromURL(req, res) {
  const { path } = req.body;
  try {    
    const pdfBuffer = await getPDFFromURL(path);

    // Send PDF back to client
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="output.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Failed to generate PDF');
  }

}

async function getPDFFromURL(url) {
  // Increases to 5000 seemed to be working well (could also set the params in env file if needed)
  /* const HYDRATE_MS = Number(process.env.PDF_HYDRATE_MS ?? 5000);      
  const CLICK_WINDOW_MS = Number(process.env.PDF_CLICK_WINDOW_MS ?? 3000);
  const CLICK_RETRY_EVERY_MS = Number(process.env.PDF_CLICK_INTERVAL_MS ?? 200);
  const POST_CLICK_MS = Number(process.env.PDF_POST_CLICK_MS ?? 2500); */
  
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--headless",
    ],
  });
  try {

    //const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
      console.log('Browser logs:', msg.type(), msg.text());
    });
    
    page.on('request', req => {
      console.log('Request:', req.url(), req.failure());
    });

    // Optional: Adjust the page's viewport for better PDF layout
    await page.setViewport({ width: 1280, height: 800 });

    // Set the HTML content of the page
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 150000 });

    //The below code block clicks the show letter button on the UI. This functionality is not needed any more
    // as the PRINT directly should show the letter setting/resetting visible_pdf and visbile_web flags
    // in the form definition. This below code takes a lot of await times and is making the process delayed as a whole
    // Until confirmed the commenting out doesnt pose any issues, leave this here just in case to put it back.
    /* // Let app hydrate
    await sleep(HYDRATE_MS);
    
    // Click “Show Letter” with a short retry window
    const clickScript = `
      (function(){
        function clickByText(substr){
          substr = substr.toLowerCase();
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
          while (walker.nextNode()){
            const el   = walker.currentNode;
            const tag  = (el.tagName||'').toLowerCase();
            const role = el.getAttribute && el.getAttribute('role');
            const clickable = tag==='button' || tag==='a' || role==='button';
            if (!clickable) continue;
            const t = (el.innerText || el.textContent || '').trim().toLowerCase();
            if (t.includes(substr)){
              el.dispatchEvent(new MouseEvent('click', {bubbles:true,cancelable:true,view:window}));
              return true;
            }
          }
          return false;
        }
        if (!window.__clickedShowLetter) window.__clickedShowLetter = clickByText('show letter');
        return !!window.__clickedShowLetter;
      })();
    `;

    const deadline = Date.now() + CLICK_WINDOW_MS;
    let clicked = await page.evaluate(clickScript);
    if (!clicked) {
      for (const f of page.frames()) {
        try { clicked = await f.evaluate(clickScript); if (clicked) break; } catch {}
      }
    }
    while (!clicked && Date.now() < deadline) {
      await sleep(CLICK_RETRY_EVERY_MS);
      clicked = await page.evaluate(clickScript);
      if (!clicked) {
        for (const f of page.frames()) {
          try { clicked = await f.evaluate(clickScript); if (clicked) break; } catch {}
        }
      }
    }  */
    //here

    // Give it time to assemble the printable view
    //await sleep(POST_CLICK_MS);
    
    
    console.log("Waiting for print button...");

    let clickedPrint = false;
    const PRINT_DEADLINE = Date.now() + 20000; // up to 20 sec
    while (!clickedPrint && Date.now() < PRINT_DEADLINE) {
      // Try main document
      try {
        await page.waitForSelector("#print", { visible: true, timeout: 1000 });
        // Wait until enabled
        await page.waitForFunction(
          sel => {
            const el = document.querySelector(sel);
            if (!el) return false;
            if (el.disabled) return false;
            if (el.getAttribute("aria-disabled") === "true") return false;
            if (el.classList.contains("disabled")) return false;
            return true;
          },
          { timeout: 5000 },
          "#print"
        );
        await page.click("#print");
        clickedPrint = true;
        console.log("Clicked print button on main page");
        break;
      } catch {}

      // Try every frame
      for (const frame of page.frames()) {
        try {
          await frame.waitForSelector("#print", { visible: true, timeout: 1000 });
          await frame.waitForFunction(
            sel => {
              const el = document.querySelector(sel);
              if (!el) return false;
              if (el.disabled) return false;
              if (el.getAttribute("aria-disabled") === "true") return false;
              if (el.classList.contains("disabled")) return false;
              return true;
            },
            { timeout: 5000 },
            "#print"
          );
          await frame.click("#print");
          clickedPrint = true;
          console.log("Clicked print button inside iframe");
          break;
        } catch {}
      }

      await sleep(250); // avoid hot-looping
    }
    
    if (clickedPrint) {

      console.log("Waiting for printable layout to finish…");

      // Wait for data-form-id attribute
      try {
        await page.waitForFunction(
          () => document.documentElement.getAttribute("data-form-id"),
          { timeout: 20000 }
        );
        console.log("Printable layout ready (data-form-id detected)");
      } catch {
        console.log("Timeout waiting for data-form-id");
      }

       // Svelte stabilization
      console.log("Waiting for Svelte DOM stability…");
      await page.waitForFunction(() => {
        const now = performance.now();
        if (!window.__lastMutationTime) window.__lastMutationTime = now;

        if (!window.__mutationObserverInstalled) {
          const observer = new MutationObserver(() => {
            window.__lastMutationTime = performance.now();
          });
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
          });
          window.__mutationObserverInstalled = true;
        }

      return performance.now() - window.__lastMutationTime > 600;
     }, { timeout: 20000 });
     console.log("Svelte DOM stabilized");
    } else {
      console.log("Could not click on print button");
    }

    await page.evaluate((t) => {
    document.title = t;
    const titleTag = document.querySelector("title") || 
                     document.head.appendChild(document.createElement("title"));
    titleTag.textContent = t;
  }, "Untitled"); 
    
    // Generate PDF with print CSS applied
    await page.emulateMediaType('print');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      tagged: true,
      preferCSSPageSize: true
    });
    // Convert PDF buffer to Base64 string


    await browser.close();
    console.log("Returning PDF");
    return pdfBuffer;

  } catch (error) {
    console.error('Error generating PDF opening the url:', error);
    await browser.close();
    return null;
  }

}

async function loadSavedJson(req, res) {

  try {
    const params = req.body;
    const jsonId = params["jsonId"];

    if (!jsonId) {
      return res
        .status(400)
        .send({ error: "Json Id is  required" });
    }
    const savedJson = await retrieveData(jsonId);

    //const data = jsonStore.get(jsonId);

    if (!savedJson) {
      console.log("Error fetching Saved Json from temp storage for  ", jsonId);
      return res.status(500).send('Failed to fetch savedJson');
    }
    return res.status(200).send(JSON.parse(savedJson));
  }
  catch (error) {
    console.error(`Error loading savedJson:`, error);
    return res.status(500).send('Failed to fetch savedJson');
  }
}





module.exports = { generatePDFFromHTML, generatePDFFromURL, generatePDFFromJSON, loadSavedJson ,generatePDF };