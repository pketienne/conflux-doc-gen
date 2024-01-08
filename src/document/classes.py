from lxml import etree


class Document:

	@staticmethod
	def read(uri):
		with open(uri, 'r') as f:
			return f.read()

	def __init__(self):
		try:
			getattr(self, 'klass')
		except AttributeError:
			self.klass = 'document'
			self.calculate_klass()
			self.__init__()
		else:
			self.klass = self.__class__.__name__.lower()
			self.calculate_klass()

	def calculate_klass(self):
			self.calculate_uri()
			self.calculate_xpath()
			self.calculate_html()
			self.calculate_css()
	
	def calculate_uri(self):
		self.uri = f"src/{self.klass}/template"

	def calculate_xpath(self):
		self.xpath = f'//div[@id="{self.klass}"]'

	def calculate_css(self):
		css = Document.read(f"{self.uri}.css")
		try:
			getattr(self, 'css')
		except AttributeError:
			self.css = css
		else:
			self.css = f"{self.css}\n{css}"

	def calculate_html(self):
		html = etree.parse(f"{self.uri}.html", None)
		try:
			getattr(self, 'html')
		except AttributeError:
			self.html = html
		else:
			self.html.xpath(self.xpath).append(html)

	def calculate_response(self):
		# body = None # combine html & css
		self.response = {
			'statusCode': 200,
			'body': self,
			'headers': { 'Content-Type': 'text/html' },
		}
