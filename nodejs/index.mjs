import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

const region = process.env.AWS_REGION

export const handler = async (event) => {
	const url = 'https://conflux-document-generator.s3.us-east-2.amazonaws.com/templates/invoice-1.html'

	try {
		const browser = await puppeteer.launch({
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath(),
			headless: chromium.headless,
			ignoreHTTPSErrors: true,
		});
		const page = await browser.newPage();
		await page.goto(url, { waitUntil: "networkidle0" });
		await page.emulateMediaType("screen");
		var PDFOptions = { printBackground: true, format: 'A4' }
		if (!region) {
			PDFOptions.path = '../result.pdf'
		}
		await page.evaluate(() => {
			const location = 'div.table-responsive table tbody tr'
			let dom = document.querySelectorAll(location)
			dom.forEach(e => e.remove())
		})
		const pdf = await page.pdf(PDFOptions);
		console.log(pdf)
		await page.close();
		await browser.close();
		return {
			statusCode: 200,
			headers: { 'Content-Type': 'application/pdf' },
			body: pdf.toString('base64'),
			isBase64Encoded: true,
			// https://medium.com/@keshavkumaresan/generating-pdf-documents-within-aws-lambda-with-nodejs-and-puppeteer-46ac7ca299bf
		}
	} catch (error) {
		return {
			statusCode: 500,
			body: error,
		}
	}
};

if(!region) {
	handler({})
};
