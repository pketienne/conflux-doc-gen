import fs from 'fs'
import {JSDOM} from 'jsdom'


const region = process.env.AWS_REGION

export const handler = async (event) => {
	const bucket = 'conflux-doc-gen'
	const template = `templates/${event.document}-${event.template}`
	const aws_s3 = `https://${bucket}.s3.us-east-2.amazonaws.com`
	const url = `${aws_s3}/${template}.html`

	var dom = await JSDOM.fromURL(url)
	var doc = dom.window.document

	const instructions = [
		{selector: 'span#mdb-invoice-number', innerHTML: event.invoice.number},
		{selector: 'span#mdb-invoice-date',	innerHTML: event.invoice.date.slice(0,10)},
		{selector: 'h2#mdb-client-person', innerHTML: event.client.person},
		{selector: 'span#mdb-client-company', innerHTML: event.client.company},
		{selector: 'span#mdb-client-email', innerHTML: event.client.email},
		{selector: 'span#mdb-client-address', innerHTML: event.client.address},
		{selector: 'h2#mdb-contractor-person', innerHTML: event.contractor.person},
		{selector: 'span#mdb-contractor-company', innerHTML: event.contractor.company},
		{selector: 'span#mdb-contractor-email', innerHTML: event.contractor.email},
		{selector: 'span#mdb-contractor-address', innerHTML: event.contractor.address},
		{selector: 'p#mdb-notes', innerHTML: event.invoice.notes},
		{selector: 'span#mdb-phone', innerHTML: event.contractor.phone},
		{selector: 'span#mdb-email', innerHTML: event.contractor.email},
		{selector: 'span#mdb-address', innerHTML: event.contractor.address},
	]

	instructions.forEach((i) => {
		try {
			doc.querySelector(i.selector).innerHTML = i.innerHTML
		} catch (err) {
			console.error(`An error occurred while attempting to change the contents of element at location: "${i.selector}" with the content: \n\n ${i.innerHTML} \n${err}.`)
		}
	})

	try {
		doc.querySelector('div.table-responsive').remove()
	} catch (err) {
		console.error(`An error occurred while attempting to remove elements from the document: ${err}`)
	}

	try {
		doc.querySelector('div#mdb-sections')
	} catch (err) {
		console.error(`An error occurred while attempting to remove elements from the document: ${err}`)
	}

	fs.writeFile('result.html', dom.serialize(), (err) => {
		if (err) throw err
	})
}

if (!region) {
	const document_type = 'invoice'
	const path = `../api/${document_type}.json`

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
