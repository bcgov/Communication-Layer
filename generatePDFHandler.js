const axios = require("axios");
const puppeteer = require('puppeteer');
const fs = require('fs');
const { randomUUID } = require('crypto');
const client = require("./redisClient");
const { validateJson } = require('./validate');

async function generatePDFFromJSON(req, res) {
  try {
    const  {attachment}  = req.body;   

     // Validate attachment is present in incoming message
    if (!attachment ) {
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
    const pdfBuffer = await generatePDF(savedJsonString); //get the pdf from the savedJson
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

async function generatePDF (savedJson) {  

  const id = await storeData(savedJson);
  const endPointForPDF = process.env.PRINT_TO_PDF_KILN_URL+"?jsonId="+id;
  const pdfBufferFromURL= await getPDFFromURL(endPointForPDF);  
  deleteData(id);
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
  
      // Set the HTML content of the page
      await page.setContent(htmlContent, { waitUntil: 'load' });  
  
      // Optional: Set print-specific styles
      await page.emulateMediaType('print');
      // Debug: Save screenshot of the page
      //await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  
      // Generate PDF with print CSS applied
      const pdfBuffer = await page.pdf({ format: 'A4', 
        printBackground: true ,
        tagged:true,
        preferCSSPageSize:true
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
   const {path} = req.body;  
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

     // Set the HTML content of the page
     await page.goto(url, { waitUntil: 'networkidle2' ,timeout: 150000});
    
   // Optional: Adjust the page's viewport for better PDF layout
     await page.setViewport({ width: 1280, height: 800 });    
    
     // Generate PDF with print CSS applied
     const pdfBuffer = await page.pdf({ format: 'A4', 
       printBackground: true ,
       tagged:true,
       preferCSSPageSize:true
    });
     // Convert PDF buffer to Base64 string
  
   
    await browser.close();
    return pdfBuffer;
    
   } catch (error) {
     console.error('Error generating PDF opening the url:', error);
     await browser.close();
     return null;
   }
 
}

async function loadSavedJson (req,res) {

  try{
    const params = req.body;
    const jsonId = params["jsonId"];
  
    if (!jsonId) {
        return res
            .status(400)
            .send({ error: "Json Id is  required" });
    }   
    const savedJson = await retrieveData(jsonId);

    //const data = jsonStore.get(jsonId);
    
    if (!savedJson ) {
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

async function storeData(data) {
  const id = randomUUID();//Math.random().toString(36).substr(2, 9);  
  await client.setEx(id, 120, data); // Expires in 120 seconds  
  return id;
}

// Retrieve JSON
async function retrieveData(id) {
  const data = await client.get(id);    
  return data ? data : null;
}

async function deleteData(id) {
  const result = await client.del(id);
  if (result) {
    console.log(`Deleted key: ${id}`);
  } else {
    console.log(`Key ${id} not found.`);
  }
}



module.exports ={ generatePDFFromHTML ,generatePDFFromURL,generatePDFFromJSON, loadSavedJson};