from lxml import etree


class Document:

	@staticmethod
	def read(uri):
		with open(uri, 'r') as f:
			return f.read()

	def __init__(self):
		self.klass = None
		self.uri = None
		self.xpath = None
		self.html = None
		self.css = None
		self.response = None

		if not self.klass:
			self.klass = 'document'
			self.__init__()

	@property
	def klass(self):
		return self._klass

	@klass.setter
	def klass(self, value):
		self._klass = value
	
	@property
	def uri(self):
		return self._uri

	@uri.setter
	def uri(self, value):
		self._uri = value

	@property
	def xpath(self):
		return self._xpath

	@xpath.setter
	def xpath(self, value):
		self._xpath = value

	@property
	def html(self):
		return self._html

	@html.setter
	def html(self, value):
		self._html = value

	@property
	def css(self):
		return self._css

	@css.setter
	def css(self, value):
		self._css = value

	@property
	def response(self):
		return self._response

	@response.setter
	def response(self):
		self._response = {
			'statusCode': 200,
			'body': self.,
			'headers': { 'Content-Type': 'text/html' },
		}

		# self.uri = f"src/{self.klass}/template"
		# self.xpath = f'//div[@id="{self.klass}"]'
		# self.css = Document.read(f"{self.uri}.css")
		# self.html = etree.parse(f"{self.uri}.html", None)

