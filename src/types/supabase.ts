export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          address_primary: Json;
          role: 'customer' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          address_primary?: Json;
          role?: 'customer' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          address_primary?: Json;
          role?: 'customer' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          marketing_email: boolean;
          sms_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          marketing_email?: boolean;
          sms_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          marketing_email?: boolean;
          sms_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_wishlist: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_carts: {
        Row: {
          id: string;
          user_id: string;
          items: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          items?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          items?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_activity_log: {
        Row: {
          id: string;
          user_id: string;
          action_type:
            | 'login'
            | 'logout'
            | 'order_created'
            | 'order_status_changed'
            | 'wishlist_added'
            | 'wishlist_removed'
            | 'profile_updated'
            | 'password_changed'
            | 'password_reset_requested'
            | 'product_viewed';
          resource_type: 'auth' | 'order' | 'wishlist' | 'profile' | 'product';
          resource_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type:
            | 'login'
            | 'logout'
            | 'order_created'
            | 'order_status_changed'
            | 'wishlist_added'
            | 'wishlist_removed'
            | 'profile_updated'
            | 'password_changed'
            | 'password_reset_requested'
            | 'product_viewed';
          resource_type: 'auth' | 'order' | 'wishlist' | 'profile' | 'product';
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_type?:
            | 'login'
            | 'logout'
            | 'order_created'
            | 'order_status_changed'
            | 'wishlist_added'
            | 'wishlist_removed'
            | 'profile_updated'
            | 'password_changed'
            | 'password_reset_requested'
            | 'product_viewed';
          resource_type?: 'auth' | 'order' | 'wishlist' | 'profile' | 'product';
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      user_browsing_history: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          viewed_at: string;
          context: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          viewed_at?: string;
          context?: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          viewed_at?: string;
          context?: Json;
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
          weight_kg: number;
          width_cm: number;
          depth_cm: number;
          height_cm: number;
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
          weight_kg?: number;
          width_cm?: number;
          depth_cm?: number;
          height_cm?: number;
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
          weight_kg?: number;
          width_cm?: number;
          depth_cm?: number;
          height_cm?: number;
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
          payment_status:
            | 'awaiting_payment'
            | 'pending'
            | 'paid'
            | 'partial'
            | 'failed'
            | 'placeholder';
          gateway_provider: 'payfast' | 'yoco' | 'payflex' | 'manual' | 'placeholder';
          gateway_transaction_id: string | null;
          payment_session_id: string | null;
          payment_reference: string | null;
          payment_attempt_count: number;
          last_payment_attempt_at: string | null;
          payment_received_at: string | null;
          payment_settled_at: string | null;
          payment_error_message: string | null;
          refunded_cents: number;
          remaining_balance_cents: number;
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
          payment_status?:
            | 'awaiting_payment'
            | 'pending'
            | 'paid'
            | 'partial'
            | 'failed'
            | 'placeholder';
          gateway_provider?: 'payfast' | 'yoco' | 'payflex' | 'manual' | 'placeholder';
          gateway_transaction_id?: string | null;
          payment_session_id?: string | null;
          payment_reference?: string | null;
          payment_attempt_count?: number;
          last_payment_attempt_at?: string | null;
          payment_received_at?: string | null;
          payment_settled_at?: string | null;
          payment_error_message?: string | null;
          refunded_cents?: number;
          remaining_balance_cents?: number;
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
          payment_status?:
            | 'awaiting_payment'
            | 'pending'
            | 'paid'
            | 'partial'
            | 'failed'
            | 'placeholder';
          gateway_provider?: 'payfast' | 'yoco' | 'payflex' | 'manual' | 'placeholder';
          gateway_transaction_id?: string | null;
          payment_session_id?: string | null;
          payment_reference?: string | null;
          payment_attempt_count?: number;
          last_payment_attempt_at?: string | null;
          payment_received_at?: string | null;
          payment_settled_at?: string | null;
          payment_error_message?: string | null;
          refunded_cents?: number;
          remaining_balance_cents?: number;
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
      delivery_zones: {
        Row: {
          province_code: string;
          province_name: string;
          cities: string[];
          standard_fee_cents: number;
          express_fee_cents: number;
          standard_days: string;
          express_days: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          province_code: string;
          province_name: string;
          cities?: string[];
          standard_fee_cents?: number;
          express_fee_cents?: number;
          standard_days?: string;
          express_days?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          province_code?: string;
          province_name?: string;
          cities?: string[];
          standard_fee_cents?: number;
          express_fee_cents?: number;
          standard_days?: string;
          express_days?: string;
          is_active?: boolean;
          sort_order?: number;
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
          free_shipping_threshold_cents: number;
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
          free_shipping_threshold_cents?: number;
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
          free_shipping_threshold_cents?: number;
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
