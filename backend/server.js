// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());            
app.use(express.json());
app.use(express.static("."));

// ===== Database =====
const DB_FILE = path.join(__dirname, "ranahan.db");
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) console.error("DB Error:", err.message);
  else console.log("✅ Connected to SQLite");
});

// ===== Create tables if not exist =====
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    desc TEXT,
    date TEXT,
    status TEXT,
    image TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    englishName TEXT,
    desc TEXT,
    type TEXT,
    price REAL,
    image TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId TEXT,
    product TEXT,
    amount TEXT,
    salesChannel TEXT,
    remaining INTEGER,
    status TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staffId TEXT,
    fname TEXT,
    lname TEXT,
    email TEXT,
    contact TEXT,
    priority TEXT,
    image TEXT,
    workDays TEXT,
    shiftTime TEXT
  )`);

  // ✅ tables สำหรับสถานะโต๊ะ
  db.run(`CREATE TABLE IF NOT EXISTS tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number TEXT UNIQUE,
    seats INTEGER NOT NULL DEFAULT 6,
    status TEXT NOT NULL DEFAULT 'Available'
  )`);

  // ✅ bookings (ต้องเป็น INTEGER เหมือน seed.sql)
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  table_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  people INTEGER NOT NULL,
  comment TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

    // ORDERS (normalized)
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_no TEXT,
    total REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    menu_id INTEGER,
    name TEXT,
    price REAL,
    qty INTEGER,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  )`);

});

// ===== Auto-seed จาก seed.sql เมื่อว่าง =====
function autoSeedIfEmpty() {
  return new Promise((resolve) => {
    db.get("SELECT COUNT(*) AS c FROM menu", (err, row) => {
      if (err) { console.error("COUNT menu error:", err); return resolve(); }
      if (row && row.c > 0) return resolve(); // มีเมนูแล้ว ข้าม

      // ไม่มีเมนู → อ่าน seed.sql แล้ว exec
      try {
        const sql = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
        db.exec(sql, (e) => {
          if (e) console.error("Seeding error (seed.sql):", e);
          else console.log("🌱 Seeded from seed.sql");
          resolve();
        });
      } catch (readErr) {
        console.error("Read seed.sql error:", readErr);
        resolve();
      }
    });
  });
}

// ===== Seed สต็อกตัวอย่างถ้าว่าง =====
function seedStockIfEmpty() {
  db.get("SELECT COUNT(*) AS c FROM stock", (err, row) => {
    if (err) return console.error("COUNT stock error:", err);
    if (row && row.c > 0) return console.log("ℹ️ Stock already has data");
    console.log("🌱 Seeding sample stock...");
    const stmt = db.prepare(
      "INSERT INTO stock (orderId, product, amount, salesChannel, remaining, status) VALUES (?,?,?,?,?,?)"
    );
    [
      ["OD-1001", "Beef",       "5 kg",  "Dine-in",  85, "High"],
      ["OD-1002", "Pork",       "3 kg",  "Delivery", 60, "High"],
      ["OD-1003", "Chicken",    "2 kg",  "Takeaway", 18, "Low"],
      ["OD-1004", "Thai Chili", "1 kg",  "Dine-in",  12, "Low"],
      ["OD-1005", "Rice",       "20 kg", "Delivery", 75, "High"],
    ].forEach(r => stmt.run(r));
    stmt.finalize(() => console.log("✅ Seeded sample stock"));
  });
}

// เรียก seed ตอนเริ่ม
// เรียกตอนสตาร์ท
autoSeedIfEmpty().then(() => {
  // เรียก seed stock ต่อได้เลย (กันกรณี seed.sql ไม่มีตัวอย่าง stock)
  seedStockIfEmpty();
});

app.use((req,res,next)=>{ console.log(req.method, req.url); next(); });

// ===== API: Users =====
app.post("/api/register", (req, res) => {
  const { username, password, role } = req.body;
  db.run(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    [username, password, role || "customer"],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: "Invalid credentials" });
      res.json(row);
    }
  );
});

