import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ToggleLeft, ToggleRight, Save, Check, DollarSign, Settings, Flag } from 'lucide-react';
import { adminSettingsService } from '../services/adminSettings.service';
import { toast } from 'sonner';

const SETTINGS_TABS = [
  { id: 'flags',    label: 'Feature Flags', icon: Flag },
  { id: 'settings', label: 'Settings',      icon: Settings },
  { id: 'pricing',  label: 'Pricing',       icon: DollarSign },
];

function FlagsTab() {
  const qc = useQueryClient();
  const { data: flags, isLoading } = useQuery({
    queryKey: ['admin', 'flags'],
    queryFn: adminSettingsService.getFlags,
  });
  const { mutate: toggle, variables: toggling } = useMutation({
    mutationFn: adminSettingsService.toggleFlag,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'flags'] }),
    onError: () => toast.error('Failed to toggle flag'),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-glow" /></div>;

  return (
    <div className="space-y-2">
      {flags?.map((flag: any) => (
        <div key={flag.name} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground text-sm">{flag.name}</p>
            {flag.description && <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>}
            <p className="text-xs text-muted-foreground mt-1">Updated {new Date(flag.updated_at).toLocaleDateString()}</p>
          </div>
          <button onClick={() => toggle(flag.name)} className="flex-shrink-0 transition-colors">
            {flag.is_enabled
              ? <ToggleRight className="w-8 h-8 text-primary-glow" />
              : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
          </button>
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: adminSettingsService.getSettings,
  });
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const { mutate: update } = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => adminSettingsService.updateSetting(key, value),
    onSuccess: (_, { key }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setSaved((p) => ({ ...p, [key]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 2000);
      toast.success(`Setting "${key}" saved`);
    },
    onError: () => toast.error('Failed to save'),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-glow" /></div>;

  return (
    <div className="space-y-3">
      {settings?.map((s: any) => (
        <div key={s.key} className="bg-card border border-border rounded-xl px-5 py-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">{s.key}</label>
          {s.description && <p className="text-xs text-muted-foreground mb-2">{s.description}</p>}
          <div className="flex gap-2">
            {s.type === 'boolean' ? (
              <button onClick={() => update({ key: s.key, value: s.value === 'true' ? 'false' : 'true' })}
                className="flex items-center gap-2 text-sm text-foreground">
                {s.value === 'true' ? <ToggleRight className="w-7 h-7 text-primary-glow" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                {s.value === 'true' ? 'Enabled' : 'Disabled'}
              </button>
            ) : (
              <>
                <input
                  value={editValues[s.key] ?? s.value ?? ''} onChange={(e) => setEditValues((p) => ({ ...p, [s.key]: e.target.value }))}
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-glow/30 text-foreground" />
                <button onClick={() => update({ key: s.key, value: editValues[s.key] ?? s.value })}
                  className="px-4 py-2 rounded-lg bg-primary-glow text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:bg-primary-glow/90 transition-colors">
                  {saved[s.key] ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {saved[s.key] ? 'Saved' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PricingTab() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin', 'pricing'],
    queryFn: adminSettingsService.getPricing,
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-glow" /></div>;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {plans?.map((plan: any) => (
        <div key={plan.id} className={`bg-card border rounded-xl p-5 ${plan.is_featured ? 'border-primary-glow/40' : 'border-border'}`}>
          {plan.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-primary-glow/10 text-primary-glow font-medium mb-3 inline-block">Most Popular</span>}
          <h3 className="font-bold text-foreground text-lg">{plan.name}</h3>
          <p className="text-3xl font-bold text-primary-glow mt-2">${plan.price_monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          {plan.description && <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>}
          <div className="mt-4 space-y-1.5">
            {(plan.features as string[] ?? []).map((f: string) => (
              <p key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Check className="w-3 h-3 text-primary-glow flex-shrink-0" />{f}
              </p>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">Subscribers: <span className="text-foreground font-semibold">{plan.subscribers_count ?? 0}</span></p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SettingsPanel() {
  const [tab, setTab] = useState('flags');
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings & Configuration</h1>
        <p className="text-sm text-muted-foreground">Manage platform settings, feature flags, and pricing</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {SETTINGS_TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${tab === id ? 'bg-primary-glow text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      {tab === 'flags' && <FlagsTab />}
      {tab === 'settings' && <SettingsTab />}
      {tab === 'pricing' && <PricingTab />}
    </div>
  );
}
