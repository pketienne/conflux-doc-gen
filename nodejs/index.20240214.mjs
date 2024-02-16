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


class Document {
	static m = {
		constructor: 'The conversion process was completed successfully.',
		read_template: {
			remote: (e) => `Read template remote error: ${e}`,
			local: (e) => `Read template local error: ${e}`,
		},
		create_dom: (e) => `Create DOM error: ${e}`,
		delete_dom_elements: (e) => `Delete DOM element error: ${e}`,
		update_dom_elements: (e) => `Update DOM element error: ${e}`,
		create_dom_elements: (e) => `Create DOM element error: ${e}`,
		create_html: {
			remote: (e) => `Create HTML remote error: ${e}`,
			local: (e) => `Create HTML local error: ${e}`,
		},
		read_html: {
			remote: (e) => `Read HTML remote error: ${e}`,
			local: (e) => `Read HTML local error: ${e}`,
		},
		create_pdf: {
			remote: (e) => `Create PDF remote error: ${e}`,
			local: (e) => `Create PDF local error: ${e}`,
		},
		terminate: (e) => `Terminate document error: ${e}`,
	}

	constructor(body) {
		this.body = body
		console.log(`this is the body!: ${this.body}`)
		this.uuid = crypto.randomUUID()
		this.template = null
		this.dom = null
		this.html = null
		this.browser = null
		this.page = null
		this.PDFOptions = { printBackground: true, format: 'A4' }
		this.pdf = null
		this.res = {
			statusCode: 200,
			body: Document.m.constructor,
		}

		const type = this.body.document_type
		console.log(`type: ${type}`)
		console.log(`document_type: ${this.body['document_type']}`)
		console.log(`just body: ${body}`)
		const num = this.body.template_number
		console.log(`num: ${num}`)
		const type_num = `${type}-${num}`
		console.log(`type_num: ${type_num}`)

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
		
		console.log(`event: ${JSON.stringify(this)}`)
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
		console.log(`browser: ${this.browser}, page: ${this.page}`)
	}

	async read_template() {
		if (REMOTE) {
			try {
				this.template = await (await fetch(this.urls.read_template.remote)).text()
			} catch (e) {
				// let m = Document.m['read_template'].remote(e)
				// console.log(m)
				// this.res.body = m
				return this.res
			}
		} else {
			try {
				this.template = await fsp.readFile(this.urls.read_template.local, 'utf-8')
			} catch (e) {
				// let m = Document.m['read_template'].local(e)
				// console.log(m)
				// this.res.body = m
				return this.res
			}
		}
		console.log(`template: ${this.template}`)
	}
	
	create_dom() {
		try {
			this.dom = new JSDOM(this.template)
		} catch (e) {
			let m = Document.m['create_dom'](e)
			console.log(m)
			this.res.body = m
			return this.res
		}
		console.log(`DOM (created): ${this.dom.serialize()}`)
	}
	
	async delete_dom_elements() {
		let doc = this.dom.window.document
		
		try {
			doc.querySelector('div#mdb-sections div.table-responsive').remove()
		} catch (e) {
			let m = Document.m['delete_dom_elements'](e)
			console.log(m)
			this.res.body = m
			return this.res
		}
		console.log(`DOM (deleted): ${this.dom.serialize()}`)
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
				let m = Document.m['update_dom_elements'](e)
				console.log(m)
				this.res.body = m
				return this.res
			}
		})
		console.log(`DOM (updated): ${this.dom.serialize()}`)
	}

	async terminate() {
		if (this.page) await this.page.close()
		if (this.browser) await this.browser.close()
		console.log(`browser: ${this.browser}, page: ${this.page}.`) 
	}
}

export const handler = async (event) => {
	const document = new Document(event.body)
	await document.init()
	await document.read_template()
	document.create_dom()
	document.delete_dom_elements()
	// document.update_dom_elements()
	await document.terminate()
	console.log(document.res)
	return document.res
}

async function setup(type) {
	let request
	let json
	let message = {
		fsp: (e) => `There was an error reading json data from the filesystem: ${e}`,
		json: (e) => `There was an error converting the sample data into json: ${e}`,
	}
	
	try {
		request = await fsp.readFile(`documents/json/${type}.json`, 'utf-8')
	} catch (e) {
		message(e)
		console.err(message.fsp(e))
		return
	}
	
	try {
		json = JSON.parse(request)
	} catch (e) {
		message(e)
		console.err(message.json(e))
		return
	}
	handler(json)
}

if(!REMOTE) {
	setup('invoice')
	// setup('estimate')
}
