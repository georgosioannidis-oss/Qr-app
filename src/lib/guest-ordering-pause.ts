/**
 * Guest QR checkout is blocked when the restaurant, the table’s section, or the table itself is paused.
 */
export function isGuestQrOrderingBlocked(args: {
  restaurantPaused: boolean;
  sectionPaused?: boolean | null;
  tablePaused?: boolean | null;
}): boolean {
  if (args.restaurantPaused) return true;
  if (args.sectionPaused === true) return true;
  if (args.tablePaused === true) return true;
  return false;
}
