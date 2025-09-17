export type UUID = string & { readonly __brand: "uuid" };

export type PriceMode = "FLAT" | "PER_DAY" | "PER_HOUR";
export type Spice = "MILD" | "MEDIUM" | "HOT";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER";
export type MembershipStatus = "LIFE_MEMBER" | "TRUSTEE" | "NON_MEMBER";

export interface AppSettingRow {
  key: string;
  value: Record<string, unknown>;
  updated_at?: string;
}

export interface RentalItemRow {
  id: UUID;
  name: string;
  description: string | null;
  price_mode: PriceMode;
  unit_price: number;
  category: string | null;
  active: boolean;
  sort_order: number;
}

export interface MenuCategoryRow {
  id: UUID;
  name: string;
  sort_order: number;
}

export interface MenuItemRow {
  id: UUID;
  category_id: UUID | null;
  name: string;
  veg: boolean;
  price: number | null;
  // Optional in UI; present in DB but not required by components
  spice?: Spice | null;
  active?: boolean;
}

export interface BookingMenuInfo {
  booking_id: UUID;
  event_type: string;
  date_start: string; // YYYY-MM-DD
  date_end: string;   // YYYY-MM-DD
  status: string;
  menu_template_id: UUID | null;
  menu_token: string | null;
  templates: Array<{ id: UUID; name: string }>;
  selections: Array<{
    item_id: UUID;
    item_name: string;
    category_name: string;
    qty: number;
    session: MealType | null;
    instructions: string | null;
  }>;
}

export interface PublicMenuRow {
  booking_id: UUID;
  event_type: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  category_id: UUID;
  category_name: string;
  item_id: UUID;
  item_name: string;
  item_price: number | null;
  item_spice: Spice | null;
  item_veg: boolean;
  sel_qty: number;
  sel_session: MealType | null;
  sel_instructions: string | null;
}

export interface BookingIntake {
  id: UUID;
  event_type: string;
  membership_status: MembershipStatus | null;

  primary_space_id: UUID | null;
  primary_space_name: string | null;

  requested_start_date: string | null; // date
  requested_end_date: string | null;   // date
  event_date: string | null;           // legacy single date

  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;

  gaam: string | null;
  booking_for_name: string | null;
  relationship_to_booker: string | null;

  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;

  vendors_decorator_needed: boolean;
  vendors_decorator_notes: string | null;

  vendors_dj_needed: boolean;
  vendors_dj_notes: string | null;

  vendors_cleaning_needed: boolean;
  vendors_cleaning_notes: string | null;

  vendors_other_needed: boolean;
  vendors_other_notes: string | null;
}
