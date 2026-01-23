
import React, { useState } from 'react';
import { User } from '../types';

interface UserProfileProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedUser: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email || '',
    phone: user.phone || ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...user,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone
    });
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-all z-10"
          >
            ✕
          </button>
        </div>
        
        <div className="px-10 pb-10 -mt-12 relative">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-white p-1 shadow-xl mb-4">
              <div className="w-full h-full rounded-[1.8rem] bg-slate-100 flex items-center justify-center text-4xl font-black text-blue-600">
                {formData.firstName.charAt(0)}
              </div>
            </div>
            
            {!isEditing ? (
              <>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{formData.firstName} {formData.lastName}</h2>
                <div className="mt-2 px-4 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  {user.role} Account
                </div>
              </>
            ) : (
              <h2 className="text-xl font-black text-blue-600 uppercase tracking-widest">Update Profile</h2>
            )}
          </div>

          <form onSubmit={handleSave} className="mt-10 space-y-6">
            <div className="grid grid-cols-1 gap-5">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <EditField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                    <EditField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                  </div>
                  <EditField label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" />
                  <EditField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
                </>
              ) : (
                <>
                  <ProfileItem icon="📧" label="Email Address" value={formData.email || 'Not Provided'} />
                  <ProfileItem icon="📱" label="Phone Number" value={formData.phone || 'Not Provided'} />
                  <ProfileItem icon="🆔" label="Username" value={`@${user.username}`} />
                  <ProfileItem icon="🛡️" label="Access Level" value={user.role === 'admin' ? 'Unlimited Admin Access' : 'Restricted Staff Access'} />
                </>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              {isEditing ? (
                <>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"
                  >
                    ✏️ Edit Profile
                  </button>
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const EditField: React.FC<{ label: string, name: string, value: string, onChange: (e: any) => void, type?: string }> = ({ label, name, value, onChange, type = "text" }) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm transition-all"
      required
    />
  </div>
);

const ProfileItem: React.FC<{ icon: string, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
      {icon}
    </div>
    <div className="flex-1 text-left">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-slate-700">{value}</p>
    </div>
  </div>
);

export default UserProfile;
