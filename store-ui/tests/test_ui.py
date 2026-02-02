import pytest
import responses
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@responses.activate
def test_ui_renders_products_correctly(client):
    # Mocking the Gateway response for SignalForge
    responses.add(
        responses.GET,
        "http://backend-gateway:8080/api/products",
        json=[{"name": "Secure Microservice", "price": 150}],
        status=200
    )

    res = client.get('/')
    assert res.status_code == 200
    assert b"Secure Microservice" in res.data
    assert b"Products" in res.data