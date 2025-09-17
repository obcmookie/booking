export type UUID = string & { readonly __brand: unique symbol };


export type PriceMode = "FLAT" | "PER_DAY" | "PER_HOUR";
export type Spice = "MILD" | "MEDIUM" | "HOT";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER";


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
category_id: UUID;
name: string;
veg: boolean;
spice: Spice | null;
price: number | null;
active: boolean;
}


export interface BookingMenuInfo {
booking_id: UUID;
event_type: string;
date_start: string; // ISO (date only)
date_end: string; // ISO (date only)
status: string;
menu_template_id: UUID | null;
menu_token: string | null;
templates: Array<{ id: UUID; name: string }>; // menu_templates list
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
start_date: string; // date
end_date: string; // date
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