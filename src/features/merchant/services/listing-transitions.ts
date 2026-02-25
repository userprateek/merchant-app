import { ListingStatus } from "@prisma/client";

export const LISTING_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  LISTED: ["DELISTED", "SUSPENDED"],
  DELISTED: ["LISTED"],
  SUSPENDED: ["LISTED", "DELISTED"],
};

export function canTransitionListing(from: ListingStatus, to: ListingStatus) {
  return LISTING_TRANSITIONS[from]?.includes(to);
}
