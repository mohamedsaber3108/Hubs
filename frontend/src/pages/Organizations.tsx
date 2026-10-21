import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Loader2, Search, BadgeCheck, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useOrganizations, useCreateOrganizationMutation } from "@/hooks/api/useOffers";
import { useAuth } from "@/contexts/AuthContext";

function CreateOrgModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { mutate: create, isPending } = useCreateOrganizationMutation();
  const [form, setForm] = useState({ name: "", tagline: "", website: "", industry: "" });

  const submit = () => {
    create(
      {
        name: form.name,
        tagline: form.tagline || undefined,
        website: form.website || undefined,
        industry: form.industry || undefined,
      },
      { onSuccess: (org) => { onClose(); navigate(`/organizations/${org.slug}`); } },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-foreground">Create your organization</h2>
        <p className="text-sm text-muted-foreground mt-1">You'll be the owner. Verification by an admin is required before publishing offers.</p>
        <div className="space-y-3 mt-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Organization name *"
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
          <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Tagline"
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
          <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="Website (https://…)"
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
          <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Industry"
            className="w-full px-3 py-2.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30" />
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <Button onClick={submit} disabled={!form.name.trim() || isPending} className="flex-1 bg-primary-glow text-primary-foreground">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Organizations() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useOrganizations({ search: search || undefined });
  const orgs = data?.data ?? [];

  return (
    <>
      <Navbar />
      <main className="page-enter pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Building2 className="w-7 h-7 text-primary-glow" /> Organizations
              </h1>
              <p className="text-muted-foreground mt-1">Partner companies and institutions in the USAM ecosystem</p>
            </div>
            <Button onClick={() => (isLoggedIn ? setCreating(true) : navigate('/auth/signin'))} className="bg-primary-glow text-primary-foreground">
              <Plus className="w-4 h-4 mr-1" /> Create organization
            </Button>
          </div>

          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search organizations…"
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-secondary rounded-lg border-0 focus:outline-none text-foreground placeholder:text-muted-foreground" />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary-glow" /></div>
          ) : orgs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No organizations yet</p>
              <p className="text-sm mt-1">Be the first to create one</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {orgs.map((org) => (
                <Link key={org.id} to={`/organizations/${org.slug}`}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary-glow/40 transition-all flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {org.logo_url ? <img src={org.logo_url} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-semibold text-foreground truncate">{org.name}</h2>
                      {org.is_verified && <BadgeCheck className="w-4 h-4 text-primary-glow flex-shrink-0" />}
                    </div>
                    {org.tagline && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{org.tagline}</p>}
                    {org.industry && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{org.industry}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {creating && <CreateOrgModal onClose={() => setCreating(false)} />}
    </>
  );
}
