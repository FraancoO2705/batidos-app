const express = require("express");
const fs = require("fs");
const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

/* ===== PRODUCTOS ===== */
const productos = [
  { id: 1, nombre: "Batido Proteico Chocolate", precio: 12 },
  { id: 2, nombre: "Batido Proteico Fresa", precio: 12 },
  { id: 3, nombre: "Batido Proteico Cookies", precio: 12 },
  { id: 4, nombre: "Batido Proteico ChocoAvellana", precio: 12 },
  { id: 5, nombre: "Wafle Acevichado", precio: 10 },
  { id: 6, nombre: "Wafle Dulce", precio: 10 },
  { id: 7, nombre: "Wafle Sandwwich", precio: 13 },
  { id: 8, nombre: "Wafle Pizza Americana", precio: 13 },
  { id: 9, nombre: "Wafle Pizza Hawaiana", precio: 15 }
];

let pedidoActual = [];

/* ===== FUNCIONES JSON ===== */

function leerVentas() {
  try {
    const data = fs.readFileSync("ventas.json");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function guardarVentas(ventas) {
  fs.writeFileSync("ventas.json", JSON.stringify(ventas, null, 2));
}

/* ===== MENU ===== */
app.get("/", (req, res) => {

  const totalItems = pedidoActual.reduce((acc, p) => acc + p.cantidad, 0);

  res.render("menu", { productos, pedidoActual, totalItems });
});

/* agregar producto */
app.post("/agregar", (req, res) => {
  const id = parseInt(req.body.id);
  const prod = productos.find(p => p.id === id);

  const existente = pedidoActual.find(p => p.id === id);

  if (existente) existente.cantidad++;
  else pedidoActual.push({ ...prod, cantidad: 1 });

  res.redirect("/");
});

app.post("/eliminar-item", (req, res) => {
  const id = parseInt(req.body.id);
  pedidoActual = pedidoActual.filter(p => p.id !== id);
  res.redirect("/pedido");
});

app.post("/vaciar", (req, res) => {
  pedidoActual = [];
  res.redirect("/pedido");
});

/* ===== PEDIDO ===== */
app.get("/pedido", (req, res) => {
  const total = pedidoActual.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  res.render("pedido", { pedidoActual, total });
});

/* confirmar venta */
app.post("/confirmar", (req, res) => {

  const ventas = leerVentas();

/*   const hoy = new Date();
  const fechaLocal = hoy.getFullYear() + "-" +
  String(hoy.getMonth()+1).padStart(2,"0") + "-" +
  String(hoy.getDate()).padStart(2,"0"); */

  const fechaLocal = new Date().toLocaleDateString('sv-SE', {
  timeZone: 'America/Lima'
});

ventas.push({
  fecha: fechaLocal,
  items: pedidoActual
});

  guardarVentas(ventas);
  pedidoActual = [];

  res.redirect("/ventas");
});

/* ===== VER VENTAS ===== */
app.get("/ventas", (req, res) => {

  const todas = leerVentas();

  // si no eligen fecha → usar hoy
const fechaSeleccionada =
  req.query.fechaInput ||
  new Date().toLocaleDateString('sv-SE', {
    timeZone: 'America/Lima'
  });

  const ventas = todas.filter(v => v.fecha === fechaSeleccionada);

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

/* ===== SERVIDOR ===== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("Servidor corriendo en puerto " + PORT);
});