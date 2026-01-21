from app import app

def test_register_login():
    client = app.test_client()
    r = client.post("/register", json={"username": "moses", "password": "pass"})
    assert r.status_code == 201

    r = client.post("/login", json={"username": "moses", "password": "pass"})
    assert r.status_code == 200