app.get("/api/users", (req, res) => {
  db.all("SELECT id, username, role FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put("/api/users/:id/role", (req, res) => {
  const { role } = req.body;
  db.run("UPDATE users SET role=? WHERE id=?", [role, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.delete("/api/users/:id", (req, res) => {
  db.run("DELETE FROM users WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// ===== Promotions API =====
app.get("/api/promotions", (req, res) => {
  db.all("SELECT * FROM promotions", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/promotions", (req, res) => {
  const { name, desc, image, date, status } = req.body;
  db.run(
    "INSERT INTO promotions (name, desc, image, date, status) VALUES (?,?,?,?,?)",
    [name, desc, image, date, status],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.get("/api/promotions/:id", (req, res) => {
  db.get("SELECT * FROM promotions WHERE id=?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

app.put("/api/promotions/:id", (req, res) => {
  const { name, desc, image, date, status } = req.body;
  db.run(
    "UPDATE promotions SET name=?, desc=?, image=?, date=?, status=? WHERE id=?",
    [name, desc, image, date, status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, updated: this.changes });
    }
  );
});

app.delete("/api/promotions/:id", (req, res) => {
  db.run("DELETE FROM promotions WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// ===== API: Menu =====
app.get("/api/menu", (req, res) => {
  db.all("SELECT * FROM menu", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/menu/:id", (req, res) => {
  db.get("SELECT * FROM menu WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Menu not found" });
    res.json(row);
  });
});

app.post("/api/menu", (req, res) => {
  const { englishName, desc, type, price, image } = req.body;
  db.run(
    "INSERT INTO menu (englishName, desc, type, price, image) VALUES (?,?,?,?,?)",
    [englishName, desc || "", type, price, image || ""],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.put("/api/menu/:id", (req, res) => {
  const { englishName, desc, type, price, image } = req.body;
  db.run(
    "UPDATE menu SET englishName=?, desc=?, type=?, price=?, image=? WHERE id=?",
    [englishName, desc || "", type, price, image || "", req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, updated: this.changes });
    }
  );
});

app.delete("/api/menu/:id", (req, res) => {
  db.run("DELETE FROM menu WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// ===== API: Stock =====
app.get("/api/stock", (req, res) => {
  db.all("SELECT * FROM stock", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/stock", (req, res) => {
  const { orderId, product, amount, salesChannel, remaining } = req.body;
  const status = Number(remaining) < 20 ? "Low" : "High";
  db.run(
    "INSERT INTO stock (orderId, product, amount, salesChannel, remaining, status) VALUES (?,?,?,?,?,?)",
    [orderId, product, amount, (salesChannel || ''), remaining, status],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.delete("/api/stock/:id", (req, res) => {
  db.run("DELETE FROM stock WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

// ===== API: Tables (สำหรับ Staff Table Status + สะท้อนจอง) =====
app.get('/api/tables', (req, res) => {
  db.all('SELECT id, table_number, seats, status FROM tables ORDER BY id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows || []);
  });
});

app.put('/api/tables/:id/status', (req, res) => {
  const id = req.params.id;
  const { status } = req.body || {};
  const allowed = ['Available', 'Unavailable', 'Reserved'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  db.run('UPDATE tables SET status=? WHERE id=?', [status, id], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ updated: this.changes });
  });
});

// ===== STAFF =====
app.get("/api/staff", (req, res) => {
  db.all("SELECT * FROM staff", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/staff/:id", (req, res) => {
  db.get("SELECT * FROM staff WHERE id=?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

app.post("/api/staff", (req, res) => {
  const { staffId, fname, lname, email, contact, priority, image, workDays, shiftTime } = req.body;
  db.run(
    "INSERT INTO staff (staffId,fname,lname,email,contact,priority,image,workDays,shiftTime) VALUES (?,?,?,?,?,?,?,?,?)",
    [staffId, fname, lname, email, contact, priority, image, workDays, shiftTime],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.put("/api/staff/:id", (req, res) => {
  const { fname, lname, email, contact, priority, image, workDays, shiftTime } = req.body;
  db.run(
    "UPDATE staff SET fname=?,lname=?,email=?,contact=?,priority=?,image=?,workDays=?,shiftTime=? WHERE id=?",
    [fname, lname, email, contact, priority, image, workDays, shiftTime, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

app.delete("/api/staff/:id", (req, res) => {
  db.run("DELETE FROM staff WHERE id=?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// ===== ORDERS =====

// Create order (normalized with order_items)
app.post("/api/orders", (req, res) => {
  const { table_no, items, total } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items in order" });
  }

  db.run(
    "INSERT INTO orders (table_no, total) VALUES (?, ?)",
    [table_no, total],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      const orderId = this.lastID;
      const stmt = db.prepare(
        "INSERT INTO order_items (order_id, menu_id, name, price, qty) VALUES (?,?,?,?,?)"
      );
      items.forEach(it => {
        stmt.run(orderId, it.id, it.name, it.price, it.qty);
      });
      stmt.finalize();

      res.json({ success: true, orderId });
    }
  );
});

// Get all orders (no items join)
app.get("/api/orders", (req, res) => {
  const tableNo = req.query.table_no;
  if (!tableNo) {
    // ไม่มี query => คืนทั้งหมด
    db.all("SELECT * FROM orders ORDER BY created_at DESC", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
    return;
  }

  // backward compatibility: ?table_no=... => คืนล่าสุดของโต๊ะนี้ + items
  db.get(
    "SELECT * FROM orders WHERE table_no = ? ORDER BY created_at DESC LIMIT 1",
    [tableNo],
    (err, orderRow) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!orderRow) return res.json({ items: [] });

      db.all(
        "SELECT name, price, qty FROM order_items WHERE order_id = ?",
        [orderRow.id],
        (err2, items) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({
            orderId: orderRow.id,
            table_no: tableNo,
            total: orderRow.total,
            created_at: orderRow.created_at,
            items,
          });
        }
      );
    }
  );
});

// Get latest order (by param) + items
app.get("/api/orders/latest/:table_no", (req, res) => {
  const { table_no } = req.params;

  db.get(
    "SELECT * FROM orders WHERE table_no = ? ORDER BY created_at DESC LIMIT 1",
    [table_no],
    (err, orderRow) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!orderRow) return res.json({ items: [] });

      db.all(
        "SELECT name, price, qty FROM order_items WHERE order_id = ?",
        [orderRow.id],
        (err2, items) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({
            orderId: orderRow.id,
            table_no,
            total: orderRow.total,
            created_at: orderRow.created_at,
            items,
          });
        }
      );
    }
  );
});

// Get all orders of a table (list only)
app.get("/api/orders/table/:table_no", (req, res) => {
  const { table_no } = req.params;
  db.all(
    "SELECT * FROM orders WHERE table_no = ? ORDER BY created_at DESC",
    [table_no],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// --- ADD: ensure 'status' column on orders ---
function ensureOrderStatusColumn() {
  db.get(`PRAGMA table_info(orders)`, (err) => {
    if (err) return console.error('PRAGMA error:', err.message);
    db.all(`PRAGMA table_info(orders)`, (err2, rows) => {
      if (err2) return console.error('PRAGMA error2:', err2.message);
      const hasStatus = rows.some(r => r.name === 'status');
      if (!hasStatus) {
        db.run(`ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'Pending'`, (e) => {
          if (e) console.error('ALTER orders add status failed:', e.message);
          else console.log('✅ Added orders.status column (default Pending)');
        });
      }
    });
  });
}
ensureOrderStatusColumn();

// --- ADD: Create order (with status) ---
app.post("/api/orders/new", (req, res) => {
  const { table_no, items, total } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "No items in order" });
  }
  db.run(
    "INSERT INTO orders (table_no, total, status) VALUES (?,?, 'Pending')",
    [table_no, total],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const orderId = this.lastID;
      const stmt = db.prepare(
        "INSERT INTO order_items (order_id, menu_id, name, price, qty) VALUES (?,?,?,?,?)"
      );
      items.forEach(it => {
        stmt.run(orderId, it.id, it.name, it.price, it.qty);
      });
      stmt.finalize();
      res.json({ success: true, orderId });
    }
  );
});

// --- ADD: list orders (with status) ---
app.get("/api/orders/list", (req, res) => {
  db.all("SELECT id, table_no, total, status, created_at FROM orders ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- ADD: get items of an order ---
app.get("/api/orders/:id/items", (req, res) => {
  const { id } = req.params;
  db.all("SELECT menu_id, name, price, qty FROM order_items WHERE order_id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// --- ADD: update order status ---
app.put("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Accepted' | 'Cancelled'
  if (!['Accepted','Cancelled','Pending'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  db.run("UPDATE orders SET status=? WHERE id=?", [status, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, updated: this.changes });
  });
});

// DELETE /api/orders/:id  — ลบ order + order_items
app.delete("/api/orders/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM order_items WHERE order_id=?", [id], function (err) {
    if (err) return res.status(500).json({ success:false, error: err.message });
    db.run("DELETE FROM orders WHERE id=?", [id], function (err2) {
      if (err2) return res.status(500).json({ success:false, error: err2.message });
      res.json({ success: true, deleted: this.changes });
    });
  });
});

// === [ADD] Payments Table ===
db.run(`CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  table_no TEXT,
  items TEXT,        -- JSON array (name, price, qty)
  subtotal REAL,
  vat REAL,
  total REAL,
  method TEXT,       -- 'card' | 'cash' | 'qr'
  paid_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

// === [ADD] Create Payment Record (เมื่อจ่ายเงินเสร็จ) ===
app.post("/api/payments", (req, res) => {
  const { order_id, table_no, items, subtotal, vat, total, method } = req.body;
  db.run(
    `INSERT INTO payments (order_id, table_no, items, subtotal, vat, total, method)
     VALUES (?,?,?,?,?,?,?)`,
    [order_id, table_no, JSON.stringify(items||[]), subtotal, vat, total, method||'unknown'],
    function(err){
      if(err) return res.status(500).json({error: err.message});
      res.json({ success: true, id: this.lastID });
    }
  );
});

// === [ADD] List Payments (ประวัติการจ่ายเงิน) ===
app.get("/api/payments", (req, res) => {
  db.all(`SELECT * FROM payments ORDER BY paid_at DESC`, [], (err, rows) => {
    if(err) return res.status(500).json({error: err.message});
    rows.forEach(r => { try { r.items = JSON.parse(r.items||'[]'); } catch(e){ r.items = []; }});
    res.json(rows);
  });
});

// === [ADD] Delete Order (สำหรับลบออเดอร์หลังจ่ายเงิน) ===
app.delete("/api/orders/:id", (req, res) => {
  const id = req.params.id;
  db.serialize(() => {
    db.run("DELETE FROM order_items WHERE order_id = ?", [id], function(e1){
      if(e1) return res.status(500).json({error:e1.message});
      db.run("DELETE FROM orders WHERE id = ?", [id], function(e2){
        if(e2) return res.status(500).json({error:e2.message});
        res.json({ success:true, deleted: this.changes });
      });
    });
  });
});

// === [ADD] Payments Table ===
db.run(`CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  table_no TEXT,
  items TEXT,        -- JSON array (name, price, qty)
  subtotal REAL,
  vat REAL,
  total REAL,
  method TEXT,       -- 'card' | 'cash' | 'qr'
  paid_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

// === [ADD] Create Payment Record (เมื่อจ่ายเงินเสร็จ) ===
app.post("/api/payments", (req, res) => {
  const { order_id, table_no, items, subtotal, vat, total, method } = req.body;
  console.log("[POST /api/payments] body =", req.body); // <- LOG
  db.run(
    `INSERT INTO payments (order_id, table_no, items, subtotal, vat, total, method)
     VALUES (?,?,?,?,?,?,?)`,
    [order_id, table_no, JSON.stringify(items||[]), subtotal, vat, total, method||'unknown'],
    function(err){
      if(err) {
        console.error("payments insert error:", err); // <- LOG
        return res.status(500).json({error: err.message});
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// === [ADD] List Payments (ประวัติการจ่ายเงิน) ===
app.get("/api/payments", (req, res) => {
  db.all(`SELECT * FROM payments ORDER BY paid_at DESC`, [], (err, rows) => {
    if(err) {
      console.error("payments list error:", err); // <- LOG
      return res.status(500).json({error: err.message});
    }
    rows.forEach(r => { try { r.items = JSON.parse(r.items||'[]'); } catch(e){ r.items = []; }});
    console.log(`[GET /api/payments] rows = ${rows.length}`); // <- LOG
    res.json(rows);
  });
});

// === [ADD] Delete Order (ลบออเดอร์หลังจ่ายเงิน) ===
app.delete("/api/orders/:id", (req, res) => {
  const id = req.params.id;
  console.log("[DELETE /api/orders/:id] id =", id); // <- LOG
  db.serialize(() => {
    db.run("DELETE FROM order_items WHERE order_id = ?", [id], function(e1){
      if(e1) return res.status(500).json({error:e1.message});
      db.run("DELETE FROM orders WHERE id = ?", [id], function(e2){
        if(e2) return res.status(500).json({error:e2.message});
        res.json({ success:true, deleted: this.changes });
      });
    });
  });
});



// ===== API: Bookings (สำหรับ customer_booking / customer_mybooking) =====
app.post("/api/bookings", (req, res) => {
  const { userId, date, time, people, tableId, comment } = req.body || {};
  if (!userId || !date || !time || !people || !tableId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // ตรวจสอบโต๊ะว่าง
  db.get("SELECT status FROM tables WHERE id=?", [tableId], (e, row) => {
    if (e) return res.status(500).json({ error: "DB error" });
    if (!row) return res.status(400).json({ error: "Table not found" });
    if (row.status !== "Available") return res.status(409).json({ error: "Table is not available" });

    // บันทึกการจอง
    db.run(
      `INSERT INTO bookings(user_id, table_id, date, time, people, comment) VALUES(?,?,?,?,?,?)`,
      [userId, tableId, date, time, people, comment || ""],
      function (e2) {
        if (e2) return res.status(500).json({ error: "DB error" });


        // อัปเดตสถานะโต๊ะเป็น Reserved
        db.run(`UPDATE tables SET status='Reserved' WHERE id=?`, [tableId], (e3) => {
          if (e3) console.error("Update table status error:", e3);
          res.json({ id: this.lastID });
        });
      }
    );
  });
});

// helper: แปลง username หรือ id -> เลข id
function resolveUserId(raw, cb) {
  if (!isNaN(Number(raw))) return cb(null, Number(raw));
  db.get("SELECT id FROM users WHERE username = ?", [String(raw)], (e, row) => {
    if (e) return cb(e);
    if (!row) return cb(new Error("User not found"));
    cb(null, row.id);
  });
}


// รายการจองของผู้ใช้ (ให้ status เป็น 'Reserved' เพื่อให้หน้า mybooking แสดง)
app.get("/api/bookings/byUser/:userId", (req, res) => {
  const userId = req.params.userId;
  db.all(
    `SELECT id, date, time, people, table_id AS tableId, comment
     FROM bookings
     WHERE user_id = ?
     ORDER BY id DESC`,
    [userId],
    (e, rows) => {
      if (e) return res.status(500).json({ error: "DB error" });
      const out = (rows || []).map(r => ({ ...r, status: "Reserved" })); // เติม status ให้ frontend เดิมใช้งานได้
      res.json(out);
    }
  );
});

// ===== API: Bookings (Update time & people) =====
app.put("/api/bookings/:id", (req, res) => {
  const id = req.params.id;
  const { userId, time, people, comment } = req.body || {};

  if (!time || !people) {
    return res.status(400).json({ error: "Missing fields: time, people" });
  }

  // ตัวช่วย: แปลง userId (อาจเป็นเลข id หรือ username) -> เป็นเลข id
  const resolveUserId = (u, cb) => {
    if (!u) return cb(null, null);                 // ไม่มี userId ก็ไม่ล็อกเจ้าของ (ตามโปรเจกต์ของคุณ)
    if (/^\d+$/.test(String(u))) return cb(null, Number(u));
    db.get("SELECT id FROM users WHERE username=?", [u], (err, row) => {
      if (err) return cb(err);
      cb(null, row ? row.id : null);
    });
  };

  db.get("SELECT id, user_id, status FROM bookings WHERE id=?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!row) return res.status(404).json({ error: "Booking not found" });

    resolveUserId(userId, (e, uid) => {
      if (e) return res.status(500).json({ error: "DB error" });

      // ถ้า client ส่ง userId มา และไม่ตรงเจ้าของ -> ห้ามแก้
      if (uid && row.user_id !== uid) {
        return res.status(403).json({ error: "Forbidden: not your booking" });
      }

      // อนุญาตแก้เฉพาะ time, people (+ comment ถ้าส่งมา)
      db.run(
        "UPDATE bookings SET time=?, people=?, comment=? WHERE id=?",
        [time, Number(people), comment || "", id],
        function (err2) {
          if (err2) return res.status(500).json({ error: "DB error" });
          res.json({ updated: this.changes });
        }
      );
    });
  });
});





// ===== DELETE /api/bookings/:id — หน้า customer_mybooking ใช้ยกเลิก =====
app.delete("/api/bookings/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT table_id AS tableId FROM bookings WHERE id=?", [id], (e, row) => {
    if (e) return res.status(500).json({ error: "DB error" });
    if (!row) return res.status(404).json({ error: "Booking not found" });

    db.run("DELETE FROM bookings WHERE id=?", [id], (e2) => {
      if (e2) return res.status(500).json({ error: "DB error" });
      db.run("UPDATE tables SET status='Available' WHERE id=?", [row.tableId], (e3) => {
        if (e3) console.error("Free table error:", e3);
        res.json({ ok: true });
      });
    });
  });
});
// ===== Start server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
