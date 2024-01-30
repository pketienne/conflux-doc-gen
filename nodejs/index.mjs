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
			PDFOptions.path = 'result.pdf'
		}
		await page.evaluate(() => {
			const location = 'div.table-responsive table tbody tr'
			let dom = document.querySelectorAll(location)
			dom.forEach(e => e.remove())
		})
		const pdf = await page.pdf(PDFOptions);
		await page.close();
		await browser.close();
		const response = { statusCode: 200, body: pdf };
		// return response;
		return event;
	} catch (error) {
		throw new Error(error.message)
	}
};

if(!region) {
	handler({})
}
