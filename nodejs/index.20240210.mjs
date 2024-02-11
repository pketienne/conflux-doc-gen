import { promises as fsp } from 'fs'
import { JSDOM } from 'jsdom'
import prettier from 'prettier'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import crypto from 'crypto'

const REMOTE = process.env.AWS_REGION
const BUCKET_NAME = 'conflux-doc-gen'
const AWS_DOMAIN = 's3.us-east-2.amazonaws.com'
const S3_URL = `https://${BUCKET_NAME}.${AWS_DOMAIN}`
const ROOT = 'documents'

/**
 * This script centers around four main dimensions:
 * 
 * - proximity: local || remote
 * - stage: template || dom || html || pdf
 * - operation: create, read, update, delete, list
 * - filesystem:
 * 		- local (conflux-doc-gen/nodejs)
 * 		- remote (AWS S3)
 * 
 * steps of the procedure:
 * 	1. read template (local or remote)
 * 	2. create dom
 * 	3. delete dom_elements
 * 	4. update dom_elements
 * 	5. create html (local or remote)
 * 	6. read html (local or remote)
 * 	7. create pdf (local or remote)
 * 
 */

class Document {
	constructor(event) {
		this.event = event
		this.id = crypto.randomUUID()
		this.template = null
		this.dom = null
		this.html = null
		this.pdf = null
		this.res = null
	}

	uri(model) {
		let type = this.event.document_type
		let num = this.event.template_number
		let path = `${ROOT}/${model}/${type}-${num}`
		if (REMOTE) path += `.${this.id}`
		if (model == 'template') {
			path += '.html'
		} else {
			path += `.${model}`
		}
		return path
	}

	create_element(element, value, location, attributes = {}) {
		let doc = this.dom.window.document
		let e = doc.createElement(element)
		if (value) e.innerHTML = value
		for (const a in attributes) e.setAttribute(a, attributes[a])	
		doc.querySelector(location).append(e)
	}

	generate_classes(innerHTML) {
		let classes;
		switch (innerHTML) {
			case 'description':
				classes = ''
				break
			case 'cost' || 'total':
				classes = 'text-end'
				break
			case 'price' || 'quantity':
				classes = 'text-center'
				break
		}
		return classes
	}

	async read_template() {
		let uri = this.uri('template')
		if(REMOTE) {
			url = `${Document.S3_URL}/${uri}`
			this.template = await fetch(uri).then(res => res.text())
		} else {
			this.template = await fsp.readFile(uri, 'utf-8')
		}
	}

	create_dom() {
		this.dom = new JSDOM(this.template)
	}
	
	delete_dom_elements() {
		let loc = 'div#mdb-sections div.table-responsive'
		this.dom.window.document.querySelector(loc).remove()
	}

	update_dom_elements() {
		let doc = this.dom.window.document
		let instructions = [
			{location: 'span#mdb-invoice-number', value: this.event.invoice_info.number},
			{location: 'span#mdb-invoice-date',	value: this.event.invoice_info.date.slice(0,10)},
			{location: 'h2#mdb-client-person', value: this.event.client_info.person},
			{location: 'span#mdb-client-company', value: this.event.client_info.company},
			{location: 'span#mdb-client-email', value: this.event.client_info.email},
			{location: 'span#mdb-client-address', value: this.event.client_info.address},
			{location: 'h2#mdb-contractor-person', value: this.event.contractor_info.person},
			{location: 'span#mdb-contractor-company', value: this.event.contractor_info.company},
			{location: 'span#mdb-contractor-email', value: this.event.contractor_info.email},
			{location: 'span#mdb-contractor-address', value: this.event.contractor_info.address},
			{location: 'h3#mdb-notes-title', value: 'Notes:'},
			{location: 'p#mdb-notes-content', value: this.event.invoice_info.notes},
			{location: 'span#mdb-phone', value: this.event.contractor_info.phone},
			{location: 'span#mdb-email', value: this.event.contractor_info.email},
			{location: 'span#mdb-address', value: this.event.contractor_info.address},
		]
		instructions.forEach((i) => {
			doc.querySelector(i.location).innerHTML = i.value	
		})
	}

	create_dom_elements() {
		let tables = this.event.tables
		this.create_element('div', null, '#mdb-sections', {
			class: 'table-responsive'
		})
		for (const t in tables) {
			this.create_element('table', null, '#mdb-sections div', {
				id: `mdb-${t}`, class: 'table mb-0 table-striped invoice-table'
			})
			this.create_element('thead', null, '#mdb-sections div table:last-child', {'class': 'bg-active'})
			for (const th in tables[t][0]) {
				let classes = this.generate_classes(th)
				this.create_element('th', th, '#mdb-sections div table:last-child thead', {
					class: classes
				})
			}
			tables[t].forEach((item) => {
				this.create_element('tr', null, `#mdb-${t}`, { class: 'tr' })
				for (const i in item) {
					let classes = this.generate_classes(i)
					this.create_element('td', item[i], `#mdb-${t} tr:last-child`, {'class': classes})
				}
			})
			this.create_element('br', null, '#mdb-sections div:last-child')
		}
	}

	async create_html() {
		const uri = this.uri('html')
		const xml = this.dom.window.document.documentElement.outerHTML
		const html = await prettier.format(xml, { parser: 'html' })
		if (REMOTE) {
			const client = new S3Client({})
			const command = new PutObjectCommand({
				Bucket: 'conflux-doc-gen',
				Key: uri,
				Body: this.html,
			})
			await client.send(command)
		} else {
			await fsp.writeFile(uri, html)
		}
	}

	async create_pdf() {
		let uri = this.uri('html')
		var PDFOptions = {printBackground: true, format: 'A4'}

		if (!REMOTE) {PDFOptions.path = uri}

		const browser = await puppeteer.launch({
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath(),
			headless: chromium.headless,
			ignoreHTTPSErrors: true,
		})

		const page = await browser.newPage()
		await page.goto(uri, {waitUntil: 'networkidle0'})
		await page.emulateMediaType('screen')
		page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
		const pdf = await page.pdf(PDFOptions)
		await page.close()
		await browser.close()
	}
}

export const handler = async (event) => {
	let document = new Document(event)

	await document.read_template()
	document.create_dom()
	document.delete_dom_elements()
	document.update_dom_elements()
	document.create_dom_elements()
	document.create_html()
	document.create_pdf()

	return document.res
}

async function setup(type) {
	let request = await fsp.readFile(`${ROOT}/json/${type}.json`, 'utf-8')
	let json = JSON.parse(request)
	handler(json)
}

if(!REMOTE) {
	setup('invoice')
	// setup('estimate')
}
