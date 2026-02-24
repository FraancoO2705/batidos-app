const express = require("express");
const { Pool } = require("pg");

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");


// ===== CONEXIÓN POSTGRESQL =====
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  //connectionString: "postgresql://batidos_user:fFQKj1X143QH6dpedgTfjefTmXmntzLu@dpg-d6eqb4n5r7bs73chpol0-a.oregon-postgres.render.com/batidos",
  ssl: { rejectUnauthorized: false }
});

pool.connect()
  .then(() => console.log("✅ Conectado a PostgreSQL"))
  .catch(err => console.error("❌ Error conexión DB:", err));

// ===== PRODUCTOS =====
const productos = [
  { id: 1, nombre: "Batido Proteico Chocolate", precio: 12, imagen: "/images/batido_chocolate.jpg" },
  { id: 2, nombre: "Batido Proteico Fresa", precio: 12, imagen: "/images/batido_cookies.jpg" },
  { id: 3, nombre: "Batido Proteico Cookies", precio: 12, imagen: "/images/batido_cookies.jpg" },
  { id: 4, nombre: "Batido Proteico ChocoAvellana", precio: 12, imagen: "/images/batido_chocolate.jpg" },

  { id: 5, nombre: "Wafle Acevichado", precio: 10, imagen: "/images/acevichado.jpeg" },
  { id: 6, nombre: "Wafle Dulce", precio: 10, imagen: "/images/dulce.jpeg" },
  { id: 7, nombre: "Wafle Sandwich", precio: 13, imagen: "/images/sandwich.jpeg" },
  { id: 8, nombre: "Wafle Pizza Americana", precio: 13, imagen: "/images/pizza.jpeg" },
  { id: 9, nombre: "Wafle Pizza Hawaiana", precio: 15, imagen: "/images/pizzahawaiana.jpeg" },

  { id: 10, nombre: "Te", precio: 6, imagen: "/images/fibra.jpeg" },
  { id: 11, nombre: "Aloe", precio: 6, imagen: "/images/fibra.jpeg" },
  { id: 12, nombre: "Fibra", precio: 6, imagen: "/images/drive.jpeg" },
  { id: 13, nombre: "Drive", precio: 6, imagen: "/images/drive.jpeg" },
  { id: 14, nombre: "Chupapanza", precio: 15, imagen: "/images/chupapanza.jpeg" },

  { id: 15, nombre: "Ensalada de Frutas", precio: 12, imagen: "/images/ensaladafrutas.jpeg" },
  { id: 16, nombre: "ShawarmaFit", precio: 15, imagen: "/images/shawarmapollo.jpeg" }
];


// ===== PEDIDO EN MEMORIA =====
let pedidoActual = [];


// ===== MENU =====
app.get("/", (req, res) => {
  const totalItems = pedidoActual.reduce((acc, p) => acc + p.cantidad, 0);
  res.render("menu", { productos, pedidoActual, totalItems });
});


// ===== AGREGAR PRODUCTO =====
app.post("/agregar", (req, res) => {
  const id = parseInt(req.body.id);
  const prod = productos.find(p => p.id === id);

  const existente = pedidoActual.find(p => p.id === id);

  if (existente) existente.cantidad++;
  else pedidoActual.push({ ...prod, cantidad: 1 });

  res.redirect("/");
});


// ===== ELIMINAR ITEM =====
app.post("/eliminar-item", (req, res) => {
  const id = parseInt(req.body.id);
  pedidoActual = pedidoActual.filter(p => p.id !== id);
  res.redirect("/pedido");
});


// ===== VACIAR PEDIDO =====
app.post("/vaciar", (req, res) => {
  pedidoActual = [];
  res.redirect("/pedido");
});


// ===== VER PEDIDO =====
app.get("/pedido", (req, res) => {
  const total = pedidoActual.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  res.render("pedido", { pedidoActual, total });
});


// ===== CONFIRMAR VENTA =====
app.post("/confirmar", async (req, res) => {

  const fechaLocal = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'America/Lima'
  });

  const horaLocal = new Date().toLocaleTimeString('en-GB', {
    timeZone: 'America/Lima'
  });

  await pool.query(
    "INSERT INTO ventas (fecha, hora, items) VALUES ($1,$2,$3)",
    [fechaLocal, horaLocal, JSON.stringify(pedidoActual)]
  );

  pedidoActual = [];
  res.redirect("/ventas");
});


// ===== VER VENTAS =====
app.get("/ventas", async (req, res) => {

  const fechaSeleccionada =
    req.query.fechaInput ||
    new Date().toLocaleDateString('sv-SE', {
      timeZone: 'America/Lima'
    });

  const result = await pool.query(
    "SELECT * FROM ventas WHERE fecha = $1 ORDER BY id",
    [fechaSeleccionada]
  );

  const ventas = result.rows.map(v => ({
    ...v,
    items: typeof v.items === "string" ? JSON.parse(v.items) : v.items
  }));

  let totalDia = 0;

  ventas.forEach(v => {
    v.items.forEach(i => {
      totalDia += i.precio * i.cantidad;
    });
  });

  res.render("ventas", {
    ventas,
    totalDia,
    hoy: fechaSeleccionada
  });
});


// ===== SERVIDOR =====
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo en puerto " + PORT);
});