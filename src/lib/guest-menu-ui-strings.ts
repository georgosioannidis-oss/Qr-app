/** All customer-visible strings on `/m/[token]` when bilingual mode is on. */

export type GuestMenuLang = "el" | "en";

export type GuestMenuUiStrings = {
  paymentSuccessfulCombined: string;
  thankYouAfterOrder: string;
  stripePayPrompt: string;
  backToMenu: string;
  yourOrders: string;
  yourOrdersHint: string;
  noOrdersYet: string;
  couldNotLoadOrders: string;
  cancel: string;
  emptyMenuTitle: string;
  emptyMenuHint: string;
  emptyMenuWrongLink: string;
  orderingPausedTitle: string;
  orderingPausedHint: string;
  callWaiterAria: string;
  callWaiterCaption: string;
  callWaiterSent: string;
  callWaiterFailed: string;
  payNow: string;
  viewPhoto: string;
  order: string;
  customise: string;
  addToOrder: string;
  close: string;
  yourOrder: string;
  swipeToRemove: string;
  decreaseQty: string;
  increaseQty: string;
  remove: string;
  total: string;
  placingOrder: string;
  placeOrderPay: string;
  howToPay: string;
  payCardAtTable: string;
  payCardAtTableHint: string;
  payCash: string;
  payCashHint: string;
  choosePayment: string;
  paymentModalSubtitle: string;
  viewCart: string;
  placeOrder: string;
  placing: string;
  chooseOptions: string;
  noteKitchen: string;
  noteOptional: string;
  notePlaceholder: string;
  addToOrderBtn: string;
  optionalExtrasHint: string;
  cartEmptyHint: string;
  cartStripHint: string;
  allergenTrustLine: string;
  searchMenu: string;
  /** Opens allergen reference infographic. */
  infoButton: string;
  allergenInfoTitle: string;
  allergenInfoImageAlt: string;
  /** Compact header control — opens search sheet. */
  searchButton: string;
  searchClear: string;
  searchPlaceholder: string;
  searchNoResults: string;
  menuRefreshing: string;
  reorderHint: string;
  itemsInCart: (count: number) => string;
  orderStatus: (status: string, waiterRelayPending?: boolean) => string;
  removeFromCartTitle: (name: string) => string;
  removeFromCartBody: string;
  orderFailedGeneric: string;
  langGreek: string;
  langEnglish: string;
  orderHistoryItems: (count: number) => string;
  priceEachTimesQty: (unitFormatted: string, qty: number) => string;
  menuLanguageGroupAria: string;
};

const EN: GuestMenuUiStrings = {
  paymentSuccessfulCombined: "Payment successful. Your order was sent.",
  thankYouAfterOrder: "Order sent. Thank you!",
  stripePayPrompt: "Order placed — pay below to confirm your order.",
  backToMenu: "Back to menu",
  yourOrders: "My orders",
  yourOrdersHint: "Orders you placed from this device. Tap one for status.",
  noOrdersYet: "You haven't placed any orders yet.",
  couldNotLoadOrders: "Could not load orders. Try again.",
  cancel: "Cancel",
  emptyMenuTitle: "No dishes to show yet",
  emptyMenuHint:
    "This table link works, but the restaurant hasn’t published any menu items (or they’re all hidden). Ask the owner to add items in the dashboard, or run the demo seed: npm run db:seed",
  emptyMenuWrongLink: "If you expected a menu, check the QR link or URL (e.g. /m/table-1 for the demo).",
  orderingPausedTitle: "Not taking orders right now",
  orderingPausedHint:
    "The kitchen is at capacity. Please speak to a member of staff if you need anything. Pull down on this page to refresh.",
  callWaiterAria: "Call waiter to your table",
  callWaiterCaption: "Call a waiter",
  callWaiterSent: "We’ve let the staff know someone will come by.",
  callWaiterFailed: "Couldn’t reach the restaurant. Try again in a moment.",
  payNow: "Pay now",
  viewPhoto: "View photo",
  order: "Order",
  customise: "Customise",
  addToOrder: "Add to order",
  close: "Close",
  yourOrder: "Your order",
  swipeToRemove: "Swipe left to remove",
  decreaseQty: "Decrease quantity",
  increaseQty: "Increase quantity",
  remove: "Remove",
  total: "Total",
  placingOrder: "Placing order…",
  placeOrderPay: "Place order & pay",
  howToPay: "How will you pay?",
  payCardAtTable: "Card",
  payCardAtTableHint: "Pay at the table (terminal or reader)",
  payCash: "Cash",
  payCashHint: "Pay with cash to staff",
  choosePayment: "Choose how you will pay.",
  paymentModalSubtitle: "Tap an option to place your order.",
  viewCart: "View cart",
  placeOrder: "Place order",
  placing: "Placing…",
  chooseOptions: "Choose your options, then add to order.",
  noteKitchen: "Note for the kitchen",
  noteOptional: "(optional)",
  notePlaceholder: "e.g. No onions, allergy to nuts…",
  addToOrderBtn: "Add to order",
  optionalExtrasHint: "Optional extras available — tap Customise to choose.",
  cartEmptyHint: "Browse the categories above to add dishes.",
  cartStripHint: "Tap to review or change your order",
  allergenTrustLine: "For allergies or special diets, ask staff before ordering.",
  infoButton: "Info",
  allergenInfoTitle: "Food allergen icons",
  allergenInfoImageAlt: "Chart of common food allergen icons (gluten, sesame, nuts, and others).",
  searchMenu: "Search menu",
  searchButton: "Search",
  searchClear: "Clear",
  searchPlaceholder: "Search dishes…",
  searchNoResults: "No dishes match your search.",
  menuRefreshing: "Updating menu…",
  reorderHint: "To repeat a past order, add the dishes again from the menu.",
  itemsInCart: (count) => (count === 1 ? `${count} item in cart` : `${count} items in cart`),
  orderStatus: (status, waiterRelayPending) => {
    if (waiterRelayPending && status === "paid") return "Waiting for staff";
    const map: Record<string, string> = {
      pending: "Awaiting payment",
      paid: "Order accepted",
      preparing: "Preparing",
      ready: "Ready for pickup",
      delivered: "Delivered",
      declined: "Order declined",
    };
    return map[status] ?? status;
  },
  removeFromCartTitle: (name) => `Remove “${name}” from your order?`,
  removeFromCartBody: "You can add it again from the menu.",
  orderFailedGeneric: "Something went wrong",
  langGreek: "Ελληνικά",
  langEnglish: "English",
  orderHistoryItems: (count) => (count === 1 ? "1 item" : `${count} items`),
  priceEachTimesQty: (unit, qty) => `${unit} each × ${qty}`,
  menuLanguageGroupAria: "Menu language",
};

