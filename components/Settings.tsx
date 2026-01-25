
import React, { useState, useEffect } from 'react';
import { Product, Order, User, CompanyConfig, SupplierMapping, WattMapping } from '../types';

interface SettingsProps {
  products: Product[];
  orders: Order[];
  users: User[];
  supplierMappings: SupplierMapping[];
  onUpdateMappings: (mappings: SupplierMapping[]) => void;
  wattMappings: WattMapping[];
  onUpdateWattMappings: (mappings: WattMapping[]) => void;
  onDataImport: (data: { products: Product[], orders: Order[], users?: User[] }) => void;
  syncStatus?: 'idle' | 'synced' | 'error' | 'pending-permission' | 'testing';
  onOpenFile?: () => void;
  onReconnect?: () => void;
  fileName?: string;
  isAdmin?: boolean;
  lowStockThreshold: number;
  onUpdateThreshold: (val: number) => void;
  companyConfig: CompanyConfig;
  onUpdateCompanyConfig: (config: CompanyConfig) => void;
  version?: string;
}

const Settings: React.FC<SettingsProps> = ({ 
  products, 
  orders, 
  syncStatus, 
  onOpenFile, 
  onReconnect,
  isAdmin = false,
  lowStockThreshold,
  onUpdateThreshold,
  companyConfig,
  onUpdateCompanyConfig,
  version
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CompanyConfig>(companyConfig);
  const [testResults, setTestResults] = useState<{name: string, status: 'PASS' | 'FAIL' | 'IDLE'}[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    setEditingConfig(companyConfig);
  }, [companyConfig]);

  const saveConfig = () => {
    onUpdateCompanyConfig(editingConfig);
    setIsEditing(false);
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingConfig(prev => ({ 
      ...prev, 
      [name]: name === 'invoiceSequence' ? Number(value) : value 
    }));
  };

  const isLocal = syncStatus === 'testing';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* Cloud & Data Control */}
      <div className={`p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden transition-all duration-700 ${isLocal ? 'bg-gradient-to-br from-indigo-600 to-blue-800' : 'bg-[#050a30]'}`}>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                {isLocal ? '📡' : '☁️'}
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">
                  {isLocal ? 'Local Workspace' : 'Shared Workspace'}
                </h2>
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em]">
                  {isLocal ? 'Database restricted to this device' : 'Fully synced with company Google Account'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={onOpenFile}
                className="px-8 py-3 bg-white text-indigo-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20"
              >
                Refresh Cloud Data
              </button>
              <button 
                type="button"
                onClick={onReconnect}
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all border border-blue-400/30"
              >
                Reconnect Google Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Preferences Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-4 mb-2">
           <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl">⚠️</div>
           <div>
              <h3 className="text-lg font-black text-slate-800 uppercase">Stock & Alerting Prefs</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Configure when stock alerts should trigger</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Low Stock Threshold (Units)</label>
            <div className="flex gap-4">
              <input 
                type="number"
                value={lowStockThreshold}
                onChange={(e) => onUpdateThreshold(Number(e.target.value))}
                className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
              <div className="px-5 py-3.5 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs flex items-center justify-center min-w-[100px]">
                {lowStockThreshold} Min
              </div>
            </div>
            <p className="text-[9px] text-slate-400 font-medium italic mt-2">Any SKU with stock below this number will flash red on the Dashboard.</p>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Serial Number Logic</label>
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
               <p className="text-xs font-bold text-slate-600">Yearly Reset: <span className="text-green-600">ENABLED</span></p>
               <p className="text-[9px] text-slate-400 mt-2">The sequence resets to 1001 automatically every January 1st to keep billing years distinct.</p>
             </div>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className={`bg-white p-8 rounded-[2.5rem] border-2 transition-all duration-300 ${isEditing ? 'border-blue-500 shadow-2xl shadow-blue-500/10' : 'border-slate-100 shadow-sm'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${isEditing ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                {isEditing ? '✍️' : '🏢'}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Business Profile</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage Address, GST & Branding</p>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => isEditing ? saveConfig() : setIsEditing(true)}
              className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${
                isEditing 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100'
              }`}
            >
              {isEditing ? '💾 Save All Changes' : '✏️ Edit Profile'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <ProfileField label="Entity Name" name="name" value={isEditing ? editingConfig.name : companyConfig.name} isEditing={isEditing} onChange={handleConfigChange} />
            <ProfileField label="GSTIN Identification" name="gstin" value={isEditing ? editingConfig.gstin : companyConfig.gstin} isEditing={isEditing} onChange={handleConfigChange} />
            <ProfileField label="Registered Address" name="address" value={isEditing ? editingConfig.address : companyConfig.address} isEditing={isEditing} onChange={handleConfigChange} isTextArea />
            <ProfileField label="Company Tagline" name="tagline" value={isEditing ? editingConfig.tagline : companyConfig.tagline} isEditing={isEditing} onChange={handleConfigChange} />
            <ProfileField label="Contact Phone" name="phone" value={isEditing ? editingConfig.phone : companyConfig.phone} isEditing={isEditing} onChange={handleConfigChange} />
            <ProfileField label="Corporate Email" name="email" value={isEditing ? editingConfig.email : companyConfig.email} isEditing={isEditing} onChange={handleConfigChange} />
            <ProfileField label="Next Manual Serial" name="invoiceSequence" value={String(isEditing ? editingConfig.invoiceSequence : companyConfig.invoiceSequence)} isEditing={isEditing} onChange={handleConfigChange} type="number" />
          </div>
        </div>
      )}
    </div>
  );
};

interface ProfileFieldProps {
  label: string;
  name: string;
  value: string;
  isEditing: boolean;
  onChange: (e: any) => void;
  isTextArea?: boolean;
  type?: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({ label, name, value, isEditing, onChange, isTextArea, type = "text" }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
    {isEditing ? (
      isTextArea ? (
        <textarea name={name} value={value} onChange={onChange} rows={3} className="w-full px-4 py-3 bg-blue-50/50 border-2 border-blue-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm transition-all resize-none" />
      ) : (
        <input name={name} value={value} type={type} onChange={onChange} className="w-full px-4 py-3 bg-blue-50/50 border-2 border-blue-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm transition-all" />
      )
    ) : (
      <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-700 min-h-[46px] flex items-center">{value || <span className="text-slate-300 italic font-medium text-xs">Unspecified</span>}</div>
    )}
  </div>
);

export default Settings;
