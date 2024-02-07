import { promises as fs } from 'fs'
import {JSDOM} from 'jsdom'
import prettier from 'prettier'


const region = process.env.AWS_REGION


class Document {
	static BUCKET_NAME = 'conflux-doc-gen'
	static AWS_DOMAIN = 's3.us-east-2.amazonaws.com'
	static S3_URL = `https://${this.BUCKET_NAME}.${this.AWS_DOMAIN}`

	constructor(event) {
		this.document_type = event.document
		this.template_num = event.template
		this.xml = null
		this.res = {}
	}

	init() {}

	fetch_template() {
		let type = this.type
		let template = this.template
		let url = `templates/${type}-${template}.html`

	}
}


export const handler = async (event) => {
	let document = new Document(event)
	document.init()
	return document.res
}

async function generate_event(type) {
	const file = await fs.readFile(`samples/${type}.json`)
	const json = await JSON.parse(file)
	handler(json)
}

if (!region) {
	generate_event('invoice')
}
