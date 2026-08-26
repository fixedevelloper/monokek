import { format, isValid, parse } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Le backend (ReservationService#DATE_TIME) sérialise pickup_date en
 * "dd/MM/yyyy HH:mm", pas en ISO — `new Date(str)` renvoie une Invalid Date
 * pour ce format dans la plupart des moteurs JS, d'où le RangeError de
 * date-fns qu'on avait avant. On parse donc explicitement ce format-là ;
 * certaines réservations n'ont par ailleurs pas encore de pickup_date
 * (backend renvoie null), d'où le garde-fou "—".
 */
export function formatPickupDate(pickupDate: string | null | undefined, pattern: string, withLocale = true) {
  if (!pickupDate) return "—";
  const date = parse(pickupDate, "dd/MM/yyyy HH:mm", new Date());
  if (!isValid(date)) return "—";
  return withLocale ? format(date, pattern, { locale: fr }) : format(date, pattern);
}

/**
 * Convertit le pickup_date renvoyé par le backend ("dd/MM/yyyy HH:mm") vers
 * la valeur attendue par un <input type="datetime-local"> ("yyyy-MM-ddTHH:mm").
 * Symétrique de formatPickupDate, pour pré-remplir le formulaire d'édition.
 */
export function toDatetimeLocalValue(pickupDate: string | null | undefined): string {
  if (!pickupDate) return "";
  const date = parse(pickupDate, "dd/MM/yyyy HH:mm", new Date());
  if (!isValid(date)) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
}
