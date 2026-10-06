def test_register_login_me(client):
    r = client.post("/api/auth/register", json={"name": "A", "email": "a@example.com", "password": "password123"})
    assert r.status_code == 201
    assert client.post("/api/auth/register", json={"name": "A", "email": "a@example.com", "password": "password123"}).status_code == 409
    login = client.post("/api/auth/login", json={"email": "a@example.com", "password": "password123"})
    token = login.json()["data"]["token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.json()["data"]["email"] == "a@example.com"
    bad = client.post("/api/auth/login", json={"email": "a@example.com", "password": "wrongpass1"})
    assert bad.status_code == 401 and bad.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_protected_routes(client):
    assert client.get("/api/chat/conversations").status_code == 401


def test_chat_flow_and_history(client, auth_headers):
    r = client.post("/api/chat/message", json={"text": "Hello"}, headers=auth_headers)
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["user_message"]["analysis"]["intent"]["intent"] == "greeting"
    cid = data["conversation"]["id"]
    client.post("/api/chat/message", json={"text": "Thanks!", "conversation_id": cid}, headers=auth_headers)
    detail = client.get(f"/api/chat/conversations/{cid}", headers=auth_headers).json()["data"]
    assert len(detail["messages"]) == 4
    assert client.patch(f"/api/chat/conversations/{cid}", json={"title": "Renamed"}, headers=auth_headers).json()["data"]["title"] == "Renamed"
    assert client.delete(f"/api/chat/conversations/{cid}", headers=auth_headers).status_code == 200
    assert client.get(f"/api/chat/conversations/{cid}", headers=auth_headers).status_code == 404


def test_validation(client, auth_headers):
    assert client.post("/api/chat/message", json={"text": ""}, headers=auth_headers).status_code == 422
    assert client.post("/api/chat/message", json={"text": "x" * 5000}, headers=auth_headers).status_code == 422


def test_analyze_endpoint(client, auth_headers):
    r = client.post("/api/analyze/text", json={"text": "The chatbot is very useful."}, headers=auth_headers)
    assert r.json()["data"]["sentiment"]["label"] == "positive"
