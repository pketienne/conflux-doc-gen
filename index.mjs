// import puppeteer from 'puppeteer';
// // import puppeteer from 'puppeteer-core'
// // import chromium from '@sparticuz/chromium'


// export const handler = async (event) => {
// 	const browser = await puppeteer.launch({ headless: 'new' });
// 	const page = await browser.newPage();
// 	const website_url = 'https://storage.googleapis.com/theme-vessel-items/checking-sites-2/disee-html/HTML/main/invoice-1.html'
// 	await page.goto(website_url, { waitUntil: "networkidle0" });
// 	await page.emulateMediaType("screen");
// 	const pdf = await page.pdf({
// 		path: "result.pdf",
// 		printBackground: true,
// 		format: "A4",
// 	});
// 	await browser.close();

// 	const response = {
// 		statusCode: 200,
// 		body: pdf,
// 		// body: JSON.stringify('Hello from Lambda!'),
// 	};
// 	return pdf;
// };

// // handler({})

import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";


export const handler = async (event) => {
	try {
		const url = 'https://storage.googleapis.com/theme-vessel-items/checking-sites-2/disee-html/HTML/main/invoice-1.html'

		// const client = new S3Client(config);
		// const input = { // ListObjectsV2Request
		// 	Bucket: "conflux-document-generator", // required
		// 	EncodingType: "url",
		// };
		// const command = new ListObjectsV2Command(input);
		// const response = await client.send(command);

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
		const pdf = await page.pdf({
			path: '/tmp/result.pdf',
			printBackground: true,
			format: "A4",
		});
		
		await page.close();
		await browser.close();

		const response = {
				statusCode: 200,
				body: pdf,
		};

		return response;
	} catch (error) {
		throw new Error(error.message)
	}
};
