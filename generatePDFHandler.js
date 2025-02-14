const axios = require("axios");
const puppeteer = require('puppeteer');
const fs = require('fs');

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
    const pdfBuffer = await generatePDF(savedJson);
    const pdfBase64 = pdfBuffer.toString("base64");

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
//TODO-for now get the PDF from local path
  const pdfBuffer = fs.readFileSync("HR0095F.pdf");
  return pdfBuffer;

}

async function generatePDFFromHTML(req, res) {    
    const { htmlContent } = req.body;
    if (!htmlContent) {
      return res.status(400).send('HTML content is required');
    }
  
    try {
      
      const browser = await puppeteer.launch();
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
      console.log("pdfBuffer.length",pdfBuffer.length);
      
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Failed to generate PDF');
    }
  
}

async function generatePDFFromURL(req, res) {   
   const {path} = req.body;  
    try {
      
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
        

      // Set the HTML content of the page
      await page.goto(path, { waitUntil: 'networkidle2' ,timeout: 150000});      
     

    // Optional: Adjust the page's viewport for better PDF layout
      await page.setViewport({ width: 1280, height: 800 });      
  
     
  
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
      console.log("pdfBuffer.length",pdfBuffer.length);      
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Failed to generate PDF');
    }
  
}

module.exports ={ generatePDFFromHTML ,generatePDFFromURL,generatePDFFromJSON};