import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, Menu, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'admin') {
            toast.error("Accès restreint aux administrateurs");
            navigate('/');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        toast.success("Déconnexion réussie");
        navigate('/');
        window.location.reload();
    };

    const menuItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Tableau de bord' },
        { path: '/admin/products', icon: Package, label: 'Gestion Stocks' },
        { path: '/admin/orders', icon: ShoppingBag, label: 'Commandes' },
        { path: '/admin/users', icon: Users, label: 'Clients' },
    ];

    return (
        <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans">
            <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-slate-900 border-r border-slate-800 transition-all duration-300 fixed h-full z-50`}>
                <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
                    {!isCollapsed && <span className="font-black tracking-tighter text-blue-400">TKB CONTROL</span>}
                    <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-slate-800 rounded-lg"><Menu size={18} /></button>
                </div>
                <nav className="mt-8 px-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link key={item.path} to={item.path} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 text-slate-400'}`}>
                            <item.icon size={20} />
                            {!isCollapsed && <span className="text-sm font-semibold">{item.label}</span>}
                        </Link>
                    ))}
                </nav>
                <div className="absolute bottom-8 w-full px-4 space-y-2">
                    <button onClick={() => navigate('/')} className="w-full flex items-center gap-4 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl transition-all font-bold text-sm">
                        <ArrowLeft size={20} /> {!isCollapsed && "Retour boutique"}
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm">
                        <LogOut size={20} /> {!isCollapsed && "Déconnexion"}
                    </button>
                </div>
            </aside>
            <main className={`flex-grow transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} p-8`}>
                {children}
            </main>
        </div>
    );
}
