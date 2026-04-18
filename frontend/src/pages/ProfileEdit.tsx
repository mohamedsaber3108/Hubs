import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Upload, Save, Check, Plus, X, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { SKILL_TAGS } from "@/lib/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfileMutation } from "@/hooks/api/useAuth";
import { userService } from "@/services/user.service";
import { toast } from "sonner";

export default function ProfileEdit() {
  const { user, setUser }         = useAuth();
  const { mutate: updateProfile, isPending } = useUpdateProfileMutation();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName]   = useState(user?.last_name || "");
  const [username, setUsername]   = useState(user?.username || "");
  const [headline, setHeadline]   = useState(user?.headline || "");
  const [bio, setBio]             = useState(user?.bio || "");
  const [avatar, setAvatar]       = useState(user?.avatar_url || "");
  const [location, setLocation]   = useState(user?.location || "");
  const [saved, setSaved]         = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name); setLastName(user.last_name);
      setUsername(user.username); setHeadline(user.headline || "");
      setBio(user.bio || ""); setAvatar(user.avatar_url || "");
      setLocation(user.location || "");
    }
  }, [user]);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatar(URL.createObjectURL(file));
    setUploading(true);
    try {
      const res = await userService.uploadAvatar(file);
      setUser({ ...user!, avatar_url: res.data.data.avatar_url });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Avatar upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateProfile({ first_name: firstName, last_name: lastName, username, headline, bio, location }, {
      onSuccess: (u) => { setUser(u); setSaved(true); setTimeout(() => setSaved(false), 2000); },
    });
  };

  const allTags = Array.from(new Set(Object.values(SKILL_TAGS).flat()));

  return (
    <>
      <Navbar />
      <main className="page-enter pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
              <p className="text-muted-foreground text-sm mt-1">Update your public profile</p>
            </div>
            <div className="flex gap-3">
              <Link to={`/profile/${user?.username}`}><Button variant="outline">Cancel</Button></Link>
              <Button onClick={handleSave} disabled={isPending || uploading} className="gap-2 bg-primary-glow text-primary-foreground">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? "Saved!" : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <img src={avatar || `https://ui-avatars.com/api/?name=${firstName}&background=14b8a6&color=fff`} alt="" className="w-20 h-20 rounded-full object-cover" />
                {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full"><Loader2 className="w-5 h-5 animate-spin text-white" /></div>}
              </div>
              <div>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="w-4 h-4" /> Change Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 5MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">First Name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Last Name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full pl-7 pr-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
              </div>
            </div>

            {/* Headline */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Professional Headline</label>
              <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Senior UX Designer · Figma Expert" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell the community about yourself…" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30 resize-none" />
              <p className="text-xs text-muted-foreground mt-1 text-end">{bio.length}/500</p>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Location</label>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Cairo, Egypt" className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
