// Hand-written types mirroring supabase/schema.sql. Keep in sync with the SQL.

export type EventRow = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  event_date: string; // YYYY-MM-DD
  event_time: string | null; // HH:mm[:ss]
  venue: string | null;
  city: string | null;
  seats: string | null;
  tickets_count: number | null;
  ticket_price: number | null;
  ticket_url: string | null;
  pre_notes: string | null;
  post_notes: string | null;
  rating: number | null;
  highlights: string[];
  subscription_id: string | null;
  subscription_tickets_used: number;
  poster_image_path: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export type SubscriptionRow = {
  id: string;
  user_id: string;
  name: string;
  organization: string | null;
  start_date: string | null;
  end_date: string | null;
  total_tickets: number;
  remaining_tickets: number;
  notes: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export type EventPhotoRow = {
  id: string;
  user_id: string;
  event_id: string | null;
  storage_path: string;
  caption: string | null;
  created_at: string;
}

export type ProfileRow = {
  id: string;
  full_name: string | null;
  created_at: string;
}

export type ExternalLinkRow = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export type SharedEventRow = {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  original_event_id: string | null;
  shared_event_data: Record<string, unknown>;
  poster_image_path: string | null;
  status: "pending" | "accepted" | "dismissed";
  created_at: string;
}

type Insert<T, Optional extends keyof T> = Omit<T, Optional> &
  Partial<Pick<T, Optional>>;

type Empty = { [_ in never]: never };

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insert<ProfileRow, "created_at">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: Insert<
          EventRow,
          | "id"
          | "created_at"
          | "updated_at"
          | "highlights"
          | "poster_image_path"
          | "archived"
        >;
        Update: Partial<EventRow>;
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: Insert<SubscriptionRow, "id" | "created_at" | "updated_at">;
        Update: Partial<SubscriptionRow>;
        Relationships: [];
      };
      event_photos: {
        Row: EventPhotoRow;
        Insert: Insert<EventPhotoRow, "id" | "created_at" | "caption">;
        Update: Partial<EventPhotoRow>;
        Relationships: [];
      };
      shared_events: {
        Row: SharedEventRow;
        Insert: Insert<SharedEventRow, "id" | "created_at" | "status">;
        Update: Partial<SharedEventRow>;
        Relationships: [];
      };
      external_links: {
        Row: ExternalLinkRow;
        Insert: Insert<
          ExternalLinkRow,
          "id" | "created_at" | "active" | "sort_order" | "description"
        >;
        Update: Partial<ExternalLinkRow>;
        Relationships: [];
      };
    };
    Views: Empty;
    Functions: {
      share_event_with_user: {
        Args: {
          p_recipient_email: string;
          p_event_data: Record<string, unknown>;
          p_poster_path: string | null;
          p_original_event_id: string | null;
        };
        Returns: string;
      };
    };
    Enums: Empty;
    CompositeTypes: Empty;
  };
}
