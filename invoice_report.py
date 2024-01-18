import json
from lxml import etree
from lxml.builder import E


class InvoiceReport:
	CSS = '''
* { 
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
html, body {
	margin: 20px;
}
#logo {
	width: 500px;
	height: 125px;
	background-image: url('mdb-logo.png');
	margin: auto;
	margin-top: 40px;
	margin-bottom: 40px;
}
h1 {
	background-color: #abc;
	border: 1px solid #999;
	margin: 20px 0px;
	padding: 5px 15px;
}
h2 {
	padding-left: 35px;
	margin: 10px 0px;
	border: 1px solid #999;
}
ul {
	list-style-type: none;
	margin-left: 45px;
}
span.key {
	font-weight: bold;
}
div#contractor h2, div#client h2 {
	background-color: #bbc;
}
div#materials h2 {
	background-color: #66d9ff;
}
div#labors h2 {
	background-color: #33aacc;
}
div#totals h2 {
	background-color: #3388cc;
}
th, td {
	width: 10%;
}
th.description,
th.costs,
td.description,
td.materials,
td.labors,
td.grand-total {
	text-align: left;
	padding: 5px 0px;
	width: 70%;
	font-family: 'Arial';
	padding-left: 50px;
}
div#materials table, div#labors table, div#totals table {
	text-align: right;
	font-family: 'Courier';
	width: 100%;
}
		'''

	def __init__(self, event):
		self.event = event
		self.xml_bytes = None
		self.xml_string = None
		self.response = None

	def append_xml(self, root, loc, content):
		root.find(loc).append(content)

	def generate_xml(self):
		xml_base = E.html(
			E.head(
				E.title('McGraw Design & Build Invoice'),
				E.style(InvoiceReport.CSS)
			),
			E.body(
				E.div('', {'id': 'logo'}),
				E.h1('Project Details'),
			)
		)
		xml_contractor = Contractor(self.event['contractor']).generate()
		xml_client = Client(self.event['client']).generate()
		xml_materials = Materials(self.event['costs']['materials']).generate()
		xml_labors = Labors(self.event['costs']['labor']).generate()
		xml_totals = Totals(self.event['totals']).generate()
		self.append_xml(xml_base, './body', xml_contractor)
		self.append_xml(xml_base, './body', xml_client)
		self.append_xml(xml_base, './body', E.h1('Costs'))
		self.append_xml(xml_base, './body', xml_materials)
		self.append_xml(xml_base, './body', xml_labors)
		self.append_xml(xml_base, './body', xml_totals)
		return xml_base

	def generate_response(self):
		xml_etree = self.generate_xml()
		self.xml_bytes = etree.tostring(
			xml_etree,
			encoding = 'utf-8',
			method = 'xml',
			pretty_print = True,
			xml_declaration = True
		)
		self.xml_string = etree.tostring(
			xml_etree,
			encoding = 'utf-8',
			method = 'xml',
			pretty_print = True,
			xml_declaration = True
		).decode()
		response = {
			'statusCode': 200,
			'body': self.xml_string,
			'headers': {
				'Content-Type': 'text/html',
			},
		}
		self.response = response

	def to_file(self, uri):
		with open(uri, 'w', encoding='utf-8') as f:
			f.write(self.xml_string)


# class Section:

# 	def __init__(self, name, request):
# 		self.request = request
# 		self.response = etree.Element('div', {'id': name})

# 	def generate(self, instructions):
# 		header = etree.Element('div')
# 		body = etree.Element('div')
# 		footer = etree.Element('div')

# 	def append(self, loc, content):
# 		self.response.find(loc).append(content)


class Contractor:
	def __init__(self, contractor):
		self.contractor = contractor

	def append_xml(self, root, loc, content):
		root.find(loc).append(content)

	def generate(self):
		xml_contractor = E.div({'id': 'contractor'},
			E.h2('Contractor'),
			E.ul()
		)

		for key, value in self.contractor.items():
			if not value:
				value = ''
			tree = E.li(
				E.span(f'{key.capitalize()}:', {'class': 'key'}),
				E.span(value, {'class': 'value'})
			)
			self.append_xml(xml_contractor, './ul', tree)
		return xml_contractor


