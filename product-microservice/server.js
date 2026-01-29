const express = require("express");
const app = express();

app.use(express.json());

let products = [
  { id: 1, name: "Laptop", price: 1000 }
];

app.get("/health", (_, res) => res.json({ status: "ok" }));
app.get("/products", (_, res) => res.json(products));

app.post("/products", (req, res) => {
  products.push(req.body);
  res.status(201).json(req.body);
});

const server = app.listen(5001);

process.on("SIGTERM", () => server.close());
