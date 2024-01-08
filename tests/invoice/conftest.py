import pytest
from src.document.classes import Document
from src.invoice.classes import Invoice


@pytest.fixture
def document():
	return Document()

@pytest.fixture
def invoice():
	return Invoice()