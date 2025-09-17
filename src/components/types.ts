export type UUID = string & { readonly __brand: unique symbol };

export type PriceMode = "FLAT" | "PER_DAY" | "PER_HOUR";
export type Spice = "MILD" | "MEDIUM" | "HOT";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "OTHER";
export type MembershipStatus = "LIFE_MEMBER" | "TRUSTEE" | "NON_MEMBER";

/** Intake payload used by the Admin Intake tab */
export interface BookingIntake {
  id: UUID;

  event_type: string;

  membership_status: MembershipStatus | null;

  primary_space_id: UUID | null;
  primary_space_name: string | null;

  requested_start_date: string | null;  // YYYY-MM-DD
  requested_end_date: string | null;    // YYYY-MM-DD
  event_date: string | null;            // legacy single date

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
