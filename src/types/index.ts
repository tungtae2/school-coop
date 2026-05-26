export type UserRole = 'admin' | 'teacher'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Category {
  id: string
  name: string
  color: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  price: number
  stock: number
  image_url: string | null
  category_id: string | null
  category?: Category
  is_active: boolean
  created_at: string
}

export interface Student {
  id: string
  student_code: string
  full_name: string
  classroom: string
  student_number: number
  created_at: string
}

export type PaymentStatus = 'paid' | 'debt'

export interface Order {
  id: string
  student_id: string
  student?: Student
  seller_id: string
  seller?: UserProfile
  total_amount: number
  payment_status: PaymentStatus
  paid_at: string | null
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product?: Product
  quantity: number
  unit_price: number
  subtotal: number
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface DebtSummary {
  student: Student
  total_debt: number
  order_count: number
  orders: Order[]
}

export interface DashboardStats {
  today_sales: number
  today_orders: number
  month_sales: number
  month_orders: number
  total_debt: number
  debt_count: number
}
