import { promises as fsp } from 'fs'
import { JSDOM } from 'jsdom'
// import prettier from 'prettier'

// Value is true iff running within AWS Lambda
const IS_AWS = process.env.AWS_REGION

/**
 * Create a class representing the structures (js, json, xml, pdf) needed for
 * converting an http request body to a pdf and associated http location.
 */
class Document {
	static BUCKET_NAME = 'conflux-doc-gen'
	static AWS_DOMAIN = 's3.us-east-2.amazonaws.com'
	static S3_URL = `https://${this.BUCKET_NAME}.${this.AWS_DOMAIN}`


	constructor(event) {
		const type = event.document_type
		const num = event.template_number

		this.uri = `${type}-${num}`
		this.xml = null
		this.dom = null
		this.doc = null
		this.res = {}
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
	update(loc, value) {
		this.doc.querySelector(loc).innerHTML = value
	}
	
	// Interate over an array instruction objects.
	updates(instructions) {
		instructions.forEach((i) => {
			this.update(i.location, i.value)
		})
	}

	// Write xml representation of doc content to file.
	async to_file() {
		const uri = `responses/${this.uri}.html`
		const xml = this.doc.documentElement.outerHTML
		await fsp.writeFile(uri, xml)
	}
}

// Read json file from path; Return as json.
class Event {
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
	
	document = new Document(event)
	await document.from_template()
	document.delete('div#mdb-sections div.table-responsive')
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
