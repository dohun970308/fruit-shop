export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderStatus = 'RECEIVED' | 'DELIVERED';

export type Order = {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
};
