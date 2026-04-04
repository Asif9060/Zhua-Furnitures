export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: 'customer' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: 'customer' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: 'customer' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category: 'furniture' | 'curtains' | 'accessories';
          subcategory: string;
          price_cents: number;
          original_price_cents: number | null;
          rating: number;
          review_count: number;
          badge: 'new' | 'sale' | 'custom' | 'bestseller' | null;
          description: string;
          long_description: string;
          images: Json;
          colors: Json;
          sizes: string[];
          fabrics: string[];
          in_stock: boolean;
          is_customizable: boolean;
          delivery_days: string;
          features: string[];
          stock: number;
          sku: string;
          status: 'active' | 'draft' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          category: 'furniture' | 'curtains' | 'accessories';
          subcategory?: string;
          price_cents: number;
          original_price_cents?: number | null;
          rating?: number;
          review_count?: number;
          badge?: 'new' | 'sale' | 'custom' | 'bestseller' | null;
          description?: string;
          long_description?: string;
          images?: Json;
          colors?: Json;
          sizes?: string[];
          fabrics?: string[];
          in_stock?: boolean;
          is_customizable?: boolean;
          delivery_days?: string;
          features?: string[];
          stock?: number;
          sku: string;
          status?: 'active' | 'draft' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          category?: 'furniture' | 'curtains' | 'accessories';
          subcategory?: string;
          price_cents?: number;
          original_price_cents?: number | null;
          rating?: number;
          review_count?: number;
          badge?: 'new' | 'sale' | 'custom' | 'bestseller' | null;
          description?: string;
          long_description?: string;
          images?: Json;
          colors?: Json;
          sizes?: string[];
          fabrics?: string[];
          in_stock?: boolean;
          is_customizable?: boolean;
          delivery_days?: string;
          features?: string[];
          stock?: number;
          sku?: string;
          status?: 'active' | 'draft' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          address: string;
          city: string;
          province: string;
          postal_code: string;
          delivery_type: string;
          delivery_fee_cents: number;
          total_cents: number;
          payment_method: string;
          payment_status: 'pending' | 'paid' | 'partial' | 'failed' | 'placeholder';
          fulfillment_status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          user_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          address: string;
          city: string;
          province: string;
          postal_code: string;
          delivery_type?: string;
          delivery_fee_cents?: number;
          total_cents: number;
          payment_method?: string;
          payment_status?: 'pending' | 'paid' | 'partial' | 'failed' | 'placeholder';
          fulfillment_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          address?: string;
          city?: string;
          province?: string;
          postal_code?: string;
          delivery_type?: string;
          delivery_fee_cents?: number;
          total_cents?: number;
          payment_method?: string;
          payment_status?: 'pending' | 'paid' | 'partial' | 'failed' | 'placeholder';
          fulfillment_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          unit_price_cents: number;
          quantity: number;
          line_total_cents: number;
          selected_color: string | null;
          selected_size: string | null;
          selected_fabric: string | null;
          custom_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          unit_price_cents: number;
          quantity: number;
          line_total_cents: number;
          selected_color?: string | null;
          selected_size?: string | null;
          selected_fabric?: string | null;
          custom_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          unit_price_cents?: number;
          quantity?: number;
          line_total_cents?: number;
          selected_color?: string | null;
          selected_size?: string | null;
          selected_fabric?: string | null;
          custom_note?: string | null;
          created_at?: string;
        };
      };
      content_blocks: {
        Row: {
          id: string;
          title: string;
          route: string;
          status: 'published' | 'scheduled' | 'draft';
          payload: Json;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          route: string;
          status?: 'published' | 'scheduled' | 'draft';
          payload?: Json;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          route?: string;
          status?: 'published' | 'scheduled' | 'draft';
          payload?: Json;
          updated_at?: string;
          created_at?: string;
        };
      };
      gallery_items: {
        Row: {
          id: string;
          title: string;
          location: string;
          project: string;
          before_image: Json | null;
          after_image: Json | null;
          status: 'published' | 'draft';
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          location?: string;
          project?: string;
          before_image?: Json | null;
          after_image?: Json | null;
          status?: 'published' | 'draft';
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          location?: string;
          project?: string;
          before_image?: Json | null;
          after_image?: Json | null;
          status?: 'published' | 'draft';
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      testimonials: {
        Row: {
          id: string;
          name: string;
          location: string;
          rating: number;
          text: string;
          project: string;
          avatar_image: Json | null;
          before_image: Json | null;
          after_image: Json | null;
          status: 'published' | 'draft';
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          location?: string;
          rating?: number;
          text: string;
          project?: string;
          avatar_image?: Json | null;
          before_image?: Json | null;
          after_image?: Json | null;
          status?: 'published' | 'draft';
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          location?: string;
          rating?: number;
          text?: string;
          project?: string;
          avatar_image?: Json | null;
          before_image?: Json | null;
          after_image?: Json | null;
          status?: 'published' | 'draft';
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      store_settings: {
        Row: {
          id: string;
          store_name: string;
          support_email: string;
          currency: string;
          order_prefix: string;
          automation: Json;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_name: string;
          support_email: string;
          currency?: string;
          order_prefix?: string;
          automation?: Json;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_name?: string;
          support_email?: string;
          currency?: string;
          order_prefix?: string;
          automation?: Json;
          updated_at?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
