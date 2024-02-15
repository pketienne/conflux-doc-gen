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
		constructor: 'The conversion process completed successfully.',
	}
	
	constructor(doc) {
		this.doc = doc
		this.browser = null
		this.page = null
		
		this.res = {
			statusCode: 200,
			body: Document.m.constructor,
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
		console.log(`browser: ${this.browser}, page: ${this.page}`)
	}
}

export const handler = async (event) => {
	let document = new Document(event)
	
	document.init()
	
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
