import { Suspense } from "react";
import KitchenTicketsContent from "./TicketsContent";

export default function KickenPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <KitchenTicketsContent />
    </Suspense>
  );
}