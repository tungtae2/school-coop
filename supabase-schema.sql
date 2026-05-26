-- =============================================
-- ระบบร้านค้าสหกรณ์โรงเรียน - Supabase Schema
-- =============================================

-- 1. ตาราง users (ครู/แอดมิน)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตาราง categories (หมวดหมู่สินค้า)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#16a34a',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตาราง products (สินค้า)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตาราง students (นักเรียน)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  classroom TEXT NOT NULL,
  student_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตาราง orders (รายการขาย)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'debt')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตาราง order_items (รายการสินค้าในแต่ละออเดอร์)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes สำหรับประสิทธิภาพ
-- =============================================
CREATE INDEX IF NOT EXISTS idx_orders_student ON public.orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_students_classroom ON public.students(classroom);

-- =============================================
-- Row Level Security (RLS)
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users: อ่านได้ทุกคนที่ login, แก้ไขได้เฉพาะตัวเอง
CREATE POLICY "users_select" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Categories: อ่านได้ทุกคน, แก้ไขได้เฉพาะ admin
CREATE POLICY "categories_select" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_all_admin" ON public.categories FOR ALL TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Products: อ่านได้ทุกคน, แก้ไขได้เฉพาะ admin
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_all_admin" ON public.products FOR ALL TO authenticated
  USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Students: จัดการได้ทุกคนที่ login
CREATE POLICY "students_all" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders: อ่านได้ทุกคน, เขียนได้ทุกคน
CREATE POLICY "orders_all" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Order Items: อ่านได้ทุกคน, เขียนได้ทุกคน
CREATE POLICY "order_items_all" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- Trigger สร้าง user profile อัตโนมัติเมื่อ signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Storage Bucket สำหรับรูปสินค้า
-- =============================================
-- รันใน Supabase Dashboard > Storage > New Bucket
-- Name: images | Public: true
-- หรือรัน SQL นี้ใน SQL Editor:

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "images_select" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "images_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'images');
CREATE POLICY "images_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'images');
CREATE POLICY "images_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'images');

-- =============================================
-- ข้อมูลตัวอย่าง (หมวดหมู่)
-- =============================================
INSERT INTO public.categories (name, color) VALUES
  ('อาหาร', '#16a34a'),
  ('เครื่องดื่ม', '#2563eb'),
  ('ขนม', '#d97706'),
  ('อุปกรณ์การเรียน', '#7c3aed')
ON CONFLICT DO NOTHING;

-- =============================================
-- สร้าง Admin User ตัวแรก
-- =============================================
-- 1. ไปที่ Supabase Dashboard > Authentication > Users
-- 2. กด "Add user" > Email: admin@school.ac.th, Password: Admin@1234
-- 3. หลังจาก user ถูกสร้าง ให้รัน SQL นี้:
-- UPDATE public.users SET role = 'admin', full_name = 'ผู้ดูแลระบบ' WHERE email = 'admin@school.ac.th';
