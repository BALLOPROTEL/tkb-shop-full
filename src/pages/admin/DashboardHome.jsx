import React, { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, AreaChart, Area,
    RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DollarSign, Users, Calendar, PieChart as PieIcon, BarChart as BarIcon, Activity, Layers, Disc } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';

const DashboardHome = () => {
    const [kpi, setKpi] = useState({ revenue: 0, usersCount: 0, bookingsCount: 0 });
    const [graphData, setGraphData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chartType, setChartType] = useState('pie'); // 'pie', 'bar', 'line', 'area', 'radial'

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. KPIs
                const statsRes = await fetch('https://protel-backend.onrender.com/api/admin/stats');
                const statsData = await statsRes.json();
                setKpi(statsData);

                // 2. Données pour le graphe
                const bookingsRes = await fetch('https://protel-backend.onrender.com/api/admin/bookings');
                const bookingsData = await bookingsRes.json();

                // Calcul répartition
                const distribution = [
                    { name: 'Confirmé', value: bookingsData.filter(b => b.status === 'confirmed').length, fill: '#22c55e' }, // Vert
                    { name: 'En attente', value: bookingsData.filter(b => b.status === 'pending').length, fill: '#eab308' }, // Jaune
                    { name: 'Annulé', value: bookingsData.filter(b => b.status === 'cancelled').length, fill: '#ef4444' }, // Rouge
                ];

                setGraphData(distribution);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Fonction pour rendre le bon graphique selon le choix
    const renderChart = () => {
        const commonProps = { width: "100%", height: "100%" };
        const tooltipStyle = { backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' };

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
                <p className="text-slate-400">Suivi en temps réel.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex justify-between">
                    <div><p className="text-slate-400 text-sm">Revenus</p><h3 className="text-3xl font-bold text-white mt-2">{kpi.revenue}€</h3></div>
                    <div className="p-3 bg-green-500/10 text-green-400 rounded-xl h-fit"><DollarSign /></div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex justify-between">
                    <div><p className="text-slate-400 text-sm">Utilisateurs</p><h3 className="text-3xl font-bold text-white mt-2">{kpi.usersCount}</h3></div>
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl h-fit"><Users /></div>
                </div>
                <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex justify-between">
                    <div><p className="text-slate-400 text-sm">Réservations</p><h3 className="text-3xl font-bold text-white mt-2">{kpi.bookingsCount}</h3></div>
                    <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl h-fit"><Calendar /></div>
                </div>
            </div>

            {/* Section Graphique avec Sélecteur */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-[500px] flex flex-col">

                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-white font-bold text-lg">Analyse des Réservations</h3>

                    {/* SÉLECTEUR DE GRAPHIQUE */}
                    <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                        {[
                            { id: 'pie', icon: PieIcon, label: 'Pie' },
                            { id: 'bar', icon: BarIcon, label: 'Bar' },
                            { id: 'line', icon: Activity, label: 'Ligne' },
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
                                <type.icon size={18} />
                                <span className="hidden md:inline">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Zone de rendu du graphique */}
                <div className="flex-1 w-full min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-full text-slate-500">Chargement...</div>
                    ) : graphData.length > 0 ? (
                        renderChart()
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500">Aucune donnée à afficher</div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default DashboardHome;