module.exports = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Método no permitido" });

  const { cart, total } = req.body || {};
  if (!Array.isArray(cart) || typeof total !== "number") {
    return res.status(400).json({ ok: false, message: "Datos inválidos" });
  }

  const orderId = Date.now();
  res.status(201).json({ ok: true, orderId });
};
