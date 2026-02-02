import os
import requests
from flask import Flask, render_template, jsonify
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)

# Gateway Contract Alignment
GATEWAY_URL = os.getenv("REACT_APP_API_URL", "http://backend-gateway:8080/api")

@app.route('/')
def shop():
    products = []
    try:
        # 2-second timeout prevents hanging the UI if Gateway is down
        response = requests.get(f"{GATEWAY_URL}/products", timeout=2)
        if response.status_code == 200:
            products = response.json()
    except Exception:
        app.logger.error("Gateway Microservice unreachable")
    
    return render_template('shop.html', products=products)

@app.route('/checkout', methods=['POST'])
def checkout():
    # Atomic API response for the frontend
    return jsonify({"message": "Order placed successfully!"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)