import { promises as fsp } from 'fs'
import { JSDOM } from 'jsdom'
import prettier from 'prettier'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import crypto from 'crypto'


const REMOTE = process.env.AWS_REGION
const BUCKET_NAME = 'mdb-conflux'
const AWS_DOMAIN = 's3.us-east-2.amazonaws.com'
const S3_URL = `${BUCKET_NAME}.${AWS_DOMAIN}`
const ROOT = 'documents'


class Logger {
	static log(context) {
		let e, stack, root, klass, method, printable

		e = new Error()
		stack = e.stack.split('\n')[2].trim()
		stack = stack.replace(/\(.*\)/, '')
		stack = stack.replace(/at /, '')
		klass = null
		method = null
		console.log(`Klass: ${stack}\nMethod: ${stack}\nValue:\n${JSON.stringify(context, null, 2)}`)
	}
}

class Document {
	static m = {
		constructor: 'The conversion completed successfully.',
		init: (e) => `Init: ${e}`,
		read_template: (e) => `Read Template: ${e}`,
		create_dom: (e) => `Create JSDOM: ${e}`,
		delete_dom_elements: (e) => `Delete DOM elements: ${e}`,
		update_dom_elements: (e) => `Update DOM elements: ${e}`,
		create_dom_elements: (e) => `Create DOM elements: ${e}`,
		create_html: (e) => `Create HTML: ${e}`,
		read_html: (e) => `Read HTML: ${e}`,
		create_pdf: (e) => `Create PDF: ${e}`,
		terminate: (e) => `Terminate: ${e}`,
	}

