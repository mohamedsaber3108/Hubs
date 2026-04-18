import { useState } from "react";
import { Check, Zap, Building2, Crown } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    name: "Free",
    icon: Zap,
    price: { monthly: 0, annual: 0 },
    desc: "Get started with USAM Hub",
    features: [
      "Join up to 2 communities",
      "5 posts per week",
      "Event registration",
      "Basic profile",
      "Group membership (up to 5)",
      "Access to free resources",
    ],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    name: "Pro",
    icon: Crown,
    price: { monthly: 9, annual: 7 },
    desc: "Unlock your full potential",
    features: [
      "Unlimited communities",
      "Unlimited posts",
      "Featured in search",
      "Analytics dashboard",
      "Priority support",
      "Advanced filters",
      "Unlimited portfolio items",
      "Custom profile themes",
      "Nomad AI Pro features",
      "No ads",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Organization",
    icon: Building2,
    price: { monthly: 29, annual: 24 },
    desc: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Company profile page",
      "Candidate pipeline (HR)",
      "Featured opportunities",
      "Team accounts (up to 10)",
      "Custom branding",
      "API access",
      "Dedicated support",
      "Analytics export",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-20 md:pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">USAM Pro</h1>
            <p className="text-muted-foreground mb-6">Every Arab Professional Deserves a Better Community</p>
            <div className="inline-flex items-center gap-3 bg-secondary rounded-full p-1">
              <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!annual ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Monthly</button>
              <button onClick={() => setAnnual(true)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${annual ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>Annual <span className="text-launchpad text-xs">Save 20%</span></button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`bg-card rounded-2xl p-6 flex flex-col ${plan.highlighted ? "border-2 border-primary-glow shadow-lg relative" : "border border-border"}`}>
                {plan.highlighted && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary-glow text-primary-foreground text-xs font-medium rounded-full">Most Popular</span>}
                <div className="flex items-center gap-2 mb-2">
                  <plan.icon className={`w-5 h-5 ${plan.highlighted ? "text-primary-glow" : "text-muted-foreground"}`} />
                  <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-foreground">${annual ? plan.price.annual : plan.price.monthly}</span>
                  {plan.price.monthly > 0 && <span className="text-sm text-muted-foreground">/mo</span>}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? "text-primary-glow" : "text-launchpad"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full ${plan.highlighted ? "bg-primary-glow text-primary-foreground hover:bg-primary-glow/90" : ""}`} variant={plan.highlighted ? "default" : "outline"}>
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
