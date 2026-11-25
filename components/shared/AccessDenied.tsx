"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Affiché à la place d'une page d'administration que le compte n'a pas le droit d'ouvrir. */
export function AccessDenied() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="p-4 rounded-3xl bg-destructive/10 text-destructive">
        <ShieldAlert size={40} />
      </div>
      <h1 className="text-2xl font-black uppercase italic tracking-tight">Accès refusé</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Votre compte n&apos;a pas l&apos;autorisation d&apos;ouvrir cette page. Si vous en avez besoin, demandez à un
        administrateur de vous accorder la permission correspondante.
      </p>
      <Link href="/admin">
        <Button className="font-black uppercase text-xs tracking-widest">Retour à l&apos;administration</Button>
      </Link>
    </div>
  );
}
