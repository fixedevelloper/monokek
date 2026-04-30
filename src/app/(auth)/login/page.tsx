"use client";

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Store, Loader2, Lock, User, Eye, EyeOff, Settings, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from '@/src/hooks/use-auth';
import { useRouter } from 'next/navigation';


// Schéma de validation Zod
const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(4, { message: "Le mot de passe est trop court" }),
});

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      await login(values);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-[450px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Logo Section */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20 mb-2">
            <Store className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">
            Mono<span className="text-primary">Kek</span>
          </h1>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
            Accès Professionnel
          </p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Connexion</CardTitle>
            <CardDescription>
              Entrez vos identifiants pour accéder à votre session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="nom@mono-kek.com"
                            className="pl-10 h-12 bg-muted/50 border-none focus-visible:ring-primary"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase">Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="pl-10 h-12 bg-muted/50 border-none focus-visible:ring-primary"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-md font-bold uppercase shadow-lg shadow-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authentification...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
          Besoin d'aide ? Contactez votre administrateur de succursale.
        </p>
      </div>
 
      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-2 group">
        <p className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter backdrop-blur-md">
          Réglages Système
        </p>
        <Button
          type="button"
          onClick={() => {
            router.push('/setup')
          }}
          className="h-14 w-14 rounded-full bg-white text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-slate-900 hover:text-white border-none transition-all duration-300"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}