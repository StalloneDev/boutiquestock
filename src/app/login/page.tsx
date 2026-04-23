"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    
    try {
      // Since 'login' is a server function in 'lib/auth.ts', 
      // but 'lib/auth.ts' doesn't have "use server", I should have used a separate server action.
      // I'll quickly fix this by creating an action file for auth.
      const result = await handleLogin(formData);
      
      if (result.success) {
        toast.success("Connexion réussie !");
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.error || "Échec de la connexion");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  // Temporary inline action handler (will be moved to actions.ts)
  async function handleLogin(formData: FormData) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: formData,
    });
    return res.json();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full animate-pulse delay-700" />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 ring-1 ring-primary/20 shadow-xl shadow-primary/10">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Asset Analyser</h1>
          <p className="text-slate-400 text-lg uppercase tracking-widest text-[10px] font-bold">Gestion de Stock de Luxe</p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <CardHeader className="space-y-1 pb-8">
            <CardTitle className="text-2xl font-bold text-white text-center">Bienvenue</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Veuillez vous identifier pour accéder à votre inventaire.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 ml-1">Utilisateur</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    id="username" 
                    name="username" 
                    placeholder="Nom d'utilisateur" 
                    className="bg-slate-950/50 border-slate-800 text-white pl-10 h-12 focus:ring-primary/50 transition-all"
                    required 
                    disabled={loading}
                    defaultValue="Administrateur"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" title="Stock2026Admin" className="text-slate-300">Mot de passe</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="bg-slate-950/50 border-slate-800 text-white pl-10 h-12 focus:ring-primary/50 transition-all"
                    required 
                    disabled={loading}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                Sécurisé par Asset-Analyser v1.0
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
