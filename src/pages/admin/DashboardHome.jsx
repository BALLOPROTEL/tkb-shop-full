import React, { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
    RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DollarSign, Users, ShoppingBag, PieChart as PieIcon, BarChart as BarIcon, Activity, Layers, Disc, Megaphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_BASE_URL } from '../../config'; // <--- IMPORT CONFIG

const DashboardHome = () => {
    const [kpi, setKpi] = useState({ revenue: 0, usersCount: 0, productsCount: 0, ordersCount: 0 });
    const [graphData, setGraphData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartType, setChartType] = useState('line');
    const [bannerText, setBannerText] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Stats Globales
                const statsRes = await fetch(`${API_BASE_URL}/api/admin/stats`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setKpi(statsData || { revenue: 0, usersCount: 0, productsCount: 0, ordersCount: 0 });
                }

                // 2. Commandes pour Graphique
                const ordersRes = await fetch(`${API_BASE_URL}/api/admin/orders`);
                if (ordersRes.ok) {
                    const ordersData = await ordersRes.json();
                    if (Array.isArray(ordersData)) {
                        const distribution = [
                            { name: 'Livré', value: ordersData.filter(o => o.status === 'Livré').length, fill: '#22c55e' },
                            { name: 'En cours', value: ordersData.filter(o => o.status === 'En préparation' || o.status === 'En attente').length, fill: '#eab308' },
                            { name: 'Annulé', value: ordersData.filter(o => o.status === 'Annulé').length, fill: '#ef4444' },
                        ];
                        setGraphData(distribution);
                    }
                }

                // 3. Bannière
                const settingsRes = await fetch(`${API_BASE_URL}/api/settings`);
                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    setBannerText(data.bannerText || "");
                }

            } catch (err) {
                console.error("Erreur Dashboard:", err);
                toast.error("Erreur de chargement des données.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const saveBanner = async () => {
        try {
            await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bannerText })
            });
            toast.success("Bannière mise à jour !");
        } catch (error) {
            console.error(error);
            toast.error("Erreur sauvegarde bannière");
        }
    };

    const renderChart = () => {
        const commonProps = { width: "100%", height: "100%" };
        const tooltipStyle = { backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };

        if (!graphData || graphData.length === 0) return null;

        switch (chartType) {
            case 'bar':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <BarChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis stroke="#64748b" allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} />
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
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis stroke="#64748b" allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'area':
                return (
                    <ResponsiveContainer {...commonProps}>
                        <AreaChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis stroke="#64748b" allowDecimals={false} />
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

    // ⚠️ PAS DE <AdminLayout> ICI !
    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-1">Tableau de Bord</h1>
                <p className="text-slate-500">Suivi de votre boutique en temps réel.</p>
            </div>

            {/* --- CONFIG BANNIÈRE --- */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-end shadow-sm">
                <div className="flex-1 w-full">
                    <label className="text-slate-500 text-sm mb-2 block flex items-center gap-2 font-bold uppercase">
                        <Megaphone size={16} className="text-pink-600" /> Message de la bannière (Haut du site)
                    </label>
                    <input
                        type="text"
                        value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        placeholder="Ex: 🔥 SOLDES D'ÉTÉ : -50% sur tout le site !"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all"
                    />
                </div>
                <button
                    onClick={saveBanner}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-200 active:scale-95 whitespace-nowrap"
                >
                    Mettre à jour
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div><p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Revenus</p><h3 className="text-2xl font-bold text-slate-900 mt-1">{kpi.revenue ? kpi.revenue.toLocaleString() : 0} F</h3></div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl"><DollarSign size={24} /></div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div><p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Clients</p><h3 className="text-2xl font-bold text-slate-900 mt-1">{kpi.usersCount || 0}</h3></div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div><p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Produits</p><h3 className="text-2xl font-bold text-slate-900 mt-1">{kpi.productsCount || 0}</h3></div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><ShoppingBag size={24} /></div>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl flex justify-between items-center shadow-sm hover:shadow-md transition-shadow">
                    <div><p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Commandes</p><h3 className="text-2xl font-bold text-slate-900 mt-1">{kpi.ordersCount || 0}</h3></div>
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Activity size={24} /></div>
                </div>
            </div>

            {/* Graph Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 h-[500px] flex flex-col shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2"><PieIcon size={20} className="text-blue-600" /> Analyse des Ventes</h3>

                    {/* Chart Selector */}
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
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
                                    ? 'bg-white text-blue-600 shadow-sm font-bold'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
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
                        <div className="flex items-center justify-center h-full text-slate-400 animate-pulse">Chargement des données...</div>
                    ) : graphData.length > 0 && graphData.some(d => d.value > 0) ? (
                        renderChart()
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <PieIcon size={48} className="mb-4 opacity-20" />
                            <p>Aucune commande pour le moment.</p>
                            <p className="text-sm opacity-60">Les statistiques apparaîtront dès la première vente.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;