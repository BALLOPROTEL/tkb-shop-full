import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Map, LogOut, Package, Menu, X, ShoppingBag } from 'lucide-react';

const AdminLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin' },
        { icon: Package, label: 'Commandes', path: '/admin/orders' },
        { icon: ShoppingBag, label: 'Produits', path: '/admin/products' },
        { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 flex text-slate-100 font-sans">

            {/* --- MOBILE OVERLAY (Fond noir quand menu ouvert) --- */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* --- SIDEBAR (Barre Latérale) --- */}
            <aside className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-30 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static md:block
      `}>
                <div className="h-20 flex items-center px-8 border-b border-slate-800">
                    {/* TEXTE CHANGÉ ICI */}
                    <span className="font-bold text-xl tracking-tight text-white font-serif">
                        TKB_SHOP<span className="text-blue-500">.Admin</span>
                    </span>
                </div>

                <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)} // Ferme le menu sur mobile au clic
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 mt-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 w-full transition-colors rounded-xl hover:bg-slate-800"
                    >
                        <LogOut size={20} />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            {/* --- CONTENU PRINCIPAL --- */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

                {/* Header Mobile (Visible seulement sur petit écran) */}
                <div className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 shrink-0">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-white p-2">
                        <Menu size={24} />
                    </button>
                    <span className="ml-4 font-bold text-lg">Menu Admin</span>
                </div>

                {/* Zone de contenu scrollable */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>

        </div>
    );
};

export default AdminLayout;