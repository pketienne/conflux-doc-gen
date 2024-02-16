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
 * Utilities
 */
class Logger {
	static info (obj) {
		var stack = new Error().stack
		let line = stack.split('\n')[2].trim()
		let klass_method = line.slice(3).replace(/\(.*\)/, '').trim()
		let klass = klass_method.replace(/\..*/, '')
		let method = klass_method.replace(/.*\./, '')

		if (klass == 'new Document') {
			klass = 'Document'
			method = 'constructor'
		}

		console.log('---')
		console.log(`Class: ${klass}`)
		console.log(`Method: ${method}`)
		console.log(`Message: ${JSON.stringify(Document.m[method])}`)
		console.log(`Value: ${JSON.stringify(obj)}`)
	}

	static err (obj, error) {
		var stack = new Error().stack
		let line = stack.split('\n')[2].trim()
		let klass_method = line.slice(3).replace(/\(.*\)/, '').trim()
		let klass = klass_method.replace(/\..*/, '')
		let method = klass_method.replace(/.*\./, '')

		if (klass == 'new Document') {
			klass = 'Document'
			method = 'constructor'
		}

		console.log('---')
		console.log(`Class: ${klass}`)
		console.log(`Method: ${method}`)
		console.log(`Message: ${JSON.stringify(Document.m[method])}`)
		console.log(`Value: ${JSON.stringify(obj)}`)
		console.log(`Error: ${e}`)
	}
}


/**
 * @param doc represents the json request body.
 */
class Document {
	static m = {
		constructor: 'The conversion process completed successfully.',
		init: `Initialize document error: ${e}`,
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
	
	constructor(doc) {
		this.doc = doc
		this.browser = null
		this.page = null
		
		this.res = {
			statusCode: 200,
			body: Document.m['new Document'],
		}

		Logger.info(this)
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
		Logger.info(this)
	}

	async terminate() {
		if (this.page) await this.page.close()
		if (this.browser) await this.browser.close()
		Logger.info(this)
	}
}

 /**
	* The Lambda Handler function
 */
export const handler = async (event) => {
	let document = new Document(event)
	
	await document.init()
	await document.terminate()
	
	return document.res
}

async function json(type) {
	let request
	let json
	let message = {
		fsp: (e) => `There was an error reading json data from the filesystem: ${e}`,
		json: (e) => `There was an error converting the sample data into json: ${e}`,
	}
	
	try {
		request = await fsp.readFile(`documents/json/${type}.json`, 'utf-8')
	} catch (e) {
		console.err(message.fsp(e))
		return
	}
	
	try {
		json = JSON.parse(request)
	} catch (e) {
		console.err(message.json(e))
		return
	}
	
	return json
}

if(!REMOTE) {
	let event = json('invoice')
	let body = event.body
	handler(body)
}
