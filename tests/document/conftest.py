import pytest
from src.document.classes import Document


@pytest.fixture
def document():
	return Document()