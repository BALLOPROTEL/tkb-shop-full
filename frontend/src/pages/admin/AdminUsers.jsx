import React, { useState, useEffect } from 'react';
import { Search, Trash2, Users, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data.reverse());
    } catch (error) { console.error(error); toast.error("Erreur clients"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      toast.success("Compte supprimé");
      fetchUsers();
    } catch (error) { console.error(error); toast.error("Échec"); }
  };


  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    try {
      const res = await api.post('/api/admin/invites', { email });
      toast.success(`Invitation envoyee (valide ${res.data?.expiresIn || 5} min)`);
      setInviteEmail('');
    } catch (error) {
      const msg = error.response?.data?.detail || "Erreur d'invitation";
      toast.error(msg);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-slate-950 min-h-screen text-slate-200">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-8"><Users className="text-blue-500" /> Base Clients</h1>

      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-bold">Ajouter un administrateur</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Email du futur admin"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none"
          />
          <button
            type="button"
            onClick={handleInvite}
            disabled={inviting || !inviteEmail.trim()}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50"
          >
            {inviting ? 'Envoi...' : 'Ajouter'}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          L'invitation est valable 5 minutes et ne fonctionne que pour un compte deja inscrit.
        </p>
      </div>
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-6 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input type="text" placeholder="Email ou Nom..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent outline-none" />
      </div>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-slate-950 text-slate-500 text-xs font-bold uppercase">
            <tr><th className="p-6">Utilisateur</th><th className="p-6">Email</th><th className="p-6">Rôle</th><th className="p-6 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan="4" className="p-20 text-center"><Loader className="animate-spin mx-auto" /></td></tr>
            ) : users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.includes(searchTerm)).length === 0 ? (
              <tr><td colSpan="4" className="p-16 text-center text-slate-500 text-sm">Aucun utilisateur trouvé.</td></tr>
            ) : (
              users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.includes(searchTerm)).map(u => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-6 flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs">{u.name[0]}</div><span className="font-bold">{u.name}</span></td>
                  <td className="p-6 text-slate-400">{u.email}</td>
                  <td className="p-6"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>{u.role}</span></td>
                  <td className="p-6 text-right"><button onClick={() => handleDelete(u.id)} className="text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;

