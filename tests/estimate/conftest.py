import pytest
from src.document.classes import Document
from src.estimate.classes import Estimate


@pytest.fixture
def document():
	return Document()

@pytest.fixture
def estimate():
	return Estimate()