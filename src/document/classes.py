import copy
from lxml import etree


class Document:

	#TODO: https://levelup.gitconnected.com/design-patterns-in-python-factory-pattern-beea1da31c17

	#TODO: https://python-patterns.guide/gang-of-four/factory-method/

	def foo(self):
		self.klass = self.calculate_klass()
		self.xpath = self.calculate_xpath()
		self.css = self.calculate_css()
		self.html = self.calculate_html()
		self.body = self.calculate_body()
		self.response = self.calculate_response()
		
		pass

	def __init__(self):
		self.klass = None
		self.xpath = None
		self.css = None
		self.html = None
		self.body = None
		self.response = None
		self.foo()

	# def calculate_klass(self, klass = 'document'):
	# 	return klass

	# def calculate_xpath(self):
	# 	return f'//div[@id="{self.klass}"]'

	# def calculate_css(self):
	# 	return Document.read(f'src/{self.klass}/template.css')

	# def calculate_html(self):
	# 	return etree.parse(f"src/{self.klass}/template.html", None)
	
	# def calculate_body(self):
	# 	body = copy.deepcopy(self.html)
	# 	body.find('./head/style').text = self.css
	# 	return body

	# def calculate_response(self):
	# 	return {
	# 		'statusCode': 200,
	# 		'body': self.body,
	# 		'headers': { 'Content-Type': 'text/html' },
	# 	}

	# @staticmethod
	# def read(uri):
	# 	with open(uri, 'r') as f:
	# 		return f.read()

	# @staticmethod
	# def write(uri, content):
	# 	pass

	# def to_string(self):
	# 	print(self.response)

	# def to_file(self):
	# 	Document.write(f"src/{self.klass}/output.html", self.body)