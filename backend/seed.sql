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
  role TEXT NOT NULL CHECK(role IN ('manager','staff','customer','monitor')),
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
('monitor1','123','monitor','01'),
('monitor2','123','monitor','02'),
('monitor3','123','monitor','03'),
('monitor4','123','monitor','04'),
('monitor5','123','monitor','05'),
('monitor6','123','monitor','06'),
('monitor7','123','monitor','07'),
('monitor8','123','monitor','08'),
('monitor9','123','monitor','09'),
('monitor10','123','monitor','10'),
('monitor11','123','monitor','11'),
('monitor12','123','monitor','12');

-- Promotions
INSERT INTO promotions (name, desc, image, date, status) VALUES
('Discount 20%','Special discount for popular menus','https://t4.ftcdn.net/jpg/00/63/83/29/360_F_63832924_PE0b9gQltaKya7t6mIQLWat5ob0KcuXr.jpg','2025-10-01','Active'),
('Free Drink','Buy 300 THB for FREE baverage','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToZxIPN7UWyqfZb8LYwLpPRiYqM58wX3u3Gw&s','2025-10-01','Active');

-- Menu (เติม desc ให้ตรง schema)
INSERT INTO menu (englishName, desc, type, price, image) VALUES
('Krapao','Thai basil stir-fry','Main Dish',65,'https://images.kitchenstories.io/wagtailOriginalImages/R2592-final-photo.jpg'),
('Som Tum','Spicy green papaya salad with chili and lime.',70,'https://assets.bonappetit.com/photos/644819df047251c7e5ee250b/1:1/w_3665,h_3665,c_limit/042523-green-papaya-salad-lede.jpg'),
('Pad Thai','Stir-fried rice noodles with shrimp, egg, and peanuts.','Main Dish',60,'https://inquiringchef.com/wp-content/uploads/2023/02/Authentic-Pad-Thai_square-1908.jpg');
('Green Curry','Classic stir-fried noodles','Main Dish',70,'https://hot-thai-kitchen.com/wp-content/uploads/2022/04/green-curry-new-sq-3.jpg');
('Tom Yun Kung','Hot and sour shrimp soup with herbs.','Main Dish',100,'https://d3h1lg3ksw6i6b.cloudfront.net/media/image/2023/04/24/5608757681874e1ea5df1aa41d5b2e3d_How_To_Make_Tom_Yam_Kung_The_Epitome_Of_Delicious_And_Nutritious_Thai_Cuisine3.jpg');
('Khao Pad','Thai-style fried rice with egg and veggies.','Main Dish',60,'https://khinskitchen.com/wp-content/uploads/2023/02/khao-pad-08.jpg');
('Water','NOT DELICIOUS','Beverage',20,'https://st.bigc-cs.com/cdn-cgi/image/format=webp,quality=90/public/media/catalog/product/07/88/8850999320007/8850999320007_1-20250724185102-.jpg');
('Coke','Original Cola','Beverage',30,'https://imartgrocersph.com/wp-content/uploads/2020/09/Coke-Regular-Mismo-12_s.png');
('Sprite','Soda but SWEET','Beverage',30,'https://www.coca-cola.com/content/dam/onexp/us/en/brands/sprite/products/en_sprite_prod_lymonade_20oz-bottle_750x750_v1.jpg');
('Soda','Best Material for Beer','Beverage',20,'https://st.bigc-cs.com/cdn-cgi/image/format=webp,quality=90/public/media/catalog/product/00/88/8850999220000/8850999220000_1-20250715111050-.jpg');
('LEO Beer','A smooth Thai lager with a light, crisp taste.','Beverage',80,'https://newyorkpizza.online/live/wp-content/uploads/2020/06/Leo-Beer.jpg');
('Chang Beer','A popular Thai lager, rich and refreshing.','Beverage',80,'https://newyorkpizza.online/live/wp-content/uploads/2020/06/Chang-Beer.jpg');

-- Stock
INSERT INTO stock (orderId, product, amount, salesChannel, remaining, status) VALUES
('ORD001','Krapao',10,'Dine-in',80,'High'),
('ORD002','Som Tum',5,'Takeaway',15,'Low');

-- Staff (ตัวอย่างชุดแรก)
INSERT INTO staff (staffId, fname, lname, email, contact, priority, image, workDays, shiftTime) VALUES
('S001','John','Doe','john@example.com','0811111111','Manager','https://i.scdn.co/image/ab67616100005174ecddf4e9db3637257468860e','Mon-Fri','09:00-17:00'),
('S002','Alice','Smith','alice@example.com','0822222222','Staff','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5nQv0FHhYTpkZ5Mbl1nJCRqCNuW6O1iHEIeNorjZh0ykRz5eVhQEP7P89bpXfJiYgUwc&usqp=CAU','Tue-Sat','10:00-18:00'),
('S003','Bob','Taylor','bob@example.com','0833333333','Staff','https://i1.sndcdn.com/artworks-000108059561-gw8196-t500x500.jpg','Wed-Sun','12:00-20:00');
('S004','Charlie','Brown','charlie@example.com','0844444444','Staff','https://randomuser.me/api/portraits/men/32.jpg','Mon-Fri','11:00-19:00'),
('S005','Diana','Lee','diana@example.com','0855555555','Staff','https://randomuser.me/api/portraits/women/45.jpg','Tue-Sat','09:00-17:00'),
('S006','Ethan','Wilson','ethan@example.com','0866666666','Manager','https://randomuser.me/api/portraits/men/67.jpg','Mon-Fri','08:00-16:00'),
('S007','Fiona','Clark','fiona@example.com','0877777777','Staff','https://randomuser.me/api/portraits/women/68.jpg','Wed-Sun','12:00-20:00'),
('S008','George','Hall','george@example.com','0888888888','Staff','https://randomuser.me/api/portraits/men/70.jpg','Thu-Mon','10:00-18:00'),
('S009','Hannah','Adams','hannah@example.com','0899999999','Staff','https://randomuser.me/api/portraits/women/72.jpg','Fri-Tue','13:00-21:00'),
('S010','Ian','Moore','ian@example.com','0801234567','Staff','https://randomuser.me/api/portraits/men/73.jpg','Mon-Fri','09:30-17:30');


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