# 🏫 ระบบร้านค้าสหกรณ์โรงเรียน

ระบบจัดการร้านค้าสหกรณ์โรงเรียนแบบครบวงจร พัฒนาด้วย Next.js + Supabase พร้อม Deploy บน Vercel

---

## ✨ ฟีเจอร์หลัก

| ฟีเจอร์ | คำอธิบาย |
|---------|---------|
| 🔐 ระบบ Login | Login ด้วย email/password แยก role admin/teacher |
| 🛒 ขายสินค้า (POS) | หน้าขายสินค้าแบบ Grid กดง่าย รวมยอดอัตโนมัติ |
| 👨‍🎓 ระบบนักเรียน | จัดการข้อมูลนักเรียน ค้นหาเร็ว |
| 💳 ชำระเงิน | เลือกจ่ายทันที หรือติดเงินได้ |
| 📊 Dashboard | ยอดขายวันนี้ เดือนนี้ สินค้าขายดี |
| 📦 จัดการสินค้า | เพิ่ม/แก้ไข/ลบสินค้า อัปโหลดรูป |
| 📋 ประวัติการขาย | ดูย้อนหลัง กรอง Export CSV |
| ⚠️ ติดเงิน | ดูรายชื่อค้างชำระ กดชำระภายหลัง |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (รูปภาพสินค้า)
- **Deploy**: Vercel

---

## 📋 ขั้นตอนติดตั้ง

### 1. Clone โปรเจกต์

```bash
git clone <your-repo>
cd school-coop
npm install
```

### 2. สร้างโปรเจกต์ Supabase

1. ไปที่ [supabase.com](https://supabase.com) → สร้าง account
2. กด **"New Project"**
3. กรอกชื่อโปรเจกต์และรหัสผ่าน Database
4. รอ 2-3 นาทีให้ระบบพร้อม

### 3. ตั้งค่า Database

1. ใน Supabase Dashboard ไปที่ **SQL Editor**
2. คัดลอก code ทั้งหมดจากไฟล์ `supabase-schema.sql`
3. วางในช่อง SQL Editor แล้วกด **Run**

### 4. สร้าง Admin User แรก

1. ไปที่ **Authentication → Users**
2. กด **"Add user"** → กรอก:
   - Email: `admin@school.ac.th`
   - Password: `Admin@1234`
3. หลังสร้างแล้ว ไปที่ **SQL Editor** รัน:
   ```sql
   UPDATE public.users 
   SET role = 'admin', full_name = 'ผู้ดูแลระบบ' 
   WHERE email = 'admin@school.ac.th';
   ```

### 5. ตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.local.example` เป็น `.env.local`:
```bash
cp .env.local.example .env.local
```

แก้ไขค่าใน `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**หา URL และ Key ได้ที่**: Supabase Dashboard → **Settings → API**

### 6. รันโปรเจกต์

```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deploy บน Vercel

### วิธีที่ 1: ผ่าน Vercel Dashboard (แนะนำ)

1. Push โค้ดขึ้น GitHub
2. ไปที่ [vercel.com](https://vercel.com) → สร้าง account
3. กด **"New Project"** → เลือก Repository
4. เพิ่ม **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. กด **Deploy** รอ 2-3 นาที

### วิธีที่ 2: ผ่าน Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 📁 โครงสร้างไฟล์

```
school-coop/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout + Font
│   │   ├── page.tsx            # Redirect to dashboard
│   │   ├── globals.css
│   │   ├── login/
│   │   │   └── page.tsx        # หน้า Login
│   │   ├── dashboard/
│   │   │   ├── layout.tsx      # Auth guard
│   │   │   └── page.tsx        # แดชบอร์ด
│   │   ├── pos/
│   │   │   └── page.tsx        # หน้าขายสินค้า
│   │   ├── students/
│   │   │   └── page.tsx        # จัดการนักเรียน
│   │   ├── products/
│   │   │   └── page.tsx        # จัดการสินค้า
│   │   ├── history/
│   │   │   └── page.tsx        # ประวัติการขาย
│   │   └── debts/
│   │       └── page.tsx        # ติดเงิน
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Loading.tsx
│   │   └── Sidebar.tsx
│   ├── hooks/
│   │   ├── useAuth.tsx         # Auth context
│   │   └── useCart.ts          # Cart state
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client (browser)
│   │   ├── supabase-server.ts  # Supabase client (server)
│   │   └── utils.ts            # Utility functions
│   └── types/
│       └── index.ts            # TypeScript types
├── supabase-schema.sql         # SQL schema
├── .env.local.example
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 👥 การจัดการผู้ใช้งาน

### เพิ่มครูใหม่

1. ไปที่ Supabase → **Authentication → Users**
2. กด **"Add user"** กรอก email และรหัสผ่าน
3. ครูจะถูกสร้างเป็น role `teacher` อัตโนมัติ

### เปลี่ยน role เป็น admin

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'teacher@school.ac.th';
```

### เปลี่ยนชื่อครู

```sql
UPDATE public.users SET full_name = 'ชื่อครูใหม่' WHERE email = 'teacher@school.ac.th';
```

---

## 🔒 สิทธิ์การใช้งาน

| ฟีเจอร์ | Teacher | Admin |
|---------|---------|-------|
| ขายสินค้า (POS) | ✅ | ✅ |
| จัดการนักเรียน | ✅ | ✅ |
| ดูประวัติการขาย | ✅ | ✅ |
| ดูหน้าติดเงิน | ✅ | ✅ |
| ชำระหนี้ | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| **จัดการสินค้า** | ❌ | ✅ |
| **เพิ่ม/ลบหมวดหมู่** | ❌ | ✅ |

---

## 🐛 แก้ปัญหาที่พบบ่อย

**ล็อกอินแล้วไม่เข้าหน้าหลัก**
- ตรวจสอบ Environment Variables ว่าถูกต้อง
- ตรวจสอบว่ารัน SQL schema แล้ว

**อัปโหลดรูปภาพไม่ได้**
- ตรวจสอบว่าสร้าง Storage Bucket ชื่อ `images` แล้ว
- ตรวจสอบ Storage Policies ใน SQL schema

**สร้าง user แล้วไม่มีใน table users**
- ตรวจสอบว่า Trigger `on_auth_user_created` ถูกสร้างแล้ว

---

## 📞 ติดต่อ

หากพบปัญหาหรือต้องการปรับแต่ง กรุณาติดต่อผู้พัฒนาระบบ

---

*พัฒนาด้วย ❤️ สำหรับโรงเรียนไทย*
