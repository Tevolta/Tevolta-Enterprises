
import React, { useState, useMemo } from 'react';
import { 
  Product, 
  AmazonFBAShipment, 
  AmazonFBASale, 
  AmazonInventory, 
  User,
  StockLog
} from '../types';

interface AmazonSellerProps {
  products: Product[];
  amazonInventory: AmazonInventory[];
  amazonShipments: AmazonFBAShipment[];
  amazonSales: AmazonFBASale[];
  onSendToFBA: (productId: string, quantity: number, referenceId: string) => void;
  onRecordFBASale: (sale: Omit<AmazonFBASale, 'id' | 'profit' | 'gstAmount'>) => void;
  user: User | null;
}

const AmazonSeller: React.FC<AmazonSellerProps> = ({
  products,
  amazonInventory,
  amazonShipments,
  amazonSales,
  onSendToFBA,
  onRecordFBASale,
  user
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'shipments' | 'sales'>('overview');
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);

  // Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [referenceId, setReferenceId] = useState('');

  const [saleProductId, setSaleProductId] = useState('');
  const [saleQty, setSaleQty] = useState(1);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [fbaFee, setFbaFee] = useState(0);
  const [settlementId, setSettlementId] = useState('');

  const stats = useMemo(() => {
    const totalSales = amazonSales.reduce((acc, s) => acc + (s.sellingPrice * s.quantity), 0);
    const totalProfit = amazonSales.reduce((acc, s) => acc + s.profit, 0);
    const totalFbaStock = amazonInventory.reduce((acc, i) => acc + i.fbaStock, 0);
    const totalGst = amazonSales.reduce((acc, s) => acc + s.gstAmount, 0);
    
    return { totalSales, totalProfit, totalFbaStock, totalGst };
  }, [amazonSales, amazonInventory]);

  const handleSendToFBA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0 || !referenceId) return;
    onSendToFBA(selectedProductId, quantity, referenceId);
    setShowShipmentModal(false);
    setSelectedProductId('');
    setQuantity(0);
    setReferenceId('');
  };

  const handleRecordSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleProductId || saleQty <= 0 || sellingPrice <= 0) return;
    
    const product = products.find(p => p.id === saleProductId);
    if (!product) return;

    onRecordFBASale({
      date: new Date().toISOString(),
      productId: saleProductId,
      productName: product.name,
      quantity: saleQty,
      sellingPrice: sellingPrice,
      costPrice: product.costPrice,
      gstRate: product.gstRate,
      fbaFee: fbaFee,
      settlementId: settlementId,
      status: 'Sold'
    });
    
    setShowSaleModal(false);
    setSaleProductId('');
    setSaleQty(1);
    setSellingPrice(0);
    setFbaFee(0);
    setSettlementId('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase italic">Amazon Seller <span className="text-blue-600">FBA</span></h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Fulfilled by Amazon Inventory & Profit Center</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowShipmentModal(true)}
            className="px-6 py-3 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-blue-600/20 hover:scale-105 transition-all"
          >
            Send to FBA
          </button>
          <button 
            onClick={() => setShowSaleModal(true)}
            className="px-6 py-3 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-emerald-600/20 hover:scale-105 transition-all"
          >
            Record Sale
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total FBA Sales', value: `₹${stats.totalSales.toLocaleString()}`, color: 'blue' },
          { label: 'Total FBA Profit', value: `₹${stats.totalProfit.toLocaleString()}`, color: 'emerald' },
          { label: 'FBA Inventory', value: stats.totalFbaStock.toLocaleString(), color: 'amber' },
          { label: 'GST Liability', value: `₹${stats.totalGst.toLocaleString()}`, color: 'purple' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-2xl font-black tracking-tight text-${stat.color}-600 italic`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {['overview', 'inventory', 'shipments', 'sales'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-4xl">📦</div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900 italic uppercase">Amazon FBA Dashboard</h3>
            <p className="text-slate-500 max-w-md font-medium">
              Manage your Amazon Fulfilled inventory and track real-time profitability after FBA fees and GST.
            </p>
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg pt-8">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Shipments</p>
                <p className="text-3xl font-black text-slate-900 italic">{amazonShipments.filter(s => s.status !== 'Received').length}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Settled Sales</p>
                <p className="text-3xl font-black text-slate-900 italic">{amazonSales.length}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">FBA Stock</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Sync</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {amazonInventory.map((item) => (
                  <tr key={item.productId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-6">
                      <p className="font-black text-slate-900 italic uppercase">{item.productName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.productId}</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        item.fbaStock < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {item.fbaStock} Units
                      </span>
                    </td>
                    <td className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {new Date(item.lastSync).toLocaleString()}
                    </td>
                    <td className="p-6 text-right">
                      <button 
                        onClick={() => {
                          setSelectedProductId(item.productId);
                          setShowShipmentModal(true);
                        }}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                      >
                        Restock FBA
                      </button>
                    </td>
                  </tr>
                ))}
                {amazonInventory.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                      No products currently in Amazon FBA
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'shipments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Quantity</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Ref ID</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {amazonShipments.map((shipment) => (
                  <tr key={shipment.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {new Date(shipment.date).toLocaleDateString()}
                    </td>
                    <td className="p-6 font-black text-slate-900 italic uppercase">{shipment.productName}</td>
                    <td className="p-6 font-black text-slate-900">{shipment.quantity}</td>
                    <td className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{shipment.referenceId}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        shipment.status === 'Received' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {shipment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Product</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Selling Price</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">FBA Fee</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">GST</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {amazonSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {new Date(sale.date).toLocaleDateString()}
                    </td>
                    <td className="p-6 font-black text-slate-900 italic uppercase">{sale.productName}</td>
                    <td className="p-6 font-black text-slate-900 italic">₹{sale.sellingPrice}</td>
                    <td className="p-6 font-black text-red-600 italic">₹{sale.fbaFee}</td>
                    <td className="p-6 font-black text-purple-600 italic">₹{sale.gstAmount}</td>
                    <td className="p-6">
                      <span className={`px-4 py-2 rounded-xl text-xs font-black italic ${
                        sale.profit > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        ₹{sale.profit}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shipment Modal */}
      {showShipmentModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 mb-6">Send to <span className="text-blue-600">FBA</span></h2>
            <form onSubmit={handleSendToFBA} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Product</label>
                <select 
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black italic uppercase text-xs"
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quantity</label>
                  <input 
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black italic text-xs"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shipment ID</label>
                  <input 
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="FBA123..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black italic text-xs"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowShipmentModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-blue-600/20"
                >
                  Create Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 mb-6">Record <span className="text-emerald-600">FBA Sale</span></h2>
            <form onSubmit={handleRecordSale} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Product</label>
                <select 
                  value={saleProductId}
                  onChange={(e) => setSaleProductId(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black italic uppercase text-xs"
                  required
                >
                  <option value="">Select Product</option>
                  {amazonInventory.map(i => (
                    <option key={i.productId} value={i.productId}>{i.productName} (FBA: {i.fbaStock})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quantity</label>
                  <input 
                    type="number"
                    value={saleQty}
                    onChange={(e) => setSaleQty(Number(e.target.value))}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black italic text-xs"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selling Price (Per Unit)</label>
                  <input 
                    type="number"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black italic text-xs"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amazon FBA Fee (Total)</label>
                  <input 
                    type="number"
                    value={fbaFee}
                    onChange={(e) => setFbaFee(Number(e.target.value))}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black italic text-xs"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settlement ID</label>
                  <input 
                    type="text"
                    value={settlementId}
                    onChange={(e) => setSettlementId(e.target.value)}
                    placeholder="SET-..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-black italic text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowSaleModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[10px] rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmazonSeller;
