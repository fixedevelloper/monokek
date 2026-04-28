import { Suspense } from "react";
import PosContent from "./PosContent";

export default function PosPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <PosContent />
    </Suspense>
  );
}