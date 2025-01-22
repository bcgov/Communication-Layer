const axios = require("axios");
const puppeteer = require('puppeteer');
const fs = require('fs');
async function generatePDFFromHTML(req, res) {
    console.log(generatePDFFromHTML);
    const { htmlContent } = req.body;

    if (!htmlContent) {
      return res.status(400).send('HTML content is required');
    }
  
    try {
        console.log("htmlContent",htmlContent);
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
  
      // Set the HTML content of the page
      await page.setContent(htmlContent, { waitUntil: 'load' });
      
      //await page.setContent('<p>Hello, world!</p>');
  
      // Optional: Set print-specific styles
      await page.emulateMediaType('print');
      // Debug: Save screenshot of the page
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  
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
      //await fs.promises.writeFile('test.pdf', pdfBuffer);
      console.log('PDF saved as test.pdf');
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Failed to generate PDF');
    }
  
}

async function generatePDFFromURL(req, res) {
    console.log(generatePDFFromHTML);
   const {path} = req.body;
  
    try {
       // console.log("htmlContent",htmlContent);
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
  
      // Set the HTML content of the page
      await page.goto(path, { waitUntil: 'networkidle0' });

  // Optional: Adjust the page's viewport for better PDF layout
    await page.setViewport({ width: 1280, height: 800 });      
     
  
      // Optional: Set print-specific styles
      //await page.emulateMediaType('print');
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
      //await fs.promises.writeFile('FromUrlTest.pdf', pdfBuffer);
      console.log('PDF saved as test.pdf');
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Failed to generate PDF');
    }
  
}

module.exports ={ generatePDFFromHTML ,generatePDFFromURL};