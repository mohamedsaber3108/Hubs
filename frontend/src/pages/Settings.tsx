import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User, Shield, Bell, Palette, Globe, Trash2, Lock,
  ChevronRight, Save, Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import DarkModeToggle from "@/components/DarkModeToggle";
import { COMMUNITIES } from "@/lib/communities";
import { useAuth } from "@/contexts/AuthContext";

const TABS = [
  { label: "Account", icon: User },
  { label: "Profile", icon: User },
  { label: "Communities", icon: Globe },
  { label: "Notifications", icon: Bell },
  { label: "Privacy", icon: Shield },
  { label: "Appearance", icon: Palette },
  { label: "Danger Zone", icon: Trash2 },
];

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar tabs */}
            <nav className="lg:w-56 shrink-0 flex lg:flex-col gap-1 overflow-x-auto">
              {TABS.map((tab, i) => (
                <button
                  key={tab.label}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    activeTab === i
                      ? "bg-primary-glow/10 text-primary-glow font-medium"
                      : tab.label === "Danger Zone"
                        ? "text-destructive hover:bg-destructive/10"
                        : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0 page-enter">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                {activeTab === 0 && (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">Account</h2>
                    {[
                      { label: "Email", value: user?.email ?? "", type: "email" },
                      { label: "Username", value: user?.username ?? "", type: "text" },
                    ].map((f) => (
                      <div key={f.label}>
                        <label className="text-sm text-muted-foreground mb-1 block">{f.label}</label>
                        <input
                          type={f.type}
                          defaultValue={f.value}
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none text-sm"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Change Password</label>
                      <input
                        type="password"
                        placeholder="New password"
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground input-glow focus:outline-none text-sm"
                      />
                    </div>
                  </>
                )}

                {activeTab === 1 && (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">Profile</h2>
                    <p className="text-sm text-muted-foreground">
                      Edit your full profile on the{" "}
                      <Link to="/profile/edit" className="text-primary-glow hover:underline">profile edit page</Link>.
                    </p>
                  </>
                )}

                {activeTab === 2 && (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">Communities</h2>
                    <div className="space-y-3">
                      {COMMUNITIES.map((c) => {
                        const isMember = user?.communities?.some((uc: any) => (uc.slug || uc) === c.id) ?? false;
                        return (
                          <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{c.emoji}</span>
                              <div>
                                <div className="font-medium text-foreground text-sm">{c.name}</div>
                                <div className="text-xs text-muted-foreground">{c.members} members</div>
                              </div>
                            </div>
                            <Button variant={isMember ? "outline" : "default"} size="sm" className={isMember ? "" : "bg-primary-glow text-primary-foreground"}>
                              {isMember ? "Leave" : "Join"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {activeTab === 3 && (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                    {["Events & Activities", "Messages", "Opportunities", "Challenges", "Connection Requests", "Weekly Digest"].map((pref) => (
                      <label key={pref} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{pref}</span>
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[hsl(172,68%,27%)]" />
                      </label>
                    ))}
                  </>
                )}

                {activeTab === 4 && (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">Privacy</h2>
                    {[
                      { label: "Profile visibility", options: ["Public", "Community Only", "Private"] },
                      { label: "Who can message me", options: ["Anyone", "Connections Only", "Nobody"] },
                      { label: "Show activity status", options: ["Everyone", "Connections Only", "Hidden"] },
                    ].map((setting) => (
                      <div key={setting.label}>
                        <label className="text-sm text-muted-foreground mb-1 block">{setting.label}</label>
                        <select className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm">
                          {setting.options.map((opt) => <option key={opt}>{opt}</option>)}
                        </select>
                      </div>
                    ))}
                  </>
                )}

                {activeTab === 5 && (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Dark Mode</span>
                      <DarkModeToggle />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Language</label>
                      <select className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm">
                        <option>English</option>
                        <option>Arabic</option>
                        <option>Both</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Font Size</label>
                      <select className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm">
                        <option>Small</option>
                        <option>Medium</option>
                        <option>Large</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 6 && (
                  <>
                    <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border border-destructive/30">
                        <h3 className="font-medium text-foreground text-sm">Deactivate Account</h3>
                        <p className="text-xs text-muted-foreground mt-1">Temporarily disable your account. You can reactivate at any time.</p>
                        <Button variant="outline" size="sm" className="mt-3 text-destructive border-destructive/30 hover:bg-destructive/10">
                          Deactivate
                        </Button>
                      </div>
                      <div className="p-4 rounded-lg border border-destructive/30">
                        <h3 className="font-medium text-foreground text-sm">Delete Account</h3>
                        <p className="text-xs text-muted-foreground mt-1">Permanently delete your account and all data. This cannot be undone.</p>
                        <Button variant="destructive" size="sm" className="mt-3">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Save button */}
                {activeTab < 6 && (
                  <div className="pt-4 border-t border-border">
                    <Button onClick={handleSave} className="bg-primary-glow hover:bg-primary-glow/90 text-primary-foreground">
                      {saved ? <><Check className="w-4 h-4 mr-1" /> Saved!</> : <><Save className="w-4 h-4 mr-1" /> Save Changes</>}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
