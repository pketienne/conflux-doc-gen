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

	// An easy method for dynamically creating and placing dom elements.
	create(element, value, location, attributes = {}) {
		let e = this.doc.createElement(element)
		if (value) e.innerHTML = value
		for (const a in attributes) e.setAttribute(a, attributes[a])	
		this.doc.querySelector(location).append(e)
	}

	//
	generate_classes(innerHTML) {
		let classes;
		switch (innerHTML) {
			case 'description':
				classes = 'pl0 text-start'
				break
			case 'cost':
				classes = 'text-end'
				break
			case 'total':
				classes = 'text-end'
				break
			case 'price':
				classes = 'text-center'
				break
			case 'quantity':
				classes = 'text-center'
				break
		}
		return classes
	}

	// 
	add_tables() {
		let tables = this.event.tables
		this.create('div', null, '#mdb-sections', {
			class: 'table-responsive'
		})
		for (const t in tables) {
			this.create('table', null, '#mdb-sections div', {
				id: `mdb-${t}`, class: 'table mb-0 table-striped invoice-table'
			})
			this.create('thead', null, '#mdb-sections div table:last-child', {'class': 'bg-active'})
			for (const th in tables[t][0]) {
				let classes = this.generate_classes(th)
				this.create('th', th, '#mdb-sections div table:last-child thead', {
					class: classes
				})
			}
			tables[t].forEach((item) => {
				this.create('tr', null, `#mdb-${t}`, { class: 'tr' })
				for (const i in item) {
					let classes = this.generate_classes(i)
					this.create('td', item[i], `#mdb-${t} tr:last-child`, {'class': classes})
				}
			})
			let br = this.create('br', null, '#mdb-sections div:last-child')
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
	
	request = new Event(type)
	await request.to_json()
	event = request.json
	handler(event)
}

// Only run if running locally (not within AWS Lambda)
if(!IS_AWS) {
	setup('invoice')
	// setup('estimate')
}
