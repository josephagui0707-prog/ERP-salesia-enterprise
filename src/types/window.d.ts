import type { AccountProfile, Profile } from '../lib/supabase';
import type { createAnalyticalServices, createPublicDataServices } from '../lib/analytical-services';
export {};
declare global {
  interface Window {
    salesiaAnalyticalApi?: ReturnType<typeof createAnalyticalServices>;
    salesiaPublicDataApi?: ReturnType<typeof createPublicDataServices>;
    salesiaPythonSummary?: (amounts: number[]) => Promise<{ n: number; mean: number; median: number; minimum: number; maximum: number }>;
    salesiaProfiles?: AccountProfile[];
    salesiaRole?: Profile['role_key'];
    salesiaCurrentUser?: { name: string; email: string; role: string; organization: string };
    salesiaOpenCreateUser?: () => void;
    salesiaRender?: () => void;
    salesiaInventoryApi?: {
      load: () => Promise<{
        products: Array<{ id: string; code: string; name: string; category_id: string | null; category_name: string | null; price: number; cost: number; stock_quantity: number; minimum_stock: number; status: string }>;
        movements: Array<{ id: string; product_id: string; movement_type: 'entrada' | 'salida' | 'ajuste'; quantity: number; reason: string; unit_cost: number | null; created_by: string | null; created_at: string; related_sale_id: string | null }>;
      }>;
      registerMovement: (input: { product_id: string; movement_type: 'entrada' | 'salida' | 'ajuste'; quantity: number; reason: string; unit_cost: number | null }) => Promise<void>;
    };
    salesiaOperationsApi?: {
      load: () => Promise<{
        categories: Array<{ id: string; name: string }>;
        customers: Array<{ id: string; code: string; name: string; email: string | null; phone: string | null; segment: string; status: string }>;
        products: Array<{ id: string; code: string; name: string; category_id: string | null; price: number; cost: number; stock_quantity: number; minimum_stock: number; status: string }>;
        sellers: Array<{ id: string; code: string; name: string; email: string | null; phone: string | null; monthly_goal: number; status: string }>;
        sales: Array<{ id: string; code: string; sold_at: string; customer_id: string | null; seller_id: string | null; status: string; subtotal: number; total: number; notes: string | null; created_at: string }>;
        saleItems: Array<{ id: string; sale_id: string; product_id: string; quantity: number; unit_price: number }>;
        orders: Array<{ id: string; code: string; order_date: string; customer_id: string | null; seller_id: string | null; status: string; total: number; notes: string | null; created_at: string }>;
        orderItems: Array<{ id: string; order_id: string; product_id: string; quantity: number; unit_price: number }>;
        payments: Array<{ id: string; sale_id: string; amount: number; method: string; status: string; reference: string | null; paid_at: string | null; created_at: string }>;
      }>;
      registerSale: (input: { customer_id: string; seller_id: string; items: Array<{ product_id: string; quantity: number }>; status: 'pendiente' | 'pagada'; method: 'efectivo' | 'tarjeta' | 'transferencia' | 'yape' | 'plin' | 'otro'; notes: string }) => Promise<string>;
      registerOrder: (input: { customer_id: string; seller_id: string; items: Array<{ product_id: string; quantity: number }>; notes: string }) => Promise<string>;
      updateOrderStatus: (id: string, status: 'confirmado' | 'preparando' | 'cancelado', notes?: string) => Promise<void>;
      convertOrderToSale: (id: string, status: 'pendiente' | 'pagada', method: 'efectivo' | 'tarjeta' | 'transferencia' | 'yape' | 'plin' | 'otro') => Promise<string>;
      registerPayment: (id: string, method: 'efectivo' | 'tarjeta' | 'transferencia' | 'yape' | 'plin' | 'otro', reference: string) => Promise<string>;
      cancelSale: (id: string, reason: string) => Promise<void>;
    };
    salesiaMaintenanceApi?: {
      load: () => Promise<{
        categories: Array<{ id: string; code: string; name: string; description: string | null; is_active: boolean }>;
        customers: Array<{ id: string; code: string; name: string; email: string | null; phone: string | null; address: string | null; segment: string; status: string; notes: string | null }>;
        products: Array<{ id: string; code: string; name: string; category_id: string | null; description: string | null; unit: string; price: number; cost: number; stock_quantity: number; minimum_stock: number; status: string }>;
        sellers: Array<{ id: string; code: string; name: string; email: string | null; phone: string | null; monthly_goal: number; status: string; profile_id: string | null }>;
      }>;
      saveCategory: (id: string | null, input: { name: string; description: string; is_active: boolean }) => Promise<void>;
      saveCustomer: (id: string | null, input: { name: string; email: string; phone: string; address: string; segment: string; status: string; notes: string }) => Promise<void>;
      saveProduct: (id: string | null, input: { name: string; category_id: string | null; description: string; unit: string; price: number; cost: number; minimum_stock: number; status: string }) => Promise<void>;
      saveSeller: (id: string | null, input: { name: string; email: string; phone: string; monthly_goal: number; status: string }) => Promise<void>;
    };
  }
}