	constructor(body) {
		this.body = JSON.parse(body)
		this.uuid = crypto.randomUUID()
		this.template = null
		this.dom = null
		this.html = null
		this.browser = null
		this.page = null
		this.PDFOptions = { printBackground: true, landscape: false }
		this.pdf = null
		this.res = {
			statusCode: 200,
			body: JSON.stringify({ status: Document.m.constructor })
		}

		const type = this.body.document_type
		const num = this.body.template_number
		const type_num = `${type}-${num}`
		
		if (this.body.orientation == 'landscape') this.PDFOptions.landscape = true

		this.urls = {
			read_template: {
				remote: `https://${S3_URL}/${ROOT}/templates/${type_num}.html`, // fetch()
				local: `${ROOT}/templates/${type_num}.html`, // fsp.readFile()
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
			pdf: `https://${S3_URL}/${ROOT}/pdf/${type_num}.${this.uuid}.pdf`
		}
	}
	
	async init() {
		try {
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
		} catch (e) {
			this.res.statusCode = 501
			this.set_body_prop('message', Document.m.init(e))
		}
	}

	create_element(element, value, location, attributes = {}) {
		let doc = this.dom.window.document
		let e = doc.createElement(element)
		if (value) e.innerHTML = value
		for (const a in attributes) e.setAttribute(a, attributes[a])	
		doc.querySelector(location).append(e)
		Logger.log(this.dom)
	}

	generate_classes(innerHTML) {
		let classes;
		switch (innerHTML) {
			case 'cost_code':
				classes = 'text-right';
				break;
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
		if (REMOTE) {
			try {
				this.template = await (await fetch(this.urls.read_template.remote)).text()
			} catch (e) {
				this.res.statusCode = 501
				this.set_body_prop('message', Document.m.read_template(e))
			}
		} else {
			try {
				this.template = await fsp.readFile(this.urls.read_template.local, 'utf-8')
			} catch (e) {
				this.res.statusCode = 501
				this.set_body_prop('message', Document.m.read_template(e))
			}
		}
		Logger.log(this)
	}

	create_dom() {
		try {
			this.dom = new JSDOM(this.template)
		} catch (e) {
			this.res.statusCode = 501
			this.set_body_prop('message', Document.m.create_dom(e))
		}
		Logger.log(this)
	}
	
	delete_dom_elements() {
		let doc = this.dom.window.document
		
		try {
			doc.querySelector('div#mdb-sections div.table-responsive').remove()
		} catch (e) {
			this.res.statusCode = 501
			this.set_body_prop('message', Document.m.delete_dom_elements(e))
		}
		Logger.log(this)
	}
	
	update_dom_elements() {
		let doc = this.dom.window.document
		let instructions = [
			// {location: 'span#mdb-invoice-number', value: this.body.invoice_info.number},
			// {location: 'span#mdb-invoice-date',	value: this.body.invoice_info.date.slice(0,10)},
			{location: 'h2#mdb-client-person', value: this.body.client_info.person},
			{location: 'span#mdb-client-company', value: this.body.client_info.company},
			{location: 'span#mdb-client-email', value: this.body.client_info.email},
			{location: 'span#mdb-client-address', value: this.body.client_info.address},
			{location: 'h2#mdb-contractor-person', value: this.body.contractor_info.person},
			{location: 'span#mdb-contractor-company', value: this.body.contractor_info.company},
			{location: 'span#mdb-contractor-email', value: this.body.contractor_info.email},
			{location: 'span#mdb-contractor-address', value: this.body.contractor_info.address},
			{location: 'h3#mdb-notes-title', value: 'Notes:'},
			// {location: 'p#mdb-notes-content', value: this.body.invoice_info.notes},
			{location: 'span#mdb-phone', value: this.body.contractor_info.phone},
			{location: 'span#mdb-email', value: this.body.contractor_info.email},
			{location: 'span#mdb-address', value: this.body.contractor_info.address},
		]
		instructions.forEach((i) => {
			try {
				doc.querySelector(i.location).innerHTML = i.value
			} catch (e) {
				this.res.statusCode = 501
				this.set_body_prop('message', Document.m.delete_dom_elements(e))
			}
		})
	}

	create_dom_elements() {
		let tables = this.body.tables
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
		try {
			const xml = this.dom.window.document.documentElement.outerHTML
			this.html = await prettier.format(xml, { parser: 'html' })
			try {
				if (REMOTE) {
					const client = new S3Client({})
					const command = new PutObjectCommand({
						Bucket: BUCKET_NAME,
						Key: this.urls.create_html.remote,
						Body: this.html,
						ContentType: 'text/html',
					})
					await client.send(command)
				} else {
					await fsp.writeFile(this.urls.create_html.local, this.html)
				}
			} catch (e) {
				this.res.statusCode = 501
				this.set_body_prop('message', Document.m.create_html(e))
			}
		} catch (e) {
			this.res.statusCode = 501
			this.set_body_prop('message', Document.m.create_html(e))
		}
	}

	async read_html() {
		try {
			if (REMOTE) {
				await this.page.goto(this.urls.read_html.remote, { waitUntil: 'networkidle0' })
			} else {
				await this.page.goto(this.urls.read_html.local)
			}
		} catch (e) {
			this.res.statusCode = 501
			this.set_body_prop('message', Document.m.read_html(e))
		}
	}

	async create_pdf() {
		try {
			if(REMOTE) {
				Logger.log(this.PDFOptions)
				this.pdf = await this.page.pdf(this.PDFOptions)
				const client = new S3Client({})
				const command = new PutObjectCommand({
					Bucket: BUCKET_NAME,
					Key: this.urls.create_pdf.remote,
					Body: this.pdf,
					ContentType: 'application/pdf',
				})
				await client.send(command)
				this.set_body_prop('url', this.urls.pdf)
			} else {
				this.PDFOptions.path = this.urls.create_pdf.local
				this.pdf = await this.page.pdf(this.PDFOptions)
			}
		} catch (e) {
			this.res.statusCode = 501
			this.set_body_prop('message', Document.m.create_pdf(e))
		}
	}

	async terminate() {
		try {
			if (this.page) await this.page.close()
			if (this.browser) await this.browser.close()
		} catch (e) {
			this.res.statusCode = 501
			this.set_body_prop('message', Document.m.terminate(e))
		}
	}
	
	set_body_prop(prop, value) {
		this.res.body = JSON.parse(this.res.body)
		this.res.body[prop] = value
		this.res.body = JSON.stringify(this.res.body)
	}
}

export const handler = async (event) => {
	const document = new Document(event.body)
	const status = document.res.statusCode
	
	if (status) await document.init()
	if (status) await document.read_template()
	if (status) document.create_dom()
	if (status) document.delete_dom_elements()
	if (status) document.update_dom_elements()
	if (status) document.create_dom_elements()
	if (status) await document.create_html()
	if (status) await document.read_html()
	if (status) await document.create_pdf()
	if (status) await document.terminate()

	return document.res
}

async function json(type) {
	let request, json, m

	m = {
		fsp: (e) => `There was an error reading json data from the filesystem: ${e}`,
		json: (e) => `There was an error converting the sample data into json: ${e}`,
	}
	
	try {
		request = await fsp.readFile(`documents/json/${type}.json`, 'utf-8')
		try {
			json = JSON.parse(request)
		} catch (e) {
			console.log(m.json(e))
		}
	} catch (e) {
		console.log(m.fsp(e))
	}
	
	return json
}

if(!REMOTE) {
	let event = await json('estimate')
	if (event) handler(event)
}
