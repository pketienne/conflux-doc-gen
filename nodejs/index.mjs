import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { promises as fs } from 'fs'

const region = process.env.AWS_REGION

export const handler = async (event) => {
	if (!region) { var event = await load_sample_json(event) }

	const bucket = 'conflux-doc-gen'
	const url_base = `https://${bucket}.s3.us-east-2.amazonaws.com`
	const template = `templates/${event.document}-${event.template}`
	var file_name = 'result'

	try {
		const browser = await puppeteer.launch({
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath(),
			headless: chromium.headless,
			ignoreHTTPSErrors: true,
		})

		const page = await browser.newPage();

		await page.goto( `${url_base}/${template}.html`, { waitUntil: 'networkidle0' });
		await page.emulateMediaType("screen");

		var PDFOptions = { printBackground: true, format: 'A4' }
		if (!region) { PDFOptions.path = `../${file_name}.pdf` }

		await page.evaluate(() => {
			const location = 'div.table-responsive table tbody tr'
			let dom = document.querySelectorAll(location)
			dom.forEach(e => e.remove())
		})

		const pdf = await page.pdf(PDFOptions);
		
		await page.close();
		await browser.close();

		if(region) {
			const client = new S3Client({});
			const date = `${new Date().toISOString()}`
			const hexidecimal = (Math.random() * 0xfffff * 10000000000000)
			const obfuscation = hexidecimal.toString(16).slice(0,16)
			const file_name = `${date}-${obfuscation}`
			const command = new PutObjectCommand({
				Bucket: "conflux-doc-gen",
				Key: `${file_name}.pdf`,
				Body: pdf,
			});

			try {
				const response = await client.send(command);
			} catch (err) {
				console.error(err);
			}
		}

		return {
			statusCode: 200,
			headers: { 'Content-Type': 'application/json' },
			body: { url: `${url_base}/${file_name}` },
		}

	} catch (error) {
		return {
			statusCode: 500,
			body: error,
		}
	}
}

async function load_sample_json(document_type) {
	let data = await fs.readFile(`../api/${document_type}.json`, { encoding: 'utf-8' })
	let json = JSON.parse(data)
	return json
}

if(!region) {
	handler('invoice')
}
