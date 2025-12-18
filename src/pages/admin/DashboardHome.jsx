import React, { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
    RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DollarSign, Users, ShoppingBag, PieChart as PieIcon, BarChart as BarIcon, Activity, Layers, Disc, Megaphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
// Assurez-vous que ce chemin est correct selon votre structure de dossiers
import AdminLayout from '../../components/admin/AdminLayout';

const DashboardHome = () => {
    // KPI State avec valeurs par défaut sécurisées
    const [kpi, setKpi] = useState({ revenue: 0, usersCount: 0, productsCount: 0, ordersCount: 0 });
    const [graphData, setGraphData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartType, setChartType] = useState('line');
    const [bannerText, setBannerText] = useState("");

    // URL API (LOCAL)
    const API_URL = "https://tkb-shop.onrender.com";

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Récupération des Stats Globales
                const statsRes = await fetch(`${API_URL}/api/admin/stats`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setKpi(statsData || { revenue: 0, usersCount: 0, productsCount: 0, ordersCount: 0 });
                }

                // 2. Récupération des Commandes pour le Graphique
                const ordersRes = await fetch(`${API_URL}/api/admin/orders`);
                if (ordersRes.ok) {
                    const ordersData = await ordersRes.json();

                    // Calcul de la distribution par statut
                    // On vérifie que ordersData est bien un tableau avant de filtrer
                    if (Array.isArray(ordersData)) {
                        const distribution = [
                            { name: 'Livré', value: ordersData.filter(o => o.status === 'Livré').length, fill: '#22c55e' }, // Vert
                            { name: 'En cours', value: ordersData.filter(o => o.status === 'En préparation' || o.status === 'En attente').length, fill: '#eab308' }, // Jaune
                            { name: 'Annulé', value: ordersData.filter(o => o.status === 'Annulé').length, fill: '#ef4444' }, // Rouge
                        ];
                        setGraphData(distribution);
                    }
                }

                // 3. Récupération du texte de la bannière
                const settingsRes = await fetch(`${API_URL}/api/settings`);
                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    setBannerText(data.bannerText || "");
                }

            } catch (err) {
                console.error("Erreur Dashboard:", err);
                toast.error("Impossible de charger les données du tableau de bord.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fonction pour sauvegarder la bannière
    const saveBanner = async () => {
        try {
            await fetch(`${API_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bannerText })
            });
            toast.success("Bannière mise à jour ! (Actualisez le site pour voir)");
        } catch (error) {
            console.error(error);
            toast.error("Erreur sauvegarde bannière");
        }
    };

    // Fonction de rendu des graphiques
    const renderChart = () => {
        const commonProps = { width: "100%", height: "100%" };
        const tooltipStyle = { backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' };

        // Si pas de données, ne rien afficher pour éviter les erreurs Recharts
        if (!graphData || graphData.length === 0) return null;

        switch (chartType) {
            case 'bar':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <BarChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
                                {graphData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <AreaChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                );
            case 'radial':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={20} data={graphData}>
                            <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff' }} background clockWise dataKey="value" />
                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
                            <Tooltip contentStyle={tooltipStyle} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                );
            case 'pie':
            default:
                return (
                    <ResponsiveContainer {...commonProps}>
                        <PieChart>
                            <Pie data={graphData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                {graphData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <AdminLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-1">Tableau de Bord</h1>
                <p className="text-slate-400">Suivi de votre boutique en temps réel.</p>
            </div>

            {/* --- ZONE DE CONFIGURATION BANNIÈRE PUB --- */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8 flex flex-col md:flex-row gap-4 items-end shadow-lg">
                <div className="flex-1 w-full">
                    <label className="text-slate-400 text-sm mb-2 block flex items-center gap-2">
                        <Megaphone size={16} className="text-pink-500" /> Message de la bannière publicitaire (Haut du site)
                    </label>
                    <input
                        type="text"
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        placeholder="Ex: 🔥 SOLDES D'ÉTÉ : -50% sur tout le site !"
                        className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl p-3 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all"
                    />
                </div>
                <button
                    onClick={saveBanner}
                    className="bg-pink-600 hover:bg-pink-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-900/20 active:scale-95 whitespace-nowrap"
                >
                    Mettre à jour
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex justify-between items-center shadow-lg">
                    <div><p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Revenus</p><h3 className="text-2xl font-bold text-white mt-1">{kpi.revenue ? kpi.revenue.toLocaleString() : 0} F</h3></div>
                    <div className="p-3 bg-green-500/10 text-green-400 rounded-xl"><DollarSign size={24} /></div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex justify-between items-center shadow-lg">
                    <div><p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Clients</p><h3 className="text-2xl font-bold text-white mt-1">{kpi.usersCount || 0}</h3></div>
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Users size={24} /></div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex justify-between items-center shadow-lg">
                    <div><p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Produits</p><h3 className="text-2xl font-bold text-white mt-1">{kpi.productsCount || 0}</h3></div>
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><ShoppingBag size={24} /></div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex justify-between items-center shadow-lg">
                    <div><p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Commandes</p><h3 className="text-2xl font-bold text-white mt-1">{kpi.ordersCount || 0}</h3></div>
                    <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl"><Activity size={24} /></div>
                </div>
            </div>

            {/* Graph Section */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-[500px] flex flex-col shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2"><PieIcon size={20} className="text-blue-500" /> Analyse des Ventes</h3>

                    {/* Chart Selector */}
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                        {[
                            { id: 'line', icon: Activity, label: 'Ligne' },
                            { id: 'pie', icon: PieIcon, label: 'Cercle' },
                            { id: 'bar', icon: BarIcon, label: 'Barre' },
                            { id: 'area', icon: Layers, label: 'Aire' },
                            { id: 'radial', icon: Disc, label: 'Radial' },
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setChartType(type.id)}
                                className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${chartType === type.id
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                                title={type.label}
                            >
                                <type.icon size={16} />
                                <span className="hidden lg:inline">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 w-full min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">Chargement des données...</div>
                    ) : graphData.length > 0 && graphData.some(d => d.value > 0) ? (
                        renderChart()
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <PieIcon size={48} className="mb-4 opacity-20" />
                            <p>Aucune commande pour le moment.</p>
                            <p className="text-sm opacity-60">Les statistiques apparaîtront dès la première vente.</p>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default DashboardHome;