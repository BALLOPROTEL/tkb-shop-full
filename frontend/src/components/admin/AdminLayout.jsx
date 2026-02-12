import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, Menu, ArrowLeft, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
            {/* Mobile top bar */}
            <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 rounded-lg hover:bg-slate-800"
                    aria-label="Ouvrir le menu"
                >
                    <Menu size={20} />
                </button>
                <span className="font-black tracking-tighter text-blue-400">TKB CONTROL</span>
                <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-lg hover:bg-slate-800"
                    aria-label="Retour boutique"
                >
                    <ArrowLeft size={18} />
                </button>
            </div>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside
                className={[
                    "fixed inset-y-0 left-0 z-50 bg-slate-900 border-r border-slate-800",
                    "transition-all duration-300 transform overflow-y-auto flex flex-col",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                    "lg:translate-x-0 w-72 sm:w-80",
                    isCollapsed ? "lg:w-20" : "lg:w-64",
                ].join(" ")}
            >
                <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
                    {(!isCollapsed || isMobileMenuOpen) && (
                        <span className="font-black tracking-tighter text-blue-400">TKB CONTROL</span>
                    )}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden p-2 hover:bg-slate-800 rounded-lg"
                            aria-label="Fermer le menu"
                        >
                            <X size={18} />
                        </button>
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="hidden lg:inline-flex p-2 hover:bg-slate-800 rounded-lg"
                            aria-label="Réduire le menu"
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                </div>

                <nav className="mt-8 px-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${location.pathname === item.path
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'hover:bg-slate-800 text-slate-400'
                                }`}
                        >
                            <item.icon size={20} />
                            {(!isCollapsed || isMobileMenuOpen) && <span className="text-sm font-semibold">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto px-4 pb-6 space-y-2 pt-8">
                    <button
                        onClick={() => { setIsMobileMenuOpen(false); navigate('/'); }}
                        className="w-full flex items-center gap-4 px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-xl transition-all font-bold text-sm"
                    >
                        <ArrowLeft size={20} /> {(!isCollapsed || isMobileMenuOpen) && "Retour boutique"}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm"
                    >
                        <LogOut size={20} /> {(!isCollapsed || isMobileMenuOpen) && "Déconnexion"}
                    </button>
                </div>
            </aside>

            <main className={`flex-grow transition-all duration-300 p-4 sm:p-6 lg:p-8 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                {children}
            </main>
        </div>
    );
}
