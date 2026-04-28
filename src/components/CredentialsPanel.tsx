import { useState } from 'react';
import { hasCredentials, type StoredConfig } from '../lib/storage';

type CredentialsPanelProps = {
  config: StoredConfig;
  onChange: (config: StoredConfig) => void;
};

export function CredentialsPanel({ config, onChange }: CredentialsPanelProps) {
  const update = (field: keyof StoredConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const allFilled = hasCredentials(config);

  return (
    <div className="p-4 border-b border-slate-200 dark:border-navy-600/50">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Credentials</div>
      <div className="space-y-2.5">
        <Field label="Provider Client ID" tooltip="The OAuth client ID issued by the data provider. Identifies your application when requesting consent from end users." placeholder="" value={config.clientId} onChange={(v) => update('clientId', v)} />
        <Field label="Broker Access Token" tooltip="A bearer token issued by the Quickli broker that authenticates your API requests." placeholder="bd32c01c-5ccf-4891-ac72-be95baa83a30" value={config.brokerAccessToken} onChange={(v) => update('brokerAccessToken', v)} />
      </div>
      <div className="space-y-2.5 mt-3 pt-3 border-t border-slate-200/60 dark:border-navy-600/30">
        <Field label="Key ID" tooltip="The identifier for your signing key pair, used to look up the corresponding public key when verifying request signatures." placeholder="key_..." value={config.keyId} onChange={(v) => update('keyId', v)} />
        <div>
          <FieldLabel label="Private Key (PEM)" tooltip="The private key corresponding to the Key ID above. Used to sign API requests so the broker can verify their authenticity." />
          <textarea
            value={config.privateKey}
            onChange={(e) => update('privateKey', e.target.value)}
            placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
            className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-navy-500 rounded-md bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-200 font-mono text-xs outline-none focus:border-slate-400 dark:focus:border-brand-400/60 focus:ring-1 focus:ring-slate-400/20 dark:focus:ring-brand-400/20 resize-y min-h-[60px]"
            rows={3}
          />
        </div>
      </div>
      <div className={`flex items-center gap-2 mt-3 px-2.5 py-2 rounded-md text-xs font-medium ${allFilled ? 'bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-600/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${allFilled ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        {allFilled ? 'All credentials configured' : 'Missing credentials'}
      </div>
    </div>
  );
}

function FieldLabel({ label, tooltip }: { label: string; tooltip: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center gap-1.5 mb-1">
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-navy-600 text-slate-400 dark:text-slate-500 hover:bg-slate-300 dark:hover:bg-navy-500 hover:text-slate-500 dark:hover:text-slate-400 transition-colors text-[9px] font-bold leading-none cursor-help"
      >
        ?
      </button>
      {show && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-56 px-3 py-2 rounded-lg bg-slate-800 dark:bg-navy-600 text-[11px] leading-relaxed text-slate-100 shadow-lg ring-1 ring-slate-700/50 dark:ring-navy-500/50 pointer-events-none">
          <div className="absolute -top-1 left-3 w-2 h-2 rotate-45 bg-slate-800 dark:bg-navy-600" />
          {tooltip}
        </div>
      )}
    </div>
  );
}

function Field({ label, tooltip, placeholder, value, onChange, type = 'text' }: {
  label: string;
  tooltip: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'password';
}) {
  return (
    <div>
      <FieldLabel label={label} tooltip={tooltip} />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 border border-slate-300 dark:border-navy-500 rounded-md bg-white dark:bg-navy-800 text-slate-800 dark:text-slate-200 font-mono text-xs outline-none focus:border-slate-400 dark:focus:border-brand-400/60 focus:ring-1 focus:ring-slate-400/20 dark:focus:ring-brand-400/20"
      />
    </div>
  );
}
