import { promises as fsp } from 'fs'
import { JSDOM } from 'jsdom'
import prettier from 'prettier'

// Value is true iff running within AWS Lambda
const IS_AWS = process.env.AWS_REGION

/**
 * Create a class representing the structures (js, json, xml, pdf) needed for
 * converting an http request body to a pdf and associated http location.
 */
export class Document {
	static BUCKET_NAME = 'conflux-doc-gen'
	static AWS_DOMAIN = 's3.us-east-2.amazonaws.com'
	static S3_URL = `https://${this.BUCKET_NAME}.${this.AWS_DOMAIN}`

	constructor(event) {
		const type = event.document_type
		const num = event.template_number

		this.event = event
		this.uri = `${type}-${num}`
		this.xml = null
		this.dom = null
		this.doc = null
		this.res = {}
	}

	static instantiate(constructor, args = []) {
		let instance = Object.create(constructor.prototype)
		constructor.apply(instance, args)
		return instance
	}

	// Generate template as string from either remote file or local file.
	async from_template() {
		const uri = `templates/${this.uri}.html`
		
		if(IS_AWS) {
			const url = `${Document.S3_URL}/${uri}`
			this.xml = await fetch(url)
				.then(res => res.text())
		} else {
			this.xml = await fsp.readFile(uri, 'utf-8')
		}

		this.dom = new JSDOM(this.xml)
		this.doc = this.dom.window.document
	}

	// Remove existing tables.
	delete(location) {
		this.doc.querySelector(location).remove()
	}

	// Replace info sections with data specific to this request.
	update(location, value) {
		this.doc.querySelector(location).innerHTML = value
	}
	
	// Interate over an array instruction objects.
	updates(instructions) {
		instructions.forEach((i) => {
			this.update(i.location, i.value)
		})
	}

	//
	create(element, value, location, attributes = {}) {
		let e = this.doc.createElement(element)
		if (value) e.innerHTML = value
		for (const a in attributes) e.setAttribute(a, attributes[a])	
		this.doc.querySelector(location).append(e)
	}

	//
	add_tables() {
		let tables = this.event.tables
		for (const t in tables) {
			this.create('table', null, '#mdb-sections', { id: `mdb-${t}` })
			tables[t].forEach((item) => {
				this.create('tr', null, `#mdb-${t}`)
				for (const i in item) {
					this.create('td', item[i], `#mdb-${t} tr`)
				}
			})
		}
	}

	// Write xml representation of doc content to file.
	async to_file() {
		const uri = `responses/${this.uri}.html`
		const xml = this.doc.documentElement.outerHTML
		const html = await prettier.format(xml, { parser: 'html' })
		await fsp.writeFile(uri, html)
	}
}


// Class for generating a "Materials" section
export class Materials {
	constructor(doc, json) {
		this.doc = doc
		this.json = json
		this.xml = null
	}

	to_xml() {
		let div = doc.createElement('div')
		let table = doc.createElement('table')
		let thead = doc.createElement('thead')
		let tr = doc.createElement('tr')
		let th1 = doc.createElement('th')
		let th2 = doc.createElement('th')
		let tbody = doc.createElement('tbody')

		th1.innerHTML = 'Description'
		th2.innerHTML = 'Cost'

		this.xml = div
		this.xml.append(table)
		table.append(thead)
		thead.append(tr)
		tr.append(th1)
		tr.append(th2)
		table.append(tbody)

		for (const m in json.materials) {
			let material = Material(doc, materials)
			tbody.append()
		}

		json.materials.forEach((j) => {
			let material = Material(doc, j)
			let xml = Material.to_xml()
			tbody.append(xml)
		})

		return this.xml
	}
}


// Read json file from path; Return as json.
export class Event {
	constructor(type) {
		this.path = `requests/${type}.json`
		this.json = null
	}
	async to_json(type) {
		let contents = await fsp.readFile(this.path, 'utf-8')
		this.json = JSON.parse(contents)
	}
}

// The AWS Lambda `handler` function (required by Lambda)
export const handler = async (event) => {
	let document;
	let instructions = [
		{location: 'span#mdb-invoice-number', value: event.invoice_info.number},
		{location: 'span#mdb-invoice-date',	value: event.invoice_info.date.slice(0,10)},
		{location: 'h2#mdb-client-person', value: event.client_info.person},
		{location: 'span#mdb-client-company', value: event.client_info.company},
		{location: 'span#mdb-client-email', value: event.client_info.email},
		{location: 'span#mdb-client-address', value: event.client_info.address},
		{location: 'h2#mdb-contractor-person', value: event.contractor_info.person},
		{location: 'span#mdb-contractor-company', value: event.contractor_info.company},
		{location: 'span#mdb-contractor-email', value: event.contractor_info.email},
		{location: 'span#mdb-contractor-address', value: event.contractor_info.address},
		{location: 'p#mdb-notes', value: event.invoice_info.notes},
		{location: 'span#mdb-phone', value: event.contractor_info.phone},
		{location: 'span#mdb-email', value: event.contractor_info.email},
		{location: 'span#mdb-address', value: event.contractor_info.address},
	]

	document = new Document(event)
	await document.from_template()
	document.delete('div#mdb-sections div.table-responsive')
	document.updates(instructions)
	document.add_tables()
	document.to_file()

	return document.res
}

// If running locally, create an "Event" as a mock http request body.
async function setup(type) {
	let request;
	let event;
	
	request = new Event('invoice')
	await request.to_json()
	event = request.json
	handler(event)
}

// Only run if running locally (not within AWS Lambda)
if(!IS_AWS) {
	setup('invoice')
}
