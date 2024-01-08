import pytest

def test_klass_name(document):
	assert document.klass == 'document'

def test_css_class(document):
	assert type(document.css).__name__ == 'str'

def test_html_class(document):
	assert type(document.html).__name__ == '_ElementTree'

def test_response_class(document):
	assert type(document.response).__name__ == 'dict'

def test_uri_class(document):
	assert type(document.uri).__name__ == 'str'

def test_xpath_class(document):
	assert type(document.xpath).__name__ == 'str'

def test_css_non_empty(document):
	assert bool(document.css)

def test_uri_content(document):
	assert document.uri == 'src/document/template'