
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
  users, 
  supplierMappings,
  onUpdateMappings,
  wattMappings,
  onUpdateWattMappings,
  syncStatus, 
  onOpenFile, 
  isAdmin = false,
  lowStockThreshold,
  onUpdateThreshold,
  companyConfig,
  onUpdateCompanyConfig,
  version
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CompanyConfig>(companyConfig);
  const [newMapping, setNewMapping] = useState({ supplierSku: '', supplierName: '', tevoltaSku: '', tevoltaName: '' });
  const [newWattMapping, setNewWattMapping] = useState({ tevoltaSku: '', watts: '' });
  const [mappingSearch, setMappingSearch] = useState('');
  const [wattSearch, setWattSearch] = useState('');
  
  const cloudFileId = localStorage.getItem('tevolta_gdrive_file_id');

  useEffect(() => {
    setEditingConfig(companyConfig);
  }, [companyConfig]);

  const saveConfig = () => {
    onUpdateCompanyConfig(editingConfig);
    setIsEditing(false);
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleAddMapping = (e: React.FormEvent) => {
    e.preventDefault();
    const mapping: SupplierMapping = {
      id: Math.random().toString(36).substr(2, 9),
      ...newMapping
    };
    onUpdateMappings([mapping, ...supplierMappings]);
    setNewMapping({ supplierSku: '', supplierName: '', tevoltaSku: '', tevoltaName: '' });
  };

  const handleAddWattMapping = (e: React.FormEvent) => {
    e.preventDefault();
    const mapping: WattMapping = {
      id: Math.random().toString(36).substr(2, 9),
      ...newWattMapping
    };
    onUpdateWattMappings([mapping, ...wattMappings]);
    setNewWattMapping({ tevoltaSku: '', watts: '' });
  };

  const deleteMapping = (id: string) => {
    onUpdateMappings(supplierMappings.filter(m => m.id !== id));
  };

  const deleteWattMapping = (id: string) => {
    onUpdateWattMappings(wattMappings.filter(m => m.id !== id));
  };

  const filteredMappings = supplierMappings.filter(m => 
    m.supplierSku.toLowerCase().includes(mappingSearch.toLowerCase()) ||
    m.supplierName.toLowerCase().includes(mappingSearch.toLowerCase()) ||
    m.tevoltaSku.toLowerCase().includes(mappingSearch.toLowerCase())
  );

  const filteredWattMappings = wattMappings.filter(m => 
    m.tevoltaSku.toLowerCase().includes(wattSearch.toLowerCase()) ||
    m.watts.toLowerCase().includes(wattSearch.toLowerCase())
  );

  const isLocal = syncStatus === 'testing';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* Synchronization Control Hub */}
      <div className={`p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden transition-all duration-700 ${isLocal ? 'bg-gradient-to-br from-indigo-600 to-blue-800' : 'bg-[#050a30]'}`}>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                {isLocal ? '📦' : '☁️'}
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">
                  {isLocal ? 'Offline Mode' : 'Shared Workspace'}
                </h2>
                <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em]">
                  {isLocal ? 'Connect Google Drive to share data with staff' : 'Fully synced with organization cloud'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                onClick={onOpenFile}
                className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl shadow-blue-900/20"
              >
                {isLocal ? 'Link Company Google Account' : 'Force Cloud Sync'}
              </button>
            </div>
          </div>
          
          {!isLocal && cloudFileId && (
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Master Shared Database ID</span>
                <span className="text-[10px] font-mono text-blue-300 select-all">{cloudFileId}</span>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Share the `tevolta_cloud_db.json` file on Drive with other staff.</p>
            </div>
          )}
        </div>
      </div>

      {/* Corporate Profile Management */}
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
          </div>
        </div>
      )}

      {/* Supplier Item Mapping Section */}
      {isAdmin && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">🔗</div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Supplier Catalog Mapping</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link external item IDs to Tevolta inventory</p>
            </div>
          </div>

          <form onSubmit={handleAddMapping} className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="md:col-span-1 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier SKU</label>
              <input placeholder="UT-50-..." value={newMapping.supplierSku} onChange={e => setNewMapping({...newMapping, supplierSku: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs" required />
            </div>
            <div className="md:col-span-1 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Supplier Name</label>
              <input placeholder="External Name" value={newMapping.supplierName} onChange={e => setNewMapping({...newMapping, supplierName: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs" required />
            </div>
            <div className="md:col-span-1 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tevolta SKU</label>
              <input placeholder="TEV-50-..." value={newMapping.tevoltaSku} onChange={e => setNewMapping({...newMapping, tevoltaSku: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs" required />
            </div>
            <div className="md:col-span-1 space-y-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tevolta Name</label>
              <input placeholder="Local Product Name" value={newMapping.tevoltaName} onChange={e => setNewMapping({...newMapping, tevoltaName: e.target.value})} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs" required />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">Add Entry</button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="relative max-w-sm">
              <span className="absolute left-4 top-2.5 text-slate-400">🔍</span>
              <input type="text" placeholder="Search mapping..." value={mappingSearch} onChange={e => setMappingSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
            </div>
            <div className="max-h-[250px] overflow-y-auto border border-slate-100 rounded-2xl custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Supplier Data</th>
                    <th className="px-6 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">→</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Internal Catalog</th>
                    <th className="px-6 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredMappings.map(m => (
                    <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4"><span className="block text-[10px] font-black text-slate-800">{m.supplierSku}</span><span className="text-[10px] text-slate-500">{m.supplierName}</span></td>
                      <td className="px-6 py-4 text-center text-blue-500 text-xs">⚡</td>
                      <td className="px-6 py-4"><span className="block text-[10px] font-black text-blue-600">{m.tevoltaSku}</span><span className="text-[10px] text-slate-500">{m.tevoltaName}</span></td>
                      <td className="px-6 py-4 text-right"><button onClick={() => deleteMapping(m.id)} className="text-red-400 hover:text-red-600 p-2">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Wattage Technical Specification Mapping Section */}
      {isAdmin && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">⚡</div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Technical Specification Mapping</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Item IDs to Standard Wattage (W)</p>
            </div>
          </div>

          <form onSubmit={handleAddWattMapping} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-amber-50/30 p-6 rounded-3xl border border-amber-100">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest ml-1">Tevolta SKU</label>
              <input placeholder="TEV-..." value={newWattMapping.tevoltaSku} onChange={e => setNewWattMapping({...newWattMapping, tevoltaSku: e.target.value})} className="w-full px-4 py-2 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-xs" required />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest ml-1">Standard Wattage</label>
              <input placeholder="e.g. 50W, 100W" value={newWattMapping.watts} onChange={e => setNewWattMapping({...newWattMapping, watts: e.target.value})} className="w-full px-4 py-2 bg-white border border-amber-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-xs" required />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-lg">Link Specification</button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="relative max-w-sm">
              <span className="absolute left-4 top-2.5 text-slate-400">🔍</span>
              <input type="text" placeholder="Search specs..." value={wattSearch} onChange={e => setWattSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium" />
            </div>
            <div className="max-h-[250px] overflow-y-auto border border-slate-100 rounded-2xl custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tevolta Item ID</th>
                    <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Standard Wattage</th>
                    <th className="px-6 py-3 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredWattMappings.map(m => (
                    <tr key={m.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-4 font-black text-[10px] text-slate-800">{m.tevoltaSku}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black">{m.watts}</span></td>
                      <td className="px-6 py-4 text-right"><button onClick={() => deleteWattMapping(m.id)} className="text-red-400 hover:text-red-600 p-2">✕</button></td>
                    </tr>
                  ))}
                  {filteredWattMappings.length === 0 && (
                    <tr><td colSpan={3} className="py-10 text-center text-slate-400 text-[10px] font-bold uppercase italic">No technical specs defined.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual Data Controls */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl">💾</div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">System Controls</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Stock Alert Threshold</label>
            <div className="flex items-center gap-3">
              <input type="number" value={lowStockThreshold} onChange={(e) => onUpdateThreshold(Number(e.target.value))} className="w-24 px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units</span>
            </div>
          </div>
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-center gap-3">
             <button onClick={() => {}} className="w-full py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-blue-600 transition-all shadow-xl">Download Offline Backup (.JSON)</button>
          </div>
        </div>
      </div>
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
}

const ProfileField: React.FC<ProfileFieldProps> = ({ label, name, value, isEditing, onChange, isTextArea }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
    {isEditing ? (
      isTextArea ? (
        <textarea name={name} value={value} onChange={onChange} rows={3} className="w-full px-4 py-3 bg-blue-50/50 border-2 border-blue-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm transition-all resize-none" />
      ) : (
        <input name={name} value={value} onChange={onChange} className="w-full px-4 py-3 bg-blue-50/50 border-2 border-blue-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm transition-all" />
      )
    ) : (
      <div className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-700 min-h-[46px] flex items-center">{value || <span className="text-slate-300 italic font-medium text-xs">Unspecified</span>}</div>
    )}
  </div>
);

export default Settings;
