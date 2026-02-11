import React, { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import {
    DollarSign, Users, ShoppingBag, Activity, Megaphone, ArrowUpRight,
    TrendingUp, BarChart2, PieChart as PieIcon, Share2, Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';
import { getDisplayCategory, isNewProduct, isPromo } from '../../utils/product';

const DashboardHome = () => {
    const [kpi, setKpi] = useState({ revenue: 0, usersCount: 0, productsCount: 0, ordersCount: 0 });
    const [graphData, setGraphData] = useState([]);
    const [recentOrders, setRecentOrders] = useState([]);
    const [recentProducts, setRecentProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bannerText, setBannerText] = useState("");

    // État pour le type de graphique (Défaut: Cercle/Pie)
    const [chartType, setChartType] = useState('pie');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statsRes = await api.get('/api/admin/stats');
                setKpi(statsRes.data || { revenue: 0, usersCount: 0, productsCount: 0, ordersCount: 0 });

                const ordersRes = await api.get('/api/admin/orders');
                if (ordersRes.data) {
                    const data = Array.isArray(ordersRes.data) ? ordersRes.data : [];
                    setRecentOrders(data.slice(0, 6));
                    setGraphData([
                        { name: 'Livré', value: data.filter(o => o.status === 'Livré').length, fill: '#10b981' },
                        { name: 'En cours', value: data.filter(o => o.status !== 'Livré' && o.status !== 'Annulé').length, fill: '#f59e0b' },
                        { name: 'Annulé', value: data.filter(o => o.status === 'Annulé').length, fill: '#ef4444' },
                    ]);
                }

                const productsRes = await api.get('/api/products');
                if (productsRes.data) {
                    const items = Array.isArray(productsRes.data) ? productsRes.data : [];
                    const sorted = [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                    setRecentProducts(sorted.slice(0, 6));
                }

                const settingsRes = await api.get('/api/settings');
                if (settingsRes.data) {
                    const data = settingsRes.data || {};
                    setBannerText(data.bannerText || "");
                }
            } catch (err) {
                console.error(err);
                toast.error("Erreur de synchronisation.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const saveBanner = async () => {
        try {
            await api.post('/api/settings', { bannerText });
            toast.success("Bannière mise à jour");
        } catch (e) { console.error(e); toast.error("Échec"); }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
                Chargement du tableau de bord...
            </div>
        );
    }

    // Fonction de rendu dynamique du graphique
    const renderChart = () => {
        const tooltipStyle = { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' };

        switch (chartType) {
            case 'ligne':
                return (
                    <LineChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 6 }} />
                    </LineChart>
                );
            case 'barre':
                return (
                    <BarChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#1e293b' }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                            {graphData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                        </Bar>
                    </BarChart>
                );
            case 'aire':
                return (
                    <AreaChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={3} />
                    </AreaChart>
                );
            case 'radial':
                return (
                    <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="100%" barSize={20} data={graphData}>
                        <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={10} />
                        <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
                        <Tooltip contentStyle={tooltipStyle} />
                    </RadialBarChart>
                );
            default: // 'pie' (Cercle)
                return (
                    <PieChart>
                        <Pie data={graphData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {graphData.map((e, i) => <Cell key={i} fill={e.fill} stroke="none" />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                    </PieChart>
                );
        }
    };

    return (
        <div className="space-y-8 text-slate-200">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Console de Commande</h1>
                    <p className="text-slate-500 text-sm">Monitoring des flux de vente en temps réel.</p>
                </div>
                <div className="flex bg-slate-900 border border-slate-800 p-2 rounded-2xl items-center gap-3">
                    <Megaphone size={18} className="text-blue-400 ml-2" />
                    <input
                        type="text" value={bannerText}
                        onChange={(e) => setBannerText(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs text-slate-300 w-48"
                    />
                    <button onClick={saveBanner} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-500 transition-all">Mettre à jour</button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Revenus Totaux', val: `${kpi.revenue.toLocaleString()} F`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Utilisateurs', val: kpi.usersCount, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Catalogue', val: kpi.productsCount, icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    { label: 'Commandes', val: kpi.ordersCount, icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                ].map((item, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all group">
                        <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <item.icon size={24} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</p>
                        <p className="text-2xl font-black text-white mt-1">{item.val}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Section Graphiques Dynamiques */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl h-[450px] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider">Graphique</h3>

                        {/* Sélecteur de type de graphique */}
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                            {[
                                { id: 'pie', icon: PieIcon, label: 'Cercle' },
                                { id: 'barre', icon: BarChart2, label: 'Barre' },
                                { id: 'ligne', icon: TrendingUp, label: 'Ligne' },
                                { id: 'aire', icon: Share2, label: 'Aire' },
                                { id: 'radial', icon: Target, label: 'Radial' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setChartType(type.id)}
                                    title={type.label}
                                    className={`p-2 rounded-lg transition-all ${chartType === type.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <type.icon size={16} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ANALYSE DES VENTES RÉCENTES */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-[450px]">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                            <ArrowUpRight size={18} className="text-emerald-400" /> Analyse des Ventes
                        </h3>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-bold">Flux en direct</span>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-950/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Produit</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Montant</th>
                                    <th className="px-6 py-4 text-right">État</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-200 text-sm">{order.productName}</p>
                                            <p className="text-[10px] text-slate-600 font-mono">#{order.id.slice(-6).toUpperCase()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">{order.userName || "Client"}</td>
                                        <td className="px-6 py-4 font-bold text-blue-400 text-sm">{(order.totalPrice || order.price).toLocaleString()} F</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase border ${order.status === 'Livré' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                order.status === 'Annulé' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">Derniers Produits</h3>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-3 py-1 rounded-full font-bold">
                        {recentProducts.length} produits
                    </span>
                </div>
                {recentProducts.length === 0 ? (
                    <p className="text-slate-500 text-sm">Aucun produit récent à afficher.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recentProducts.map((product) => {
                            const promo = isPromo(product);
                            const isNew = isNewProduct(product);
                            return (
                                <div key={product.id} className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                                            {isNew && <span className="bg-pink-600 text-white px-2 py-1 text-[9px] font-black uppercase tracking-widest">Nouveau</span>}
                                            {promo && <span className="bg-red-600 text-white px-2 py-1 text-[9px] font-black uppercase tracking-widest">Promo</span>}
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        <p className="text-[10px] uppercase tracking-widest text-slate-500">{getDisplayCategory(product)}</p>
                                        <h4 className="font-bold text-white">{product.name}</h4>
                                        <p className="text-blue-400 font-black text-sm">{Number(product.price || 0).toLocaleString()} F</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardHome;
