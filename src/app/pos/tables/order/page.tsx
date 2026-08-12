import {Suspense} from "react";
import PosContent from "@/components/pos/PosContent";

export default function PosPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <PosContent />
    </Suspense>
  );
}