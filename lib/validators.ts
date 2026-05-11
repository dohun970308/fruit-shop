import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string().uuid({ message: '잘못된 상품입니다.' }),
  quantity: z
    .number()
    .int()
    .min(1, '수량은 1개 이상이어야 합니다.')
    .max(99, '수량은 최대 99개입니다.'),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;

export const createOrderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, '이름은 2자 이상 입력해 주세요.')
    .max(20, '이름은 20자 이내로 입력해 주세요.'),
  customerPhone: z
    .string()
    .regex(/^01[0-9]{8,9}$/, '연락처 형식이 올바르지 않습니다.'),
  shippingAddress: z.string().trim().min(10, '배송 주소는 10자 이상 입력해 주세요.'),
  items: z.array(orderItemSchema).min(1, '주문 상품이 1개 이상이어야 합니다.'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const lookupOrderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, '이름은 2자 이상 입력해 주세요.')
    .max(20, '이름은 20자 이내로 입력해 주세요.'),
  customerPhone: z
    .string()
    .regex(/^01[0-9]{8,9}$/, '연락처 형식이 올바르지 않습니다.'),
});

export type LookupOrderInput = z.infer<typeof lookupOrderSchema>;

// -----------------------------------------------------------------------------
// UI 폼 전용 스키마 — 사용자가 입력 중인 값(하이픈 포함 가능)을 받기 위한 완화 버전.
// 서버 API는 위의 createOrderSchema/lookupOrderSchema (정규화된 값 기대)를 그대로 사용한다.
// -----------------------------------------------------------------------------
const phoneFieldUI = z
  .string()
  .min(1, '연락처를 입력해 주세요.')
  .refine(
    (s) => /^01[0-9]{8,9}$/.test(s.replace(/\D/g, '')),
    '연락처 형식이 올바르지 않습니다. (예: 010-1234-5678)',
  );

export const checkoutFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, '이름은 2자 이상 입력해 주세요.')
    .max(20, '이름은 20자 이내로 입력해 주세요.'),
  customerPhone: phoneFieldUI,
  shippingAddress: z.string().trim().min(10, '배송 주소는 10자 이상 입력해 주세요.'),
});

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;

export const lookupFormSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, '이름은 2자 이상 입력해 주세요.')
    .max(20, '이름은 20자 이내로 입력해 주세요.'),
  customerPhone: phoneFieldUI,
});

export type LookupFormInput = z.infer<typeof lookupFormSchema>;

export const productFormSchema = z.object({
  name: z.string().trim().min(1, '상품명을 입력해 주세요.').max(80, '상품명이 너무 깁니다.'),
  description: z.string().trim().max(2000, '설명이 너무 깁니다.').optional().or(z.literal('')),
  price: z
    .number({ message: '가격은 숫자로 입력해 주세요.' })
    .int('가격은 정수여야 합니다.')
    .min(0, '가격은 0원 이상이어야 합니다.'),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;
