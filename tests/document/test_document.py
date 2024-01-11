import pytest
import re
from lxml import etree

#! Utilities

def has_attribute(klass, attribute):
	try:
		getattr(klass, attribute)
	except AssertionError as exc:
		assert False, f"'has_attribute' raised an exception {exc}"

# def has_method(klass, method):
# 	callable(has_attribute(klass, method))

#! Test Methods

# def test_has_method_calculate_klass(document):
# 	has_method(document, 'calculate_klass')

# def test_has_method_calculate_xpath(document):
# 	has_method(document, 'calculate_xpath')

# def test_has_method_calculate_css(document):
# 	has_method(document, 'calculate_css')

# def test_has_method_calculate_html(document):
# 	has_method(document, 'calculate_html')

# def test_has_method_calculate_body(document):
# 	has_method(document, 'calculate_body')

# def test_has_method_calculate_response(document):
# 	has_method(document, 'calculate_response')

# def test_has_method_read(document):
# 	has_method(document, 'read')

# def test_has_method_write(document):
# 	has_method(document, 'write')

# def test_has_method_to_string(document):
# 	has_method(document, 'to_string')

# #! Test Attributes

def test_has_attribute_klass(document):
	has_attribute(document, 'klass')

def test_has_attribute_xpath(document):
	has_attribute(document, 'xpath')

def test_has_attribute_css(document):
	has_attribute(document, 'css')

def test_has_attribute_html(document):
	has_attribute(document, 'html')

def test_has_attribute_body(document):
	has_attribute(document, 'body')

def test_has_attribute_response(document):
	has_attribute(document, 'response')

# #! Test Content

# def test_attribute_klass_content(document):
# 	assert document.klass == 'document'

# def test_attribute_xpath_content(document):
# 	assert document.xpath == '//div[@id="document"]'

# def test_attribute_css_content(document):
# 	assert document.css.startswith('body { margin: 20px 50px; }')

# def test_attribute_html_content(document):
# 	first_line = '<?xml version="1.0" encoding="utf-8"?>'
# 	html_string = etree.tostring(document.html, method="c14n").decode('utf-8')
# 	assert not re.match(rf"^{first_line}", html_string)

# def test_attribute_style_content(document):
# 	style = document.body.find('./head/style').text
# 	assert style.startswith('body { margin: 20px 50px; }')

# #! Test Class

# def test_attribute_html_content_class(document):
# 	assert type(document.html).__name__ == '_ElementTree'

# def test_attribute_body_content_class(document):
# 	assert type(document.response['body']).__name__ == 'str'