from flask import Flask, request, jsonify
import bcrypt
import jwt
import datetime
import os

app = Flask(__name__)
SECRET_KEY = os.environ.get("JWT_SECRET", "dev-secret")

users = {}

@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok"}, 200

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    password = data["password"].encode()
    hashed = bcrypt.hashpw(password, bcrypt.gensalt())
    users[data["username"]] = hashed
    return jsonify(message="registered"), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    user = users.get(data["username"])
    if not user or not bcrypt.checkpw(data["password"].encode(), user):
        return jsonify(message="invalid credentials"), 401

    token = jwt.encode(
        {
            "sub": data["username"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        },
        SECRET_KEY,
        algorithm="HS256"
    )
    return jsonify(token=token), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
