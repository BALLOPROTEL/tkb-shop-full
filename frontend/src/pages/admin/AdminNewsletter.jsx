import React, { useEffect, useMemo, useState } from 'react';
import { Mail, Search, Loader, ArrowDownUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';

const AdminNewsletter = () => {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [loading, setLoading] = useState(true);

    const fetchNewsletter = async () => {
        try {
            const res = await api.get('/api/admin/newsletter');
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            toast.error('Erreur newsletter');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNewsletter();
    }, []);

    const filteredItems = useMemo(() => {
        const list = items.filter((item) =>
            item.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        switch (sortBy) {
            case 'oldest':
                return list.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
            case 'alpha':
                return list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
            case 'recent':
            default:
                return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        }
    }, [items, searchTerm, sortBy]);

    const formatDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <div className="p-4 sm:p-6 bg-slate-950 min-h-screen text-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Mail className="text-pink-400" /> Newsletter
                </h1>
                <div className="text-xs uppercase tracking-widest text-slate-500">
                    {items.length} inscription(s)
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mb-6">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <Search className="text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher un email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm"
                    />
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <ArrowDownUp className="text-slate-400" size={18} />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent outline-none text-sm text-slate-200"
                    >
                        <option value="recent">Plus recents</option>
                        <option value="oldest">Plus anciens</option>
                        <option value="alpha">A - Z</option>
                    </select>
                </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-x-auto">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-950 text-slate-500 text-xs font-bold uppercase">
                        <tr>
                            <th className="p-6">Email</th>
                            <th className="p-6">Inscription</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {loading ? (
                            <tr>
                                <td colSpan="2" className="p-20 text-center">
                                    <Loader className="animate-spin mx-auto" />
                                </td>
                            </tr>
                        ) : filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan="2" className="p-16 text-center text-slate-500 text-sm">
                                    Aucune inscription trouvee.
                                </td>
                            </tr>
                        ) : (
                            filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="p-6 text-sm font-semibold text-slate-200">{item.email}</td>
                                    <td className="p-6 text-sm text-slate-400">{formatDate(item.createdAt)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminNewsletter;
