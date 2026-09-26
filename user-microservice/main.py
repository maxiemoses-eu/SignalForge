from datetime import datetime
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse

app = FastAPI(title="user-service", version="1.0.0")
users = {}

@app.get("/healthz")
async def health():
    return {"status": "ok"}

@app.get("/readyz")
async def ready():
    return {"status": "ready"}

@app.get("/users")
async def list_users(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    items = list(users.values())
    return {
        "items": items[offset:offset+limit],
        "total": len(items),
        "limit": limit,
        "offset": offset,
    }

@app.get("/users/{user_id}")
async def get_user(user_id: str):
    user = users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/users")
async def create_user(data: dict):
    if not data.get("email") or "@" not in data.get("email", ""):
        raise HTTPException(status_code=400, detail="email is required and must be valid")
    if not data.get("name") or not str(data.get("name", "")).strip():
        raise HTTPException(status_code=400, detail="name is required")
    
    email = str(data["email"]).lower().strip()
    if any(u.get("email") == email for u in users.values()):
        raise HTTPException(status_code=409, detail="Email already registered")
    
    user_id = f"user-{len(users) + 1}"
    user = {
        "id": user_id,
        "name": str(data["name"]).strip(),
        "email": email,
        "role": data.get("role", "user"),
        "created_at": datetime.utcnow().isoformat(),
    }
    users[user_id] = user
    return user

@app.patch("/users/{user_id}")
async def update_user(user_id: str, data: dict):
    user = users.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "name" in data:
        if not isinstance(data["name"], str) or not data["name"].strip():
            raise HTTPException(status_code=400, detail="name must be non-empty string")
        user["name"] = data["name"].strip()
    
    if "role" in data:
        if data["role"] not in ("user", "admin"):
            raise HTTPException(status_code=400, detail="role must be user or admin")
        user["role"] = data["role"]
    
    user["updated_at"] = datetime.utcnow().isoformat()
    return user

@app.delete("/users/{user_id}", status_code=204)
async def delete_user(user_id: str):
    if user_id not in users:
        raise HTTPException(status_code=404, detail="User not found")
    del users[user_id]

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"message": exc.detail}},
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3002)
