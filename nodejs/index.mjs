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
const S3_URL = `${BUCKET_NAME}.${AWS_DOMAIN}`
const ROOT = 'documents'

/**
 * 
 * Dimensions of the problem space.
 * 
 * - Proximity: local || remote
 * - Stage: template || dom || html || pdf
 * - operation: create || read || update || delete || list
 * - filesystem: local || remote
 * 
 */

class Document {
	constructor(event) {
		this.event = event
		this.uuid = crypto.randomUUID()
		this.template = null
		this.dom = null
		this.html = null
		this.browser = null
		this.page = null
		this.PDFOptions = { printBackground: true, format: 'A4' }
		this.pdf = null
		this.res = {}

		const type = event.document_type
		const num = event.template_number	
		const type_num = `${type}-${num}`

		this.urls = {
			read_template: {
				remote: `https://${S3_URL}/${ROOT}/template/${type_num}.html`, // fetch()
				local: `${ROOT}/template/${type_num}.html`, // fsp.readFile()
			},
			create_html: {
				remote: `${ROOT}/html/${type_num}.${this.uuid}.html`, // PutObjectCommand()
				local: `${ROOT}/html/${type_num}.html`, // fsp.write()
			},
			read_html: {
				remote: `https://${S3_URL}/${ROOT}/html/${type_num}.${this.uuid}.html`, // Page.goto()
				local: `file://${process.cwd()}/${ROOT}/html/${type_num}.html`, // Page.goto()
			},
			create_pdf: {
				remote: `${ROOT}/pdf/${type_num}.${this.uuid}.pdf`, // PutObjectCommand()
				local: `${ROOT}/pdf/${type_num}.pdf`, // Page.pdf()
			},
		}
	}

	async init() {
		this.browser = await puppeteer.launch({
			args: chromium.args,
			defaultViewport: chromium.defaultViewport,
			executablePath: await chromium.executablePath(),
			headless: chromium.headless,
			ignoreHTTPSErrors: true,
		})
		this.page = await this.browser.newPage()
		this.page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
		await this.page.emulateMediaType('screen')
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
		this.template = await (await fetch(this.urls.read_template.remote)).text()
		if (REMOTE) {
			this.template = await fetch(this.urls.read_template.remote)
		} else {
			this.template = await fsp.readFile(this.urls.read_template.local, 'utf-8')
		}
	}

	create_dom() {
		this.dom = new JSDOM(this.template)
	}

	async delete_dom_elements() {
		const xml = this.dom.window.document.documentElement.outerHTML
		const html = await prettier.format(xml, { parser: 'html' })
		console.log(html)
		let doc = this.dom.window.document
		doc.querySelector('div#mdb-sections div.table-responsive').remove()
	}

	update_dom_elements() {
		let doc = this.dom.window.document
		let instructions = [
			// {location: 'span#mdb-invoice-number', value: this.event.invoice_info.number},
			// {location: 'span#mdb-invoice-date',	value: this.event.invoice_info.date.slice(0,10)},
			{location: 'h2#mdb-client-person', value: this.event.client_info.person},
			{location: 'span#mdb-client-company', value: this.event.client_info.company},
			{location: 'span#mdb-client-email', value: this.event.client_info.email},
			{location: 'span#mdb-client-address', value: this.event.client_info.address},
			{location: 'h2#mdb-contractor-person', value: this.event.contractor_info.person},
			{location: 'span#mdb-contractor-company', value: this.event.contractor_info.company},
			{location: 'span#mdb-contractor-email', value: this.event.contractor_info.email},
			{location: 'span#mdb-contractor-address', value: this.event.contractor_info.address},
			{location: 'h3#mdb-notes-title', value: 'Notes:'},
			// {location: 'p#mdb-notes-content', value: this.event.invoice_info.notes},
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
		const xml = this.dom.window.document.documentElement.outerHTML
		const html = await prettier.format(xml, { parser: 'html' })
		
		if (REMOTE) {
			const client = new S3Client({})
			const command = new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: this.urls.create_html.remote,
				Body: this.html,
			})
			await client.send(command)
		} else {
			await fsp.writeFile(this.urls.create_html.local, html)
		}
	}

	async read_html() {
		if (REMOTE) {
			await this.page.goto(this.urls.read_html.remote, { waitUntil: 'networkidle0' })
		} else {
			await this.page.goto(this.urls.read_html.local)
		}
	}

	async create_pdf() {
		if(REMOTE) {
			this.pdf = await this.page.pdf(PDFOptions)
			const client = new S3Client({})
			const command = new PutObjectCommand({
				Bucket: BUCKET_NAME,
				Key: this.urls.create_pdf.remote,
				Body: this.html,
			})
			await client.send(command)
		} else {
			this.PDFOptions.path = this.urls.create_pdf.local
			this.pdf = await this.page.pdf(this.PDFOptions)
		}
	}

	async terminate() {
		if (this.page) await this.page.close()
		if (this.browser) await this.browser.close()
	}
}

export const handler = async (event) => {
	let document = new Document(event)
	await document.init()
	await document.read_template()
	document.create_dom()
	document.delete_dom_elements()
	document.update_dom_elements()
	// document.create_dom_elements()
	// await document.create_html()
	// await document.read_html()
	// await document.create_pdf()
	document.terminate()
	return document.res
}

async function setup(type) {
	let request = await fsp.readFile(`documents/json/${type}.json`, 'utf-8')
	let json = JSON.parse(request)
	handler(json)
}

if(!REMOTE) {
	setup('invoice')
	// setup('estimate')
}
