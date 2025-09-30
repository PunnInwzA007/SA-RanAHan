-- ลบตารางเก่าถ้ามีอยู่
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS promotions;
DROP TABLE IF EXISTS menu;
DROP TABLE IF EXISTS tables;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS stock;

-- ===== USERS =====
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('manager','staff','customer','moniter')),
  table_no TEXT
);

-- ตารางโปรโมชั่น
CREATE TABLE promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    desc TEXT,
    image TEXT,
    date TEXT,
    status TEXT CHECK(status IN ('Active','Inactive'))
);

-- ===== MENU (สอดคล้องกับ server.js: มี desc) =====
CREATE TABLE menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  englishName TEXT NOT NULL,
  desc TEXT,
  type TEXT,
  price REAL NOT NULL,
  image TEXT
);

-- ตารางโต๊ะในร้าน
CREATE TABLE tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number TEXT UNIQUE NOT NULL,
    seats INTEGER NOT NULL DEFAULT 6,
    status TEXT NOT NULL CHECK(status IN ('Available','Reserved','Unavailable')) DEFAULT 'Available'
);

-- ตารางการจอง
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    table_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    people INTEGER NOT NULL,
    comment TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(table_id) REFERENCES tables(id)
);

-- ตารางstock
CREATE TABLE IF NOT EXISTS stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  orderId TEXT,
  product TEXT,
  amount TEXT,
  salesChannel TEXT,
  remaining INTEGER,
  status TEXT
);

-- ===== STAFF =====
CREATE TABLE staff (
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
);

-- ================== ข้อมูลตัวอย่าง ==================

-- Users (ใส่ table_no ให้ครบตาม NOT NULL; moniter ผูกโต๊ะ 01)
INSERT INTO users (username, password, role, table_no) VALUES
('manager1','123','manager',''),
('staff1','123','staff',''),
('customer1','123','customer',''),
('monitor1','123','moniter','01'),
('monitor2','123','moniter','02'),
('monitor3','123','moniter','03'),
('monitor4','123','moniter','04'),
('monitor5','123','moniter','05'),
('monitor6','123','moniter','06'),
('monitor7','123','moniter','07'),
('monitor8','123','moniter','08'),
('monitor9','123','moniter','09'),
('monitor10','123','moniter','10'),
('monitor11','123','moniter','11'),
('monitor12','123','moniter','12');

-- Promotions
INSERT INTO promotions (name, desc, image, date, status) VALUES
('Discount 20%','Special discount for popular menus','https://via.placeholder.com/300x200','2025-01-01','Active'),
('Free Drink','Buy 300 THB for FREE baverage','https://via.placeholder.com/300x200','2025-02-01','Inactive');

-- Menu (เติม desc ให้ตรง schema)
INSERT INTO menu (englishName, desc, type, price, image) VALUES
('Krapao','Thai basil stir-fry','Main Dish',100,'https://images.kitchenstories.io/wagtailOriginalImages/R2592-final-photo.jpg'),
('Som Tum','Papaya salad','Beverage',70,'https://assets.bonappetit.com/photos/644819df047251c7e5ee250b/1:1/w_3665,h_3665,c_limit/042523-green-papaya-salad-lede.jpg'),
('Pad Thai','Classic stir-fried noodles','Main Dish',90,'https://inquiringchef.com/wp-content/uploads/2023/02/Authentic-Pad-Thai_square-1908.jpg');

-- Stock
INSERT INTO stock (orderId, product, amount, salesChannel, remaining, status) VALUES
('ORD001','Krapao',10,'Dine-in',80,'High'),
('ORD002','Som Tum',5,'Takeaway',15,'Low');

-- Staff (ตัวอย่างชุดแรก)
INSERT INTO staff (staffId, fname, lname, email, contact, priority, image, workDays, shiftTime) VALUES
('S001','John','Doe','john@example.com','0811111111','Manager','https://i.scdn.co/image/ab67616100005174ecddf4e9db3637257468860e','Mon-Fri','09:00-17:00'),
('S002','Alice','Smith','alice@example.com','0822222222','Staff','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5nQv0FHhYTpkZ5Mbl1nJCRqCNuW6O1iHEIeNorjZh0ykRz5eVhQEP7P89bpXfJiYgUwc&usqp=CAU','Tue-Sat','10:00-18:00'),
('S003','Bob','Taylor','bob@example.com','0833333333','Staff','https://i1.sndcdn.com/artworks-000108059561-gw8196-t500x500.jpg','Wed-Sun','12:00-20:00');


-- Tables (12 โต๊ะ)
INSERT INTO tables (table_number, seats, status) VALUES
('01',6,'Available'),
('02',6,'Available'),
('03',6,'Available'),
('04',6,'Available'),
('05',6,'Available'),
('06',6,'Available'),
('07',6,'Available'),
('08',6,'Available'),
('09',6,'Available'),
('10',6,'Available'),
('11',6,'Available'),
('12',6,'Available');