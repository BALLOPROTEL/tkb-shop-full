import React, { useState, useEffect } from 'react';
import { Search, Trash2, Users, Shield, User, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/admin/users`)
      .then(res => {
        if (!res.ok) throw new Error("Erreur réseau");
        return res.json();
      })
      .then(data => {
        // Tri : Plus récents en haut (si l'ID est un ObjectId, le tri par ID inverse marche aussi)
        // Sinon on suppose que le tableau arrive dans l'ordre d'insertion, donc on reverse.
        setUsers(data.reverse());
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur users", err);
        toast.error("Impossible de charger les utilisateurs");
        setLoading(false);
      });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Utilisateur supprimé");
        fetchUsers();
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur réseau");
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-slate-200">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users className="text-blue-500" /> Gestion des Utilisateurs
        </h1>
        <p className="text-slate-400">Consultez et gérez les comptes clients et administrateurs.</p>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 shadow-lg flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-white placeholder:text-slate-500"
        />
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold border-b border-slate-700">
              <tr>
                <th className="p-6">Utilisateur</th>
                <th className="p-6">Email</th>
                <th className="p-6">Rôle</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {loading ? (
                <tr><td colSpan="4" className="p-10 text-center text-slate-500"><Loader className="animate-spin mx-auto mb-2" />Chargement...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-slate-500">Aucun utilisateur trouvé.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold border border-slate-600">
                          {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                        </div>
                        <span className="font-bold text-white">{user.name || "Sans nom"}</span>
                      </div>
                    </td>
                    <td className="p-6 text-slate-400 font-medium">
                      {user.email}
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'admin'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                        {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                        {user.role}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;