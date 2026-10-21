import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import USAMLogo from "@/components/USAMLogo";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { COMMUNITIES } from "@/lib/communities";
import { useMutation } from "@tanstack/react-query";
import { onboardingService } from "@/services/onboarding.service";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/user.service";
import { toast } from "sonner";
import type { ProfessionalRole } from "@/lib/types";

const TOTAL_STEPS = 5;

// Personas drive the differentiated community experience + persona-aware
// recommendations. Keys MUST match the backend VALID_ROLES
// (onboarding.controller.js) and PERSONA_COMMUNITY_AFFINITY keys
// (community.controller.js).
const PERSONAS: { key: ProfessionalRole; emoji: string; label: string; desc: string }[] = [
  { key: "freelancer",   emoji: "🧑‍💻", label: "Freelancer",    desc: "I work independently on projects" },
  { key: "student",      emoji: "🎓", label: "Student",        desc: "I'm studying or a recent grad" },
  { key: "job_seeker",   emoji: "🔍", label: "Job Seeker",     desc: "I'm looking for my next role" },
  { key: "entrepreneur", emoji: "🚀", label: "Entrepreneur",   desc: "I'm building a startup or venture" },
  { key: "recruiter",    emoji: "🧑‍💼", label: "Recruiter",     desc: "I hire and source talent" },
  { key: "employer",     emoji: "🏢", label: "Employer",       desc: "I run a team or company" },
  { key: "mentor",       emoji: "🧭", label: "Mentor",         desc: "I guide and coach others" },
];

const GOALS = ["Find a job or internship", "Grow my freelance business", "Build my network", "Learn new skills", "Get mentorship", "Discover funding & grants", "Showcase my work", "Meet co-founders"];
// UI experience levels mapped to the backend ENUM (beginner/intermediate/expert).
const EXPERIENCE_LEVELS: { key: string; label: string; desc: string; backend: 'beginner' | 'intermediate' | 'expert' }[] = [
  { key: "student",      label: "Student",        desc: "Currently enrolled or recent grad", backend: "beginner" },
  { key: "junior",       label: "Junior (0-2y)",   desc: "Early career professional",        backend: "beginner" },
  { key: "intermediate", label: "Mid-Level (3-5y)", desc: "Established professional",        backend: "intermediate" },
  { key: "senior",       label: "Senior (6y+)",    desc: "Experienced leader",               backend: "expert" },
];
const POPULAR_SKILLS = ["React", "Python", "Figma", "Node.js", "Data Analysis", "Marketing", "TypeScript", "AI/ML", "Business Dev", "Project Mgmt", "UI/UX", "Content Writing", "SEO", "Sales", "AWS", "Flutter"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [communities, setCommunities] = useState<string[]>([]);
  const [personas, setPersonas]       = useState<ProfessionalRole[]>([]);
  const [goals, setGoals]             = useState<string[]>([]);
  const [skills, setSkills]           = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("intermediate");
  const [headline, setHeadline]       = useState("");
  const [bio, setBio]                 = useState("");
  const [location, setLocation]       = useState("");

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => {
      const level = EXPERIENCE_LEVELS.find((l) => l.key === experienceLevel)?.backend ?? "beginner";
      return onboardingService.submit({
        communities,
        professional_roles: personas,
        goals,
        skills,
        experience_level: level,
        headline,
        bio,
        location,
      });
    },
    onSuccess: async () => {
      const updated = await userService.getMe();
      setUser(updated);
      toast.success("Welcome to USAM Hub! 🎉");
      navigate("/dashboard");
    },
    onError: () => toast.error("Something went wrong"),
  });

  const toggleItem = <T extends string>(list: T[], setList: (v: T[]) => void, item: T, max = 10) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : list.length < max ? [...list, item] : list);
  };

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 page-enter">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <USAMLogo size="md" />
          <h1 className="text-2xl font-bold text-foreground mt-4">Welcome! Let's set you up</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step} of {TOTAL_STEPS}</p>
        </div>
        <Progress value={progress} className="mb-8 h-1.5" />

        {/* Step 1: Communities */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Which communities fit you?</h2>
              <p className="text-muted-foreground text-sm mt-1">Choose one or more</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {COMMUNITIES.map((c) => {
                const active = communities.includes(c.id);
                return (
                  <button key={c.id} onClick={() => toggleItem(communities, setCommunities, c.id, 4)}
                    className={`relative p-4 rounded-xl border-2 text-start transition-all ${active ? "border-primary-glow bg-primary-glow/5" : "border-border bg-card hover:border-primary-glow/40"}`}>
                    {active && <Check className="absolute top-2 end-2 w-4 h-4 text-primary-glow" />}
                    <span className="text-2xl block mb-2">{c.emoji}</span>
                    <p className="font-semibold text-foreground text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.tagline}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Personas — drives differentiated experience + recommendations */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">What best describes you?</h2>
              <p className="text-muted-foreground text-sm mt-1">Pick all that apply — we'll tailor your experience</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PERSONAS.map((p) => {
                const active = personas.includes(p.key);
                return (
                  <button key={p.key} onClick={() => toggleItem(personas, setPersonas, p.key, PERSONAS.length)}
                    className={`relative p-4 rounded-xl border-2 text-start transition-all ${active ? "border-primary-glow bg-primary-glow/5" : "border-border bg-card hover:border-primary-glow/40"}`}>
                    {active && <Check className="absolute top-2 end-2 w-4 h-4 text-primary-glow" />}
                    <span className="text-2xl block mb-2">{p.emoji}</span>
                    <p className="font-semibold text-foreground text-sm">{p.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Experience & Goals */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Your experience level</h2>
              <div className="grid grid-cols-2 gap-3">
                {EXPERIENCE_LEVELS.map((l) => (
                  <button key={l.key} onClick={() => setExperienceLevel(l.key)}
                    className={`p-4 rounded-xl border-2 text-start transition-all ${experienceLevel === l.key ? "border-primary-glow bg-primary-glow/5" : "border-border bg-card hover:border-primary-glow/40"}`}>
                    {experienceLevel === l.key && <Check className="float-right w-4 h-4 text-primary-glow" />}
                    <p className="font-semibold text-foreground text-sm">{l.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{l.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">What are your goals? <span className="text-muted-foreground font-normal text-sm">(pick up to 3)</span></h2>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((g) => (
                  <button key={g} onClick={() => toggleItem(goals, setGoals, g, 3)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${goals.includes(g) ? "bg-primary-glow text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
                    {goals.includes(g) && "✓ "}{g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Skills */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Your key skills</h2>
              <p className="text-muted-foreground text-sm mt-1">Pick up to 8 skills — you can add more later</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SKILLS.map((s) => (
                <button key={s} onClick={() => toggleItem(skills, setSkills, s, 8)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${skills.includes(s) ? "bg-primary-glow text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}>
                  {skills.includes(s) && "✓ "}{s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Profile basics */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-foreground">Almost there!</h2>
              <p className="text-muted-foreground text-sm mt-1">Complete your public profile</p>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Professional Headline</label>
              <input value={headline} onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Full-Stack Developer · React & Node.js"
                className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Bio <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                placeholder="Tell the community a bit about yourself…"
                className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30 resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Cairo, Egypt"
                className="w-full px-3 py-2.5 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
          )}
          <Button
            className="flex-1 gap-2 bg-primary-glow text-primary-foreground h-11"
            onClick={() => step < TOTAL_STEPS ? setStep(step + 1) : submit()}
            disabled={(step === 1 && communities.length === 0) || (step === 2 && personas.length === 0) || isPending}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : step < TOTAL_STEPS ? <><span>Continue</span><ChevronRight className="w-4 h-4" /></> : <><span>Get Started 🚀</span></>}
          </Button>
        </div>

        {step === 1 && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            You can change your communities anytime in settings
          </p>
        )}
      </div>
    </div>
  );
}