class Client:
	def __init__(self, client):
		self.client = client

	def append_xml(self, root, loc, content):
		root.find(loc).append(content)

	def generate(self):
		xml_client = E.div({'id': 'client'},
			E.h2('Client'),
			E.ul()
		)

		for key, value in self.client.items():
			if not value:
				value = ''
			tree = E.li(
				E.span(f'{key.capitalize()}:', {'class': 'key'}),
				E.span(value, {'class': 'value'})
			)
			self.append_xml(xml_client, './ul', tree)
		return xml_client


class Materials:
	def __init__(self, materials):
		self.materials = materials

	def append_xml(self, root, loc, content):
		root.find(loc).append(content)

	def generate(self):
		xml_materials = E.div({'id': 'materials'},
			E.h2('Materials'),
			E.table(
				E.thead(
					E.tr(
						E.th('Description', {'class': 'description'}),
						E.th('Quantity', {'class': 'quantity'}),
						E.th('Cost', {'class': 'cost'}),
						E.th('Total', {'class': 'total'}),
					)
				),
				E.tbody()
			)
		)

		for material in self.materials:
			description = material['invoice_expense_description']
			quantity = material['invoice_expense_adjustment']
			price = material['invoice_expense_price']
			total = price * quantity
			xml_material = E.tr(
				E.td(description, {'class': 'description'}),
				E.td(f'{quantity:.2f}', {'class': 'quantity'}),
				E.td(f'{price:.2f}', {'class': 'price'}),
				E.td(f'{total:.2f}', {'class': 'total'}),
			)
			self.append_xml(xml_materials, './table/tbody', xml_material)

		return xml_materials


class Labors:
	def __init__(self, labors):
		self.labors = labors

	def append_xml(self, root, loc, content):
		root.find(loc).append(content)

	def generate(self):
		xml_labors = E.div({'id': 'labors'},
			E.h2('labors'),
			E.table(
				E.thead(
					E.tr(
						E.th('Description', {'class': 'description'}),
						E.th('Quantity', {'class': 'quantity'}),
						E.th('Cost', {'class': 'cost'}),
						E.th('Total', {'class': 'total'}),
					)
				),
				E.tbody()
			)
		)

		for labor in self.labors:
			description = labor['invoice_time_description']
			quantity = labor['invoice_quantity']
			price = labor['invoice_unit_price']
			adjustment = labor['invoice_time_adjustment']
			price = price * adjustment
			total = price * quantity

			xml_labor = E.tr(
				E.td(description, {'class': 'description'}),
				E.td(f'{quantity:.2f}', {'class': 'quantity'}),
				E.td(f'{price:.2f}', {'class': 'price'}),
				E.td(f'{total:.2f}', {'class': 'total'}),
			)
			self.append_xml(xml_labors, './table/tbody', xml_labor)

		return xml_labors


class Totals:
		def __init__(self, totals):
			self.totals = totals

		def append_xml(self, root, loc, content):
			root.find(loc).append(content)

		def generate(self):
			xml_totals = E.div({'id': 'totals'},
				E.h2('Totals'),
				E.table(
					E.thead(
						E.tr(
							E.th('Cost Type', {'class': 'costs'}),
							E.th('Total'),
						)
					),
					E.tbody(
						E.tr(
							E.td('Materials', {'class': 'materials'}),
							E.td(self.totals['materials']),
						),
						E.tr(
							E.td('Labor', {'class': 'labors'}),
							E.td(self.totals['labor']),
						),
						E.tr(
							E.td('Grand Total', {'class': 'grand-total'}),
							E.td(self.totals['due']),
						),
					),
				)
			)
			return xml_totals
