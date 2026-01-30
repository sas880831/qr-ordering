export type CartOption = { option_id: string; name: string; price_delta: number };

export type CartItem = {
  product_id: string;
  name: string;
  qty: number;
  unit_price: number;
  note?: string;
  options: CartOption[];
};

export type CreateOrderPayload = {
  storeSlug: string;
  tableCode: string;
  note?: string;
  items: CartItem[];
};
