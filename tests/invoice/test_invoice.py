import pytest

def test_klass_name(invoice):
	assert invoice.klass == 'invoice'

def test_html_class(invoice):
	assert type(invoice.html).__name__ == '_ElementTree'

def test_css_class(invoice):
	assert type(invoice.css).__name__ == 'str'

def test_response_class(invoice):
	assert type(invoice.response).__name__ == 'dict'

def test_uri_class(invoice):
	assert type(invoice.uri).__name__ == 'str'

def test_xpath_class(invoice):
	assert type(invoice.xpath).__name__ == 'str'

def test_css_non_empty(invoice):
	assert bool(invoice.css)

def test_css_content_not_document_only(document, invoice):
	assert document.css != invoice.css

def test_uri_content(invoice):
	assert invoice.uri == 'src/invoice/template'