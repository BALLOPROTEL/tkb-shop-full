import React, { useState, useEffect } from 'react';
import { Search, Trash2 } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // CORRECTION MAJEURE ICI : On pointe vers le LOCAL
  const API_URL = "http://127.0.0.1:8000";

  // 1. Charger les utilisateurs depuis l'API Locale
  const fetchUsers = () => {
    fetch(`${API_URL}/api/admin/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Erreur users", err));
  };

  useEffect(() => { fetchUsers(); }, []);

  // 2. Supprimer un utilisateur
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await fetch(`${API_URL}/api/admin/users/${id}`, { method: 'DELETE' });
      fetchUsers(); // Rafraîchir la liste
    } catch (error) {
      console.error("Erreur suppression", error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="mb-8"><h1 className="text-3xl font-bold text-white mb-1">Utilisateurs (Local)</h1></div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6">
        <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2" />
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {/* 👇 AJOUTE CETTE DIV POUR LE SCROLL */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-sm uppercase border-b border-slate-700">
                <th className="p-6">Utilisateur</th><th className="p-6">Rôle</th><th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="3" className="p-6 text-center text-slate-500">Aucun utilisateur trouvé en local.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">{user.name.charAt(0).toUpperCase()}</div>
                        <div><h4 className="font-bold text-white">{user.name}</h4><div className="text-slate-400 text-sm">{user.email}</div></div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-400"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;