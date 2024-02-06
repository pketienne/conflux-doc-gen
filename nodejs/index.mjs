import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import fs from 'fs'

const region = process.env.AWS_REGION

export const handler = async (event) => {
	const bucket = 'conflux-doc-gen'
	const url_base = `https://${bucket}.s3.us-east-2.amazonaws.com`
	const template = `templates/${event.document}-${event.template}`
	const date = `${new Date().toISOString()}`
	const hexidecimal = (Math.random() * 0xfffff * 10000000000000)
	const obfuscation = hexidecimal.toString(16).slice(0,16)
	const file_name = `${date}-${obfuscation}`

	try {
		const browser = await puppeteer.launch({
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath(),
			headless: chromium.headless,
			ignoreHTTPSErrors: true,
		})
		const page = await browser.newPage()
		await page.goto(`${url_base}/${template}.html`, {waitUntil: 'networkidle0'})
		await page.emulateMediaType('screen')
		var PDFOptions = {printBackground: true, format: 'A4'}
		if (!region) {PDFOptions.path = 'result.pdf'}

		page.on('console', async (msg) => {
			const msgArgs = msg.args();
			for (let i = 0; i < msgArgs.length; ++i) {
				console.log(await msgArgs[i].jsonValue());
			}
		})

		await page.evaluate((event) => {
			let instructions = [
				{selector: 'span#pke-invoice-number', innerHTML: event.invoice.number},
				{
					selector: 'span#pke-invoice-date',
					innerHTML: event.invoice.date.slice(0,10)
				},
			]

			try {
				instructions.forEach((i) => {
					document.querySelector(i.selector).innerHTML = i.innerHTML
				})
			} catch (err) {
				console.error(`An error was thrown: ${err}.`)
			}
		}, event)

		const pdf = await page.pdf(PDFOptions)
		await page.close()
		await browser.close()

		if (region) {
			const client = new S3Client({})
			const command = new PutObjectCommand({
				Bucket: 'conflux-doc-gen',
				Key: `${file_name}.pdf`,
				Body: pdf,
			})
			
			try {
				const repsonse = await client.send(command)
			} catch (err) {
				console.error(err)
			}
		}
	} catch (error) {
		return {
			statusCode: 500,
			body: error,
		}
	}
}

if (!region) {
	const document_type = 'invoice'
	const path = `api/${document_type}.json`

	fs.readFile(path, 'utf8', (err, file) => {
		if (err) {
			console.error('Error while reading the file:', err)
			return
		}
		try {
			let event = JSON.parse(file)
			handler(event)
		} catch (err) {
			console.error('Error while parsing JSON data:', err)
		}
	})
}
