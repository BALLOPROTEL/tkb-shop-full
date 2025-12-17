import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // <--- AJOUTER useNavigate
import { LayoutDashboard, Users, Map, CalendarCheck, LogOut, Settings } from 'lucide-react';

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate(); // <--- INITIALISER le hook

    // ... (Garde la constante menuItems telle quelle) ...
    const menuItems = [
        { icon: LayoutDashboard, label: 'Tableau de bord', path: '/admin' },
        { icon: CalendarCheck, label: 'Réservations', path: '/admin/bookings' },
        { icon: Map, label: 'Offres & Logements', path: '/admin/offers' },
        { icon: Users, label: 'Utilisateurs', path: '/admin/users' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 flex text-slate-100 font-sans">

            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur flex flex-col fixed h-full z-10">
                <div className="h-20 flex items-center px-8 border-b border-slate-800">
                    <span className="font-bold text-xl tracking-tight text-white">
                        PROTEL<span className="text-blue-500">.Admin</span>
                    </span>
                </div>

                <nav className="flex-1 py-6 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
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

                <div className="p-4 border-t border-slate-800">
                    {/* --- MODIFICATION ICI : Ajout de onClick --- */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 w-full transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Déconnexion</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;