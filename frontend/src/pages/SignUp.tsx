import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "@/hooks/api/useAuth";
import { toast } from "sonner";
import { Eye, EyeOff, Check, Upload, X, ChevronRight, ChevronLeft, PartyPopper } from "lucide-react";
import USAMLogo from "@/components/USAMLogo";
import { COMMUNITIES } from "@/lib/communities";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}

const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
const strengthColors = ["bg-destructive", "bg-freelance", "bg-hrconnect", "bg-launchpad"];

function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  const style: React.CSSProperties = {
    position: "fixed",
    left: `${Math.random() * 100}vw`,
    top: "-20px",
    width: `${6 + Math.random() * 8}px`,
    height: `${6 + Math.random() * 8}px`,
    backgroundColor: color,
    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
    animation: `confettiFall ${2 + Math.random() * 2}s linear ${delay}s forwards`,
    zIndex: 60,
    pointerEvents: "none",
  };
  return <div style={style} />;
}

const confettiColors = [
  "hsl(172, 68%, 27%)", // primary-glow
  "hsl(24, 100%, 63%)", // freelance
  "hsl(136, 66%, 47%)", // launchpad
  "hsl(175, 42%, 50%)", // hrconnect
  "hsl(45, 100%, 60%)",
  "hsl(280, 80%, 60%)",
];

export default function SignUp() {
  const navigate = useNavigate();
  const { mutate: register, isPending: registering } = useRegisterMutation();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([]);

  // Step 3
  const [avatar, setAvatar] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const pwStrength = getPasswordStrength(password);
  const progressValue = (step / 4) * 100;

  const toggleCommunity = (id: string) => {
    setSelectedCommunities((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleAvatarDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setAvatar(URL.createObjectURL(file));
    }
  }, []);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  const canNext =
    step === 1 ? name && email && password.length >= 6 :
    step === 2 ? true :
    step === 3 ? true : false;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 page-enter">
      {/* Confetti on step 4 */}
      {step === 4 &&
        Array.from({ length: 100 }).map((_, i) => (
          <ConfettiParticle
            key={i}
            delay={Math.random() * 1.5}
            color={confettiColors[i % confettiColors.length]}
          />
        ))}

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/">
            <USAMLogo size="md" />
          </Link>
        </div>

        {/* Progress */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Step {step} of 3</span>
              <span>{Math.round((step / 3) * 100)}%</span>
            </div>
            <Progress value={(step / 3) * 100} className="h-2" />
          </div>
        )}

        {/* Steps */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {step === 1 && (
            <div className="space-y-6 page-enter">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Who are you?</h2>
                <p className="text-muted-foreground mt-1">Let's get to know you</p>
              </div>

              {/* Floating label inputs */}
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="peer w-full px-4 pt-5 pb-2 border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none placeholder-transparent"
                    placeholder="Full Name"
                    id="name"
                  />
                  <label
                    htmlFor="name"
                    className="absolute left-4 top-2 text-xs text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-glow"
                  >
                    Full Name
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="peer w-full px-4 pt-5 pb-2 border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none placeholder-transparent"
                    placeholder="Email"
                    id="email"
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-4 top-2 text-xs text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-glow"
                  >
                    Email Address
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="peer w-full px-4 pt-5 pb-2 pr-12 border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none placeholder-transparent"
                    placeholder="Password"
                    id="password"
                  />
                  <label
                    htmlFor="password"
                    className="absolute left-4 top-2 text-xs text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-glow"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password strength */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i < pwStrength ? strengthColors[pwStrength - 1] : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {pwStrength > 0 ? strengthLabels[pwStrength - 1] : "Too short"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 page-enter">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Choose Your Communities</h2>
                <p className="text-muted-foreground mt-1">Select one or more spaces to join</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMMUNITIES.map((c) => {
                  const selected = selectedCommunities.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCommunity(c.id)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        selected
                          ? "border-primary-glow bg-primary/5 shadow-md"
                          : "border-border bg-card hover:border-muted-foreground/30"
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary-glow flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className="text-2xl mb-1">{c.emoji}</div>
                      <div className="font-semibold text-foreground">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{c.tagline}</div>
                      <div className="text-xs text-muted-foreground mt-1">{c.members} members</div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setSelectedCommunities(COMMUNITIES.map((c) => c.id))}
                className="text-sm text-primary-glow hover:underline"
              >
                Skip — join all communities
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 page-enter">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Quick Profile Setup</h2>
                <p className="text-muted-foreground mt-1">Help others get to know you</p>
              </div>

              {/* Avatar */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleAvatarDrop}
                onClick={() => fileRef.current?.click()}
                className="w-24 h-24 mx-auto rounded-full border-2 border-dashed border-border bg-surface-elevated flex items-center justify-center cursor-pointer hover:border-primary-glow transition-colors overflow-hidden"
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="peer w-full px-4 pt-5 pb-2 border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none placeholder-transparent"
                    placeholder="Country"
                    id="country"
                  />
                  <label
                    htmlFor="country"
                    className="absolute left-4 top-2 text-xs text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-glow"
                  >
                    Country
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="peer w-full px-4 pt-5 pb-2 border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none placeholder-transparent"
                    placeholder="City"
                    id="city"
                  />
                  <label
                    htmlFor="city"
                    className="absolute left-4 top-2 text-xs text-muted-foreground transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs peer-focus:text-primary-glow"
                  >
                    City
                  </label>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 200))}
                  rows={3}
                  className="w-full px-4 pt-5 pb-2 border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none resize-none"
                  placeholder="Tell us about yourself..."
                />
                <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                  {bio.length}/200
                </span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-6 page-enter py-8">
              <div className="w-20 h-20 mx-auto bg-primary-glow/10 rounded-full flex items-center justify-center">
                <PartyPopper className="w-10 h-10 text-primary-glow" />
              </div>
              <h2 className="text-3xl font-extrabold text-foreground">Welcome, {name}! 🎉</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                You've joined{" "}
                {selectedCommunities.length > 0
                  ? selectedCommunities
                      .map((id) => COMMUNITIES.find((c) => c.id === id)?.name)
                      .filter(Boolean)
                      .join(", ")
                  : "all communities"}
                . Your journey starts now.
              </p>
              <Link to="/dashboard">
                <Button size="lg" className="bg-primary-glow hover:bg-primary-glow/90 text-primary-foreground mt-4">
                  Go to Dashboard
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 4 && (
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canNext}
                className="bg-primary-glow hover:bg-primary-glow/90 text-primary-foreground"
              >
                {step === 3 ? "Complete" : "Next"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Sign in link */}
        {step < 4 && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/auth/signin" className="text-primary-glow hover:underline font-medium">
              Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