const EL: GuestMenuUiStrings = {
  paymentSuccessfulCombined: "Η πληρωμή ολοκληρώθηκε. Η παραγγελία σας στάλθηκε.",
  thankYouAfterOrder: "Η παραγγελία στάλθηκε. Ευχαριστούμε!",
  stripePayPrompt: "Η παραγγελία καταχωρήθηκε — ολοκληρώστε την πληρωμή παρακάτω για επιβεβαίωση.",
  backToMenu: "Πίσω στο μενού",
  yourOrders: "Οι παραγγελίες σας",
  yourOrdersHint: "Παραγγελίες από αυτή τη συσκευή. Πατήστε για κατάσταση.",
  noOrdersYet: "Δεν υπάρχουν ακόμη παραγγελίες.",
  couldNotLoadOrders: "Δεν ήταν δυνατή η φόρτωση. Δοκιμάστε ξανά.",
  cancel: "Άκυρο",
  emptyMenuTitle: "Δεν υπάρχουν πιάτα ακόμη",
  emptyMenuHint:
    "Ο σύνδεσμος λειτουργεί, αλλά δεν έχει δημοσιευτεί μενού (ή όλα είναι κρυφά). Ζητήστε από τον ιδιοκτήτη να προσθέσει πιάτα, ή τρέξτε το demo: npm run db:seed",
  emptyMenuWrongLink: "Αν περιμένατε μενού, ελέγξτε το QR ή τη διεύθυνση (π.χ. /m/table-1 για το demo).",
  orderingPausedTitle: "Δεν δεχόμαστε τώρα παραγγελίες",
  orderingPausedHint:
    "Η κουζίνα είναι πλήρης. Μιλήστε με το προσωπικό. Σύρετε προς τα κάτω για ανανέωση.",
  callWaiterAria: "Κλήση σερβιτόρου στο τραπέζι σας",
  callWaiterCaption: "Καλέστε σερβιτόρο",
  callWaiterSent: "Ενημερώθηκε το προσωπικό.",
  callWaiterFailed: "Αποτυχία σύνδεσης. Δοκιμάστε ξανά σε λίγο.",
  payNow: "Πληρωμή τώρα",
  viewPhoto: "Προβολή φωτογραφίας",
  order: "Παραγγελία",
  customise: "Επιλογές",
  addToOrder: "Προσθήκη",
  close: "Κλείσιμο",
  yourOrder: "Η παραγγελία σας",
  swipeToRemove: "Σύρετε αριστερά για αφαίρεση",
  decreaseQty: "Μείωση ποσότητας",
  increaseQty: "Αύξηση ποσότητας",
  remove: "Αφαίρεση",
  total: "Σύνολο",
  placingOrder: "Αποστολή παραγγελίας…",
  placeOrderPay: "Παραγγελία και πληρωμή",
  howToPay: "Πώς θα πληρώσετε;",
  payCardAtTable: "Κάρτα",
  payCardAtTableHint: "Πληρωμή στο τραπέζι (POS)",
  payCash: "Μετρητά",
  payCashHint: "Πληρωμή στο προσωπικό",
  choosePayment: "Επιλέξτε τρόπο πληρωμής.",
  paymentModalSubtitle: "Πατήστε μια επιλογή για να στείλετε την παραγγελία.",
  viewCart: "Καλάθι",
  placeOrder: "Αποστολή παραγγελίας",
  placing: "Αποστολή…",
  chooseOptions: "Επιλέξτε επιλογές και προσθέστε στο καλάθι.",
  noteKitchen: "Σημείωση για την κουζίνα",
  noteOptional: "(προαιρετικό)",
  notePlaceholder: "π.χ. Χωρίς κρεμμύδι, αλλεργία σε ξηρούς καρπούς…",
  addToOrderBtn: "Προσθήκη στο καλάθι",
  optionalExtrasHint: "Υπάρχουν προαιρετικά έξτρα — πατήστε «Επιλογές» για να τα επιλέξετε.",
  cartEmptyHint: "Δείτε τις κατηγορίες παραπάνω για να προσθέσετε πιάτα.",
  cartStripHint: "Πατήστε για να δείτε ή να αλλάξετε την παραγγελία σας",
  allergenTrustLine: "Για αλλεργίες ή ειδικές δίαιτες, ρωτήστε το προσωπικό πριν παραγγείλετε.",
  infoButton: "Πληροφορίες",
  allergenInfoTitle: "Εικονίδια αλλεργιών τροφίμων",
  allergenInfoImageAlt: "Πίνακας με συνηθισμένα εικονίδια αλλεργιών σε τρόφιμα (γλουτένη, σουσάμι, ξηροί καρποί κ.ά.).",
  searchMenu: "Αναζήτηση μενού",
  searchButton: "Έρευνα",
  searchClear: "Καθαρισμός",
  searchPlaceholder: "Αναζήτηση πιάτων…",
  searchNoResults: "Δεν βρέθηκαν πιάτα.",
  menuRefreshing: "Ενημέρωση μενού…",
  reorderHint: "Για να επαναλάβετε μια παλιά παραγγελία, προσθέστε ξανά τα πιάτα από το μενού.",
  itemsInCart: (count) =>
    count === 1 ? `${count} προϊόν στο καλάθι` : `${count} προϊόντα στο καλάθι`,
  orderStatus: (status, waiterRelayPending) => {
    if (waiterRelayPending && status === "paid") return "Αναμονή για το προσωπικό";
    const map: Record<string, string> = {
      pending: "Αναμονή πληρωμής",
      paid: "Η παραγγελία εγκρίθηκε",
      preparing: "Προετοιμασία",
      ready: "Έτοιμο για παραλαβή",
      delivered: "Παραδόθηκε",
      declined: "Η παραγγελία απορρίφθηκε",
    };
    return map[status] ?? status;
  },
  removeFromCartTitle: (name) => `Αφαίρεση «${name}» από την παραγγελία;`,
  removeFromCartBody: "Μπορείτε να το προσθέσετε ξανά από το μενού.",
  orderFailedGeneric: "Κάτι πήγε στραβά",
  langGreek: "Ελληνικά",
  langEnglish: "English",
  orderHistoryItems: (count) => (count === 1 ? "1 προϊόν" : `${count} προϊόντα`),
  priceEachTimesQty: (unit, qty) => `${unit} το καθένα × ${qty}`,
  menuLanguageGroupAria: "Γλώσσα μενού",
};

export function getGuestMenuUiStrings(lang: GuestMenuLang): GuestMenuUiStrings {
  return lang === "el" ? EL : EN;
}
