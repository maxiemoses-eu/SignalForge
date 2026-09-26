import pytest
from fastapi.testclient import TestClient
from main import app, users

@pytest.fixture
def client():
    users.clear()
    return TestClient(app)

def test_health(client):
    assert client.get("/healthz").status_code == 200

def test_ready(client):
    assert client.get("/readyz").status_code == 200

def test_list_empty(client):
    res = client.get("/users")
    assert res.status_code == 200
    assert res.json()["total"] == 0

def test_create_user(client):
    res = client.post("/users", json={"name": "Alice", "email": "alice@example.com"})
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Alice"
    assert data["email"] == "alice@example.com"

def test_get_user(client):
    client.post("/users", json={"name": "Bob", "email": "bob@example.com"})
    res = client.get("/users/user-1")
    assert res.status_code == 200
    assert res.json()["email"] == "bob@example.com"

def test_update_user(client):
    client.post("/users", json={"name": "Carol", "email": "carol@example.com"})
    res = client.patch("/users/user-1", json={"name": "Carol Smith", "role": "admin"})
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Carol Smith"
    assert data["role"] == "admin"

def test_delete_user(client):
    client.post("/users", json={"name": "Dave", "email": "dave@example.com"})
    assert client.delete("/users/user-1").status_code == 204
    assert client.get("/users/user-1").status_code == 404

def test_duplicate_email(client):
    client.post("/users", json={"name": "Eve", "email": "eve@example.com"})
    res = client.post("/users", json={"name": "Eve2", "email": "eve@example.com"})
    assert res.status_code == 409

def test_invalid_email(client):
    res = client.post("/users", json={"name": "X", "email": "notanemail"})
    assert res.status_code == 400

def test_missing_name(client):
    res = client.post("/users", json={"email": "test@example.com"})
    assert res.status_code == 400
