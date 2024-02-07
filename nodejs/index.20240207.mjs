import { promises as fs } from 'fs'
import {JSDOM} from 'jsdom'
import prettier from 'prettier'


const region = process.env.AWS_REGION

class Document {
	static BUCKET = 'conflux-doc-gen'

	constructor(document) {
		this.type = document.type
		this.file_name= null
		this.s3_url = null
		this.path = {
			src: null,
			dest: null,
		}
		this.json = null
		this.dom = null
		this.doc = null
		this.pdf = null
		this.res = {}
	}

	async init() {
		this.file_name = this.generate_file_name()
		this.path.src = `../samples/${this.type}.json`
		this.path.dest = `../results/${this.type}.json`
		this.json =	await this.generate_json()
		this.dom = await this.generate_dom()
		this.doc = dom.window.document
		this.pdf = this.to_pdf()
		this.res = this.generate_res()
	}

	generate_file_name() {
		let file_name = 'result'
		if(region) {
			let file_number = Math.random() * 0xfffff * 1000000000000
			let file_string = file_number.toString()
			file_name = file_string.slice(0, 16)
		}
		return file_name
	}

	generate_s3_url() {
		let url = `https://${BUCKET}.s3.us-east-2.amazonaws.com`
		return url
	}

	generate_dom() {
		if(region) {
			return this.from_s3()
		}
		return this.from_file()
	}

	generate_doc() {
		return this.dom.window.document
	}

	generate_pdf() {
		let pdf = new PDF()
	}

	generate_res() {}

	from_xml () {}

	async from_file() {
		const file = await fs.readFile(this.path.src, 'utf-8')
		const json = await JSON.parse(file)
		return json
		// fs.readFile(this.path.src, 'utf8', (err, file) => {
		// 	if (err) {
		// 		console.error('Error while reading the file:', err)
		// 		return
		// 	}
		// 	try {
		// 		let event = JSON.parse(file)
		// 		return event
		// 	} catch (err) {
		// 		console.error('Error while parsing JSON data:', err)
		// 	}
		// })
	}

	from_s3() {
		let url = `${S3_URL}/templates/${this.type}-${this.template}.html`
		let dom = JSDOM.fromURL(url)
		return dom
	}

	to_xml () {}

	to_file() {}

	to_s3() {}

	to_pdf() {}
}


class Materials {
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


class Material {
	constructor(doc, json) {
		this.doc = doc
		this.json = json
		this.xml = null
	}

	to_xml() {
		let tr = doc.createElement('tr')
		let description = doc.createElement('td')
		let cost = doc.createElement('td')

		description.innerHTML = json.description
		cost.innerHTML = json.cost

		this.xml = tr
		this.xml.append(description)
		this.xml.append(cost)

		return this.xml
	}
}


class Labors {
	// TODO: follow `Materials` class
}


class Labor {
	// TODO: follow `Material` class
}


class Tasks {
	// TODO: follow `Materials` class
}


class Task {
	// TODO: follow `Material` class
}


class PDF {
	constructor(document) {
		this.doc = document
		this.browser = null
		this.page = null
	}

	generate() {}
}


export const handler = async (event) => {
	let document = new Document(event)
	return document.response
}

if (!region) {
	let document = { type: 'invoice' }
	let invoice = new Document(document)
	invoice.init()

	// let event = { document: 'estimate' }
	// let estimate = new Document(event)
	// estimate.init()
}
