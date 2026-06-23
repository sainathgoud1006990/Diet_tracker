import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2, Salad, Star, Flame, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center justify-center px-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo / brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
            <Salad className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-serif text-primary tracking-tight">DietTrack</h1>
            <p className="text-muted-foreground mt-1 text-sm">Your 31-day personal diet tracker</p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="w-full space-y-2.5">
          {[
            { icon: <Flame className="w-4 h-4 text-destructive" />, text: "Auto calorie & protein estimation" },
            { icon: <Star className="w-4 h-4 text-[hsl(38_95%_55%)]" />, text: "7-day progress & streak tracking" },
            { icon: <TrendingUp className="w-4 h-4 text-primary" />, text: "Monthly calendar with clean/cheat days" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border">
              {icon}
              <span className="text-sm text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full h-12 text-base font-semibold rounded-2xl shadow-lg shadow-primary/20"
          onClick={login}
        >
          Sign in to get started
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your data stays private and personal to your account.
        </p>
      </div>
    </div>
  );
}
