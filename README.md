# ระบบแจก iPad โรงเรียนภูเขียว

ระบบจัดการและติดตามการแจกจ่าย iPad ให้นักเรียนและครู พร้อมระบบยืนยันการรับโดยถ่ายภาพหลักฐาน

---

## สิ่งที่ต้องมีก่อน Deploy

| รายการ | เวอร์ชันขั้นต่ำ |
|---|---|
| Docker | 24.x ขึ้นไป |
| Docker Compose | 2.x ขึ้นไป |
| Git | ใดก็ได้ |

ตรวจสอบด้วยคำสั่ง:
```bash
docker --version
docker compose version
```

---

## ขั้นตอนการ Deploy ครั้งแรก

### 1. ดึงโค้ดจาก GitHub

```bash
git clone https://github.com/MasterMong/spmcy_ipad.git
cd spmcy_ipad
```

### 2. สร้างไฟล์ `.env`

```bash
cp .env.example .env
```

แล้วแก้ไขค่าในไฟล์ `.env` ตามต้องการ:

```env
# พอร์ตที่เปิดให้เข้าถึงจากภายนอก (default: 8080)
PORT=8080

# รหัสผ่านสำหรับหน้า /students และ /teachers (ถ้าไม่ใส่ = ไม่มีรหัสผ่าน)
VITE_ADMIN_PASSWORD=ใส่รหัสผ่านที่ต้องการ

# รหัสผ่านสำหรับยกเลิกการจับคู่ / ยกเลิกการยืนยัน
VITE_CANCEL_PASSWORD=ใส่รหัสผ่านที่ต้องการ
```

> **หมายเหตุ:** `VITE_ADMIN_PASSWORD` และ `VITE_CANCEL_PASSWORD` จะถูก bake เข้าไปใน
> frontend ตอน build — หากเปลี่ยนค่าต้อง build ใหม่เสมอ

### 3. Build และเริ่มระบบ

```bash
docker compose up --build -d
```

รอประมาณ 2–3 นาทีสำหรับการ build ครั้งแรก จากนั้นเปิดเบราว์เซอร์ที่:

```
http://<IP เครื่องเซิร์ฟเวอร์>:8080
```

---

## การอัปเดตระบบ (Deploy ใหม่)

เมื่อมีโค้ดใหม่จาก GitHub:

```bash
git pull origin master
docker compose up --build -d
```

หากแก้เฉพาะ backend (ไม่ต้องการ build frontend ใหม่):

```bash
docker compose up --build -d backend
```

---

## โครงสร้างข้อมูลบนเซิร์ฟเวอร์

```
ipad/
├── data/           ← ฐานข้อมูล SQLite  (ipad.db)
├── uploads/        ← ภาพหลักฐานการรับ iPad
├── .env            ← ค่า config (ไม่ถูก commit ขึ้น git)
└── docker-compose.yml
```

> **สำรองข้อมูล:** คัดลอกโฟลเดอร์ `data/` และ `uploads/` ไปเก็บไว้ที่อื่น
> ข้อมูลทั้งหมดอยู่ในสองโฟลเดอร์นี้เท่านั้น

---

## นำเข้าข้อมูลนักเรียนและครู

1. เปิดหน้า **อัปโหลดข้อมูล** ที่ `/students/import`
2. เลือก **"นักเรียน"** แล้วอัปโหลดไฟล์ `student.csv` (รูปแบบของโรงเรียนภูเขียว)
3. เลือก **"ครู"** แล้วอัปโหลดไฟล์ `teacher.csv`
4. ระบบจะ upsert ข้อมูล — นักเรียนที่มีอยู่แล้วจะถูกอัปเดต ไม่ใช่เพิ่มซ้ำ

รูปแบบ CSV นักเรียน:
```
ชั้น,ห้อง,เลขที่,ID-04,prefix,name,surname,class,อีเมล์,ชื่อนักเรียน,ID-03
```

ดูตัวอย่างไฟล์ได้ที่ `csv/student.example.csv` และ `csv/teacher.example.csv`

> **หมายเหตุ:** ไฟล์ CSV ที่มีข้อมูลจริงถูกยกเว้นจาก git (`.gitignore`) เพื่อปกป้องข้อมูลส่วนตัวนักเรียน

---

## คำสั่งที่ใช้บ่อย

```bash
# ดู log แบบ realtime
docker logs ipad-backend -f
docker logs ipad-frontend -f

# หยุดระบบ
docker compose down

# หยุดและลบข้อมูลทั้งหมด (ระวัง!)
docker compose down -v

# ดูสถานะ container
docker compose ps

# เข้าไปใน container backend
docker exec -it ipad-backend bash

# ดูข้อมูลในฐานข้อมูลโดยตรง
docker exec ipad-backend python3 -c "
import sqlite3
conn = sqlite3.connect('/app/data/ipad.db')
print(conn.execute('SELECT COUNT(*) FROM students').fetchone())
print(conn.execute('SELECT COUNT(*) FROM device_assignments').fetchone())
"
```

---

## การตั้งค่า Reverse Proxy (Nginx) เพื่อใช้ HTTPS

ตัวอย่าง config สำหรับ Nginx บนเครื่องเซิร์ฟเวอร์ (ภายนอก container):

```nginx
server {
    listen 443 ssl;
    server_name your.domain.ac.th;

    ssl_certificate     /etc/letsencrypt/live/your.domain.ac.th/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your.domain.ac.th/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name your.domain.ac.th;
    return 301 https://$host$request_uri;
}
```

ขอ SSL certificate ฟรีด้วย Let's Encrypt:
```bash
certbot --nginx -d your.domain.ac.th
```

---

## แก้ปัญหาเบื้องต้น

| อาการ | วิธีแก้ |
|---|---|
| เปิดเว็บไม่ได้ | ตรวจสอบ `docker compose ps` ว่า container กำลัง running |
| หน้าขาวทั้งหมด | ดู log: `docker logs ipad-frontend` |
| API error 500 | ดู log: `docker logs ipad-backend` |
| รหัสผ่านไม่ถูกต้อง | แก้ `.env` แล้ว build ใหม่: `docker compose up --build -d` |
| ภาพอัปโหลดไม่ขึ้น | ตรวจสอบว่าโฟลเดอร์ `uploads/` มีสิทธิ์เขียน |
| นำเข้า CSV ไม่ได้ | ตรวจสอบ encoding ของไฟล์ให้เป็น UTF-8 หรือ UTF-8 BOM |
