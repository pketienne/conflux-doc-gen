import fs from 'fs'
import {JSDOM} from 'jsdom'
import prettier from 'prettier'


const region = process.env.AWS_REGION
const bucket = 'conflux-doc-gen'
const s3_url = `https://${bucket}.s3.us-east-2.amazonaws.com`


class Document {
	constructor(document) {
		this.type = document.type
		this.identifier = this.generate_file_name()
		this.path = {
			src: (type) => `../api/${type}.json`,
			dest: (type) => `../xml/${type}.html`,
		}
		this.dom = this.generate_dom()
		this.doc = this.generate_doc()
		this.pdf = this.generate_pdf()
		this.response = {}
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

	from_xml () {}

	from_file() {}

	from_s3() {}

	to_xml () {}

	to_file() {
		fs.readFile(path, 'utf8', (err, file) => {
			if (err) {
				console.error('Error while reading the file:', err)
				return
			}
			try {
				let event = JSON.parse(file)
				handler(event)
			} catch (err) {
				console.error('Error while parsing JSON data:', err)
			}
		})
	}

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
	let document = new Document()
	return document.response
}

if (!region) {
	let document = { type: 'invoice' }
	let invoice = new Document(document)
	// let event = { document: 'estimate' }
	// let estimate = new Document(event)
}
