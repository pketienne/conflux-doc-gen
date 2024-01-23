from abc import ABC, abstractmethod
from lxml import etree
from lxml.builder import E

class EstimateReport:
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
div#tasks h2 {
	background-color: #33aacc;
}
div#totals h2 {
	background-color: #3388cc;
}
td.cost-code, td.task-name, td.description, td.quantity, td.cost, td.tax, td.markup {
	padding: 0px 20px;
}
td.task-name {
	width: 60%;
}
/*
tr:nth-child(odd) {
	background-color: #eee
}
tr.leaf {
	background-color: fcf;
}
*/
tr.non-leaf {
	background-color: #caeac6;
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
#tasks th.task-name, #tasks td.task-name {
	text-align: left;
}
div#materials table, div#labors table, div#totals table, div#tasks table {
	text-align: right;
	font-family: 'Courier';
	width: 100%;
}
		'''

	def __init__(self, event):
		self.event = event
		self.sections = None
		self.etree = None
		self.response = {}

	def generate(self):
		report = Report()
		sections = {
			'client': Client('client', self.event['client']),
			'contractor': Contractor('contractor', self.event['contractor']),
			'tasks': Tasks('tasks', self.event['tasks']),
		}

		for _, value in sections.items():
			value.generate()

		self.etree = report.etree

		for _, value in sections.items():
			self.append(f'./body', value.etree)

		self.to_file(f'dest/{self.__class__.__name__}.html')

		return self.response
	
	def append(self, loc, content):
		self.etree.find(loc).append(content)

	def to_response(self):
		etree_bytes = etree.tostring(
			self.etree,
			encoding = 'utf-8',
			method = 'xml',
			pretty_print = True,
			xml_declaration = True,
		)
		self.response = {
			'statusCode': 200,
			'body': etree_bytes,
			'headers': {
				'Content-Type': 'text/html',
			},
		}

	def to_file(self, uri):
		etree_string = etree.tostring(
			self.etree,
			encoding = 'utf-8',
			method = 'xml',
			pretty_print = True,
			xml_declaration = True,
		).decode()
		with open(uri, 'w', encoding='utf-8') as f:
			f.write(etree_string)


class Report():
	def __init__(self):
		self.etree = E.html(
			E.head(
				E.title('McGraw Design & Build'),
				E.style(EstimateReport.CSS),
			),
			E.body(
				E.div('', {'id': 'logo'}),
				E.h1('Project Details'),
			),
		)


class Section(ABC):
	def __init__(self, name=None, content=None):
		self.content = content
		self.etree = etree.Element('div', {'id': name})

	@abstractmethod
	def generate(self):
		pass


class Contractor(Section):
	def generate(self):
		self.etree.find('.').append(E.h2(f'{self.__class__.__name__}'))
		self.etree.find('.').append(E.ul())

		for key, value in self.content.items():
			if not value:
				value = ''
			tree = E.li(
				E.span(f'{key.capitalize()}:', {'class': 'key'}),
				E.span(value, {'class': 'value'})
			)
			self.etree.find('./ul').append(tree)


class Client(Section):
	def generate(self):
		self.etree.find('.').append(E.h2(f'{self.__class__.__name__}'))
		self.etree.find('.').append(E.ul())

		for key, value in self.content.items():
			if not value:
				value = ''
			tree = E.li(
				E.span(f'{key.capitalize()}:', {'class': 'key'}),
				E.span(value, {'class': 'value'})
			)
			self.etree.find('./ul').append(tree)

		pass


class Materials(Section):
	def generate(self):
		self.etree.find('.').append(E.h2(f'{self.__class__.__name__}'))
		self.etree.find('.').append(
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

		for content in self.content:
			description = content['invoice_expense_description']
			quantity = content['invoice_expense_adjustment']
			price = content['invoice_expense_price']
			total = price * quantity

			etree = E.tr(
				E.td(description, {'class': 'description'}),
				E.td(f'{quantity:.2f}', {'class': 'quantity'}),
				E.td(f'{price:.2f}', {'class': 'price'}),
				E.td(f'{total:.2f}', {'class': 'total'}),
			)

			self.etree.find('./table/tbody').append(etree)


class Labors(Section):
	def generate(self):
		self.etree.find('.').append(E.h2(f'{self.__class__.__name__}'))
		self.etree.find('.').append(
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

		for content in self.content:
			description = content['invoice_time_description']
			quantity = content['invoice_quantity']
			price = content['invoice_unit_price']
			adjustment = content['invoice_time_adjustment']
			price = price * adjustment
			total = price * quantity

			etree = E.tr(
				E.td(description, {'class': 'description'}),
				E.td(f'{quantity:.2f}', {'class': 'quantity'}),
				E.td(f'{price:.2f}', {'class': 'price'}),
				E.td(f'{total:.2f}', {'class': 'total'}),
			)

			self.etree.find('./table/tbody').append(etree)


class Totals(Section):
	def generate(self):
		self.etree.find('.').append(E.h2(f'{self.__class__.__name__}'))
		self.etree.find('.').append(
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
						E.td(self.content['materials']),
					),
					E.tr(
						E.td('Labor', {'class': 'labors'}),
						E.td(self.content['labor']),
					),
					E.tr(
						E.td('Grand Total', {'class': 'grand-total'}),
						E.td(self.content['due']),
					),
				),
			)
		)


class Tasks(Section):
	def generate(self):
		self.etree.find('.').append(E.h2(f'{self.__class__.__name__}'))
		self.etree.find('.').append(
			E.table(
				E.thead(
					E.tr(
						E.th('Cost Code', {'class': 'cost-code'}),
						E.th('Task Name', {'class': 'task-name'}),
						E.th('Description', {'class': 'description'}),
						E.th('Quantity', {'class': 'quantity'}),
						E.th('Cost', {'class': 'cost'}),
						E.th('Tax', {'class': 'tax'}),
						E.th('Markup', {'class': 'markup'}),
					)
				),
				E.tbody()
			)
		)

		length = len(self.content['url'])
		tasks = []
		for i in range(length):
			task = {
				'cost_code': f'{self.content['combinedCostCode'][i]}',
				'name': f'{self.content['task_name'][i]}',
				'description': f'{self.content['task_description'][i]}',
			}
			if self.content['idtasks_leaves'][i]:
				task['quantity'] = f'{self.content['item_quantity'][i]}'
				task['cost'] = f'{self.content['item_cost'][i]}'
				task['tax'] = f'{self.content['item_tax'][i]}'
				task['markup'] = f'{self.content['item_markup'][i]}'
				task['leaf'] = True
			else:
				task['quantity'], task['cost'], task['tax'], task['markup'] = '','','',''
				task['leaf'] = False
			tasks.append(task)
		tasks.sort(key=lambda x: x['cost_code'])

		for task in tasks:
			if task['leaf']:
				tr_class = 'leaf'
			else:
				tr_class = 'non-leaf'

			etree = E.tr({'class': tr_class},
				E.td(task['cost_code'], {'class': 'cost-code'}),
				E.td(task['name'], {'class': 'task-name'}),
				E.td(task['description'], {'class': 'description'}),
				E.td(task['quantity'], {'class': 'quantity'}),
				E.td(task['cost'], {'class': 'cost'}),
				E.td(task['tax'], {'class': 'tax'}),
				E.td(task['markup'], {'class': 'markup'}),
			)

			self.etree.find('./table/tbody').append(etree)
