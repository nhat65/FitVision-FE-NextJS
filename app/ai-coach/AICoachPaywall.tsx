"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Zap, Clock, Sparkles } from "lucide-react";

interface Plan {
  id: "trial" | "monthly" | "quarterly";
  label: string;
  price: number;
  currency: string;
  period: string;
  badge?: string;
  description: string;
}

interface AICoachPaywallProps {
  workoutId?: string;
  currentDay?: number;
  dayOfWeek?: string;
  token: string;
  onTrainWithoutAI: () => void;
}

export enum PaymentType {
  AI_MONITORING = 'ai_monitoring',
  COURSE = 'course',
  SUBSCRIPTION = 'subscription',
  OTHER = 'other',
}

const PLANS: Plan[] = [
  {
    id: "trial",
    label: "Free Trial",
    price: 0,
    currency: "USD",
    period: "7 days",
    description: "Try all AI features free for 7 days",
  },
  {
    id: "monthly",
    label: "1 Month",
    price: 9.99,
    currency: "USD",
    period: "/ month",
    description: "Full access, billed monthly",
  },
  {
    id: "quarterly",
    label: "3 Months",
    price: 7.99,
    currency: "USD",
    period: "/ month",
    badge: "Save 20%",
    description: "Billed $23.97 every 3 months",
  },
];

const FEATURES = [
  { icon: Zap, text: "Real-time AI pose detection" },
  { icon: CheckCircle2, text: "Automatic rep & set counting" },
  { icon: Clock, text: "Rest timer between sets" },
];

function PayPalButton({ plan, token }: { plan: Plan; token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      const isTrial = plan.id === "trial";
      const endpoint = isTrial
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/paypals/start-trial`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/paypals/create-order`;

      const body = isTrial
        ? {} // Trial không cần body
        : {
            amount: plan.price,
            currency: plan.currency,
            paymentType: PaymentType.AI_MONITORING,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error: ${res.status}`);
      }

      const data = await res.json();

      const approvalUrl =
        data.approveUrl ||
        data.approvalUrl ||
        data.href ||
        data.links?.find((l: any) => l.rel === "approve")?.href;

      if (!approvalUrl) {
        throw new Error("No approval URL returned from server");
      }

      window.location.href = approvalUrl;
    } catch (err: any) {
      console.error("[PayPal Button]", err);
      setError(err.message || "Payment initiation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
        style={{ background: "#0070ba", color: "#fff" }}
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Redirecting to PayPal...
          </>
        ) : (
          <>
            {plan.price === 0 ? "Start Free Trial" : "Pay with PayPal"}
            {plan.price > 0 && (
              <img
                src="https://www.paypalobjects.com/webstatic/mktg/Logo/pp-logo-100px.png"
                alt="PayPal"
                className="h-5 inline-block"
              />
            )}
          </>
        )}
      </button>

      {error && <p className="text-xs text-center text-destructive">{error}</p>}
    </div>
  );
}

export function AICoachPaywall({
  workoutId,
  currentDay,
  dayOfWeek,
  token,
  onTrainWithoutAI,
}: AICoachPaywallProps) {
  const [selected, setSelected] = useState<Plan>(PLANS[1]); // mặc định monthly

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <Link
            href={workoutId ? `/workouts/${workoutId}` : "/workouts"}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-10 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to program
          </Link>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/30 text-accent text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Workout Monitoring
            </div>
            <h1 className="text-4xl font-black mb-3">
              Train Smarter,{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Not Harder
              </span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Let AI count your reps, track your form, and guide your rest time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURES.map(({ icon: Icon, text }) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{text}</span>
                  </div>
                ))}
              </div>

              {/* Plan Selector */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Choose your plan
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {PLANS.map((plan) => {
                    const isSelected = selected.id === plan.id;
                    return (
                      <button
                        key={plan.id}
                        onClick={() => setSelected(plan)}
                        className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        {plan.badge && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                            {plan.badge}
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground font-medium mb-1">
                          {plan.label}
                        </p>
                        <p className="text-2xl font-black">
                          {plan.price === 0 ? "Free" : `$${plan.price}`}
                        </p>
                        {plan.price > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {plan.period}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 leading-snug">
                          {plan.description}
                        </p>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={onTrainWithoutAI}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Continue without AI monitoring →
              </button>
            </div>

            {/* Right Column - Payment */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-border sticky top-28">
                <CardContent className="pt-6 space-y-5">
                  <div className="bg-secondary rounded-xl p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{selected.label}</span>
                      {selected.badge && (
                        <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {selected.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-black">
                      {selected.price === 0 ? "Free" : `$${selected.price}`}
                      {selected.price > 0 && (
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          {selected.period}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selected.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {FEATURES.map(({ text }) => (
                      <div key={text} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>

                  <hr className="border-border" />

                  <PayPalButton plan={selected} token={token} />

                  <p className="text-[11px] text-center text-muted-foreground">
                    🔒 Secure payment via PayPal. Cancel anytime.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}