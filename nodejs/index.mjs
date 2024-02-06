import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import fs from 'fs'

const region = process.env.AWS_REGION

export const handler = async (event) => {
	const bucket = 'conflux-doc-gen'
	const url_base = `https://${bucket}.s3.us-east-2.amazonaws.com`
	const template = `../templates/${event.document}-${event.template}`
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
		// await page.goto(`${url_base}/${template}.html`, {waitUntil: 'domcontentloaded'})
		await page.emulateMediaType('screen')
		var PDFOptions = {printBackground: true, format: 'A4'}
		if (!region) {PDFOptions.path = 'result.pdf'}

		page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

		await page.evaluate((event) => {
			let instructions = [
				{selector: 'span#mdb-invoice-number', innerHTML: event.invoice.number},
				{selector: 'span#mdb-invoice-date',	innerHTML: event.invoice.date.slice(0,10)},
				{selector: 'h2#mdb-client-person', innerHTML: event.client.person},
				{selector: 'span#mdb-client-company', innerHTML: event.client.company},
				{selector: 'span#mdb-client-email', innerHTML: event.client.email},
				{selector: 'span#mdb-client-address', innerHTML: event.client.address},
				{selector: 'h2#mdb-contractor-person', innerHTML: event.contractor.person},
				{selector: 'span#mdb-contractor-company', innerHTML: event.contractor.company},
				{selector: 'span#mdb-contractor-email', innerHTML: event.contractor.email},
				{selector: 'span#mdb-contractor-address', innerHTML: event.contractor.address},
				{selector: 'p#mdb-notes', innerHTML: event.invoice.notes},
				{selector: 'span#mdb-phone', innerHTML: event.contractor.phone},
				{selector: 'span#mdb-email', innerHTML: event.contractor.email},
				{selector: 'span#mdb-address', innerHTML: event.contractor.address},
			]

			instructions.forEach((i) => {
				try {
					document.querySelector(i.selector).innerHTML = i.innerHTML
				} catch (err) {
					console.error(`An error occurred while attempting to change the contents of element at location: "${i.selector}" with the content: \n\n ${i.innerHTML} \n${err}.`)
				}
			})

			try {
				document.querySelector('div.table-responsive').remove()
			} catch (err) {
				console.error(`An error occurred while attempting to remove elements from the document: ${err}`)
			}

			try {
				// let sections = {
				// 	materials: event.materials,
				// 	labor: event.labor,
				// }

				var sections = getElementById('div#mdb-sections')
				var foo = document.createElement('h2')
				foo.innerHTML = 'blatherskite'

				sections.appendChild(foo)

				// for (const s in sections) {
				// 	let section = document.createElement('div')
				// 	section.setAttribute('id', `mdb-${s}`)
				// 	section.setAttribute('class', 'table-responsive')
					
				// 	let table = document.createElement('table')
				// 	table.setAttribute('class', 'table mb-0 talbe-striped invoice-table')

				// 	let thead = document.createElement('thead')
				// 	thead.setAttribute('class', 'bg-active')

				// 	let tr = document.createElement('tr')
				// 	tr.setAttribute('class', 'tr')

				// 	let td = document.createElement('td')
				// 	td.innerHTML = 'foo'

				// 	tr.append(td)
				// 	thead.append(tr)
				// 	table.append(thead)
				// 	section.append(table)
				// 	document.getElementById('#mdb-sections').appendChild(section)
				// }

			} catch (err) {
				console.err(`An error occurred while attempting to add elements into the document: ${err}`)
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
	const path = `../api/${document_type}.json`

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
