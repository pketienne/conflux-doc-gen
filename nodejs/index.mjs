// import puppeteer from 'puppeteer-core'
// import chromium from '@sparticuz/chromium'
// import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// const region = process.env.AWS_REGION

// export const handler = async (event) => {
// 	const url = 'https://conflux-document-generator.s3.us-east-2.amazonaws.com/templates/invoice-1.html'

// 	const client = new S3Client(config);
// 	const input = { // ListObjectsV2Request
// 		Bucket: "conflux-document-generator", // required
// 		EncodingType: "url",
// 	};
// 	const command = new ListObjectsV2Command(input);
// 	const response = await client.send(command);

// 	try {
// 		const browser = await puppeteer.launch({
// 			args: chromium.args,
// 			defaultViewport: chromium.defaultViewport,
// 			executablePath: await chromium.executablePath(),
// 			headless: chromium.headless,
// 			ignoreHTTPSErrors: true,
// 		});
// 		const page = await browser.newPage();
// 		await page.goto(url, { waitUntil: "networkidle0" });
// 		await page.emulateMediaType("screen");
// 		var PDFOptions = { printBackground: true, format: 'A4' }
// 		if (!region) {
// 			PDFOptions.path = '../result.pdf'
// 		}
// 		await page.evaluate(() => {
// 			const location = 'div.table-responsive table tbody tr'
// 			let dom = document.querySelectorAll(location)
// 			dom.forEach(e => e.remove())
// 		})
// 		const pdf = await page.pdf(PDFOptions);
// 		console.log(pdf)
// 		await page.close();
// 		await browser.close();
// 		return {
// 			statusCode: 200,
// 			headers: { 'Content-Type': 'application/pdf' },
// 			body: pdf.toString('base64'),
// 			isBase64Encoded: true,
// 			// https://www.google.com/search?q=lambda+nodejs+pdf+response+how+to&oq=lambda+nodejs+pdf+response+how+to&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIGCAEQLhhA0gEINjg4MmowajGoAgCwAgA&sourceid=chrome&ie=UTF-8
// 			// https://medium.com/@keshavkumaresan/generating-pdf-documents-within-aws-lambda-with-nodejs-and-puppeteer-46ac7ca299bf
// 			// https://oxylabs.io/blog/curl-send-headers
// 			// https://stackoverflow.com/questions/45348580/aws-lambda-fails-to-return-pdf-file
// 		}
// 	} catch (error) {
// 		return {
// 			statusCode: 500,
// 			body: error,
// 		}
// 	}
// };

// if(!region) {
// 	handler({})
// };


import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";


export const handler = async (event) => {
	const client = new S3Client({});
	const command = new ListObjectsV2Command({
		Bucket: "conflux-doc-gen",
		// The default and maximum number of keys returned is 1000. This limits it to
		// one for demonstration purposes.
		// MaxKeys: 1,
	});

	try {
		let isTruncated = true;
		console.log("Your bucket contains the following objects:\n");
		let contents = "";

		while (isTruncated) {
			const { Contents, IsTruncated, NextContinuationToken } =
			await client.send(command);
			const contentsList = Contents.map((c) => ` • ${c.Key}`).join("\n");
			contents += contentsList + "\n";
			isTruncated = IsTruncated;
			command.input.ContinuationToken = NextContinuationToken;
		}
		console.log(contents);
	} catch (err) {
		console.error(err);
	}
};
