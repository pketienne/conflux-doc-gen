import pytest

def test_klass_name(estimate):
	assert estimate.klass == 'estimate'

def test_html_class(estimate):
	assert type(estimate.html).__name__ == '_ElementTree'

def test_css_class(estimate):
	assert type(estimate.css).__name__ == 'str'

def test_response_class(estimate):
	assert type(estimate.response).__name__ == 'dict'

def test_uri_class(estimate):
	assert type(estimate.uri).__name__ == 'str'

def test_xpath_class(estimate):
	assert type(estimate.xpath).__name__ == 'str'

def test_css_non_empty(estimate):
	assert bool(estimate.css)

def test_css_content_not_document_only(document, estimate):
	assert document.css != estimate.css

def test_uri_content(estimate):
	assert estimate.uri == 'src/estimate/template'