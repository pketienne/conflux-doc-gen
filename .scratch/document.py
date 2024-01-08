from lxml import etree


class Document:

	@staticmethod
	def read(uri):
		with open(uri, 'r') as f:
			return f.read()

	def __init__(self, klass = 'document'):
		# try:
		# 	getattr(self, 'klass')
		# except AttributeError:
		# 	self.klass = 'document'
		# else:
		# 	self.klass = self.__class__.__name__.lower()

		self.klass = self.calculate_klass(klass)
		self.uri = self.calculate_uri()
		self.css = self.calculate_css()
		self.html = self.calculate_html()
		self.response = self.calculate_response()
		self.xpath = self.calculate_xpath()

	def calculate_klass(self, klass):
		if klass != 'document':
			return self.__class__.__name__.lower()
		return klass

	def calculate_uri(self):
		return f"src/{self.klass}/template"

	def calculate_css(self):
		return Document.read(f"{self.uri}.css")

	def calculate_html(self):
		return etree.parse(f"{self.uri}.html", None)

	def calculate_response(self):
		return {
			'statusCode': 200,
			'body': None,
			'headers': { 'Content-Type': 'text/html' },
		}

	def calculate_xpath(self):
		return f'//div[@id="{self.klass}"]'


	def klass
