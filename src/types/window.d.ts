import type { AccountProfile, Profile } from '../lib/supabase';
export {};
declare global {
  interface Window {
    salesiaProfiles?: AccountProfile[];
    salesiaRole?: Profile['role_key'];
    salesiaCurrentUser?: { name: string; email: string; role: string; organization: string };
    salesiaOpenCreateUser?: () => void;
    salesiaRender?: () => void;
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
