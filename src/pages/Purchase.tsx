import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Eye,
  Check,
  X,
  FileText,
  Truck,
  Clock,
  User,
  ChevronRight,
  Sparkles,
  Send,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Package,
  ArrowLeft,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { PurchaseOrder, PurchasePlanItem } from '../types';
import { statusLabels, statusColors } from '../config/navConfig';

export const Purchase = () => {
  const {
    medicines,
    suppliers,
    purchaseOrders,
    inventoryBatches,
    addPurchaseOrder,
    updatePurchaseOrder,
    approvePurchaseOrder,
    generateMonthlyPurchasePlan,
    sendOrderToSupplier,
    user,
    resetData,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'plans' | 'approvals' | 'orders'>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState<PurchaseOrder | null>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState<PurchaseOrder | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [autoPlanItems, setAutoPlanItems] = useState<PurchasePlanItem[]>([]);
  const [manualItems, setManualItems] = useState<{ medicineId: string; quantity: number; unitPrice: number }[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [approvalOpinion, setApprovalOpinion] = useState('');

  const filteredOrders = useMemo(() => purchaseOrders.filter(o =>
    o.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
  ), [purchaseOrders, searchQuery]);

  const pendingApprovals = useMemo(() => filteredOrders.filter(
    o => o.status === 'pending_dept' || o.status === 'pending_hospital'
  ), [filteredOrders]);

  const inTransitOrders = useMemo(() => filteredOrders.filter(
    o => o.status === 'in_transit'
  ), [filteredOrders]);

  const completedOrders = useMemo(() => filteredOrders.filter(
    o => o.status === 'completed'
  ), [filteredOrders]);

  const handleGenerateAutoPlan = () => {
    setIsGeneratingPlan(true);
    setTimeout(() => {
      const plan = generateMonthlyPurchasePlan();
      setAutoPlanItems(plan);
      setIsGeneratingPlan(false);
    }, 800);
  };

  const addManualItem = (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (medicine && !manualItems.find(i => i.medicineId === medicineId)) {
      const currentStock = inventoryBatches
        .filter(b => b.medicineId === medicineId)
        .reduce((sum, b) => sum + b.quantity, 0);
      const suggestedQty = Math.max(0, medicine.minStock * 2 - currentStock);
      setManualItems([...manualItems, { medicineId, quantity: suggestedQty, unitPrice: medicine.price }]);
    }
  };

  const removeManualItem = (medicineId: string) => {
    setManualItems(manualItems.filter(i => i.medicineId !== medicineId));
  };

  const updateManualItemQty = (medicineId: string, quantity: number) => {
    setManualItems(manualItems.map(i => 
      i.medicineId === medicineId ? { ...i, quantity } : i
    ));
  };

  const allPlanItems = useMemo(() => {
    const items = [...autoPlanItems.map(pi => ({
      medicineId: pi.medicineId,
      quantity: pi.suggestedQuantity,
      unitPrice: pi.unitPrice,
      isAuto: true,
    })), ...manualItems.map(mi => ({ ...mi, isAuto: false }))];
    
    return items.filter(item => item.quantity > 0);
  }, [autoPlanItems, manualItems]);

  const totalAmount = useMemo(() => 
    allPlanItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  , [allPlanItems]);

  const submitPlan = () => {
    if (!selectedSupplier || allPlanItems.length === 0) return;

    const supplier = suppliers.find(s => s.id === selectedSupplier);
    const items = allPlanItems.map(item => {
      const medicine = medicines.find(m => m.id === item.medicineId);
      return {
        id: Math.random().toString(36).substring(2, 11),
        medicineId: item.medicineId,
        medicineName: medicine?.genericName || '',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      };
    });

    addPurchaseOrder({
      orderNo: `PO${Date.now().toString().slice(-7)}`,
      supplierId: selectedSupplier,
      supplierName: supplier?.name || '',
      status: 'pending_dept',
      planDate: new Date().toISOString().split('T')[0],
      totalAmount: items.reduce((sum, i) => sum + i.subtotal, 0),
      items,
      approvals: [],
      createdBy: user?.name || '系统',
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    setShowPlanModal(false);
    setAutoPlanItems([]);
    setManualItems([]);
    setSelectedSupplier('');
    setActiveTab('approvals');
  };

  const handleApproval = (approved: boolean) => {
    if (!showApprovalModal) return;
    
    const level = showApprovalModal.status === 'pending_dept' ? 1 : 2;
    const defaultOpinion = approved ? '同意采购' : '驳回';
    
    approvePurchaseOrder(
      showApprovalModal.id,
      level,
      user?.name || '',
      approvalOpinion || defaultOpinion,
      approved ? 'approved' : 'rejected'
    );
    
    setShowApprovalModal(null);
    setApprovalOpinion('');
  };

  const handleSendOrder = (orderId: string) => {
    if (window.confirm('确定要向供应商发送订货通知吗？')) {
      const success = sendOrderToSupplier(orderId);
      if (success) {
        alert('订货通知已发送给供应商，订单状态已更新为"在途"');
      }
    }
  };

  const handleReceiveOrder = (orderId: string) => {
    if (window.confirm('确认该订单已全部到货吗？')) {
      updatePurchaseOrder(orderId, { status: 'completed' });
    }
  };

  const canApprove = (order: PurchaseOrder) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (order.status === 'pending_dept' && user.role === 'dept_director') return true;
    if (order.status === 'pending_hospital' && user.role === 'hospital_director') return true;
    return false;
  };

  const getApprovalLevelText = (status: string) => {
    switch (status) {
      case 'pending_dept': return '待药学部主任审批';
      case 'pending_hospital': return '待分管院长审批';
      case 'approved': return '已通过审批';
      case 'rejected': return '已驳回';
      default: return status;
    }
  };

  const getApprovalProgress = (order: PurchaseOrder) => {
    if (order.status === 'rejected') return 0;
    if (order.status === 'pending_dept') return 1;
    if (order.status === 'pending_hospital') return 2;
    return 3;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购管理</h1>
          <p className="text-gray-500 mt-1">智能采购计划、多级审批、订单跟踪</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => resetData()}
            className="flex items-center px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            重置数据
          </button>
          <button
            onClick={() => {
              setAutoPlanItems([]);
              setManualItems([]);
              setSelectedSupplier('');
              setShowPlanModal(true);
            }}
            className="flex items-center px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            创建采购计划
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待审批订单</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingApprovals.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">在途订单</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{inTransitOrders.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">本月采购金额</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ¥{purchaseOrders
                  .filter(o => o.status !== 'rejected' && new Date(o.createdAt).getMonth() === new Date().getMonth())
                  .reduce((sum, o) => sum + o.totalAmount, 0)
                  .toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成订单</p>
              <p className="text-2xl font-bold text-gray-600 mt-1">{completedOrders.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100 inline-flex">
        {[
          { key: 'plans', label: '采购计划', icon: FileText },
          { key: 'approvals', label: '待审批', icon: Clock, badge: pendingApprovals.length },
          { key: 'orders', label: '订单跟踪', icon: Truck },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-red-100 text-red-600'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单号或供应商..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                订单信息
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                供应商
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                金额
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                创建人
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                状态
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(activeTab === 'approvals' ? pendingApprovals : filteredOrders).map(order => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNo}</p>
                    <p className="text-sm text-gray-500">{order.items.length} 种药品 · {order.planDate}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-900">{order.supplierName}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900">¥{order.totalAmount.toFixed(2)}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-700">{order.createdBy}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowOrderDetailModal(order)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {(order.status === 'pending_dept' || order.status === 'pending_hospital') && canApprove(order) && (
                      <button
                        onClick={() => {
                          setShowApprovalModal(order);
                          setApprovalOpinion('');
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        审批 <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {order.status === 'approved' && (user?.role === 'admin' || user?.role === 'pharmacy_admin' || user?.role === 'purchase') && (
                      <button
                        onClick={() => handleSendOrder(order.id)}
                        className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        发送订单
                      </button>
                    )}

                    {order.status === 'in_transit' && (user?.role === 'admin' || user?.role === 'pharmacy_admin') && (
                      <button
                        onClick={() => handleReceiveOrder(order.id)}
                        className="px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <Package className="w-4 h-4 mr-1" />
                        确认到货
                      </button>
                    )}

                    {order.status === 'rejected' && (
                      <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                        已驳回: {order.approvals[order.approvals.length - 1]?.opinion || '无意见'}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(activeTab === 'approvals' ? pendingApprovals : filteredOrders).length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无订单数据</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowPlanModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">创建月度采购计划</h2>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择供应商 *</label>
                <select
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择供应商</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (评级: {'★'.repeat(s.rating)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">智能采购计划</label>
                  <button
                    onClick={handleGenerateAutoPlan}
                    disabled={isGeneratingPlan}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    {isGeneratingPlan ? '生成中...' : '根据临床用量自动生成'}
                  </button>
                </div>

                {autoPlanItems.length > 0 && (
                  <div className="border border-blue-200 rounded-lg overflow-hidden mb-4">
                    <div className="bg-blue-50 px-4 py-2 border-b border-blue-200">
                      <p className="text-sm font-medium text-blue-700">
                        智能推荐采购 {autoPlanItems.length} 种药品，合计 ¥{autoPlanItems.reduce((sum, i) => sum + i.subtotal, 0).toFixed(2)}
                      </p>
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-600">药品</th>
                          <th className="px-4 py-2 text-center text-gray-600 w-24">当前库存</th>
                          <th className="px-4 py-2 text-center text-gray-600 w-24">月均用量</th>
                          <th className="px-4 py-2 text-center text-gray-600 w-24">周转率</th>
                          <th className="px-4 py-2 text-center text-gray-600 w-24">近效期</th>
                          <th className="px-4 py-2 text-center text-gray-600 w-28">建议采购</th>
                          <th className="px-4 py-2 text-right text-gray-600 w-28">小计</th>
                          <th className="px-4 py-2 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {autoPlanItems.map(item => (
                          <tr key={item.medicineId}>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900">{item.medicineName}</p>
                                <p className="text-xs text-gray-500">{item.reason}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">{item.currentStock}</td>
                            <td className="px-4 py-3 text-center">{item.avgMonthlyUsage}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={item.turnoverRate < 3 ? 'text-yellow-600' : item.turnoverRate > 8 ? 'text-green-600' : 'text-gray-600'}>
                                {item.turnoverRate.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.nearExpiryStock > 0 ? (
                                <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs">
                                  {item.nearExpiryStock}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                value={item.suggestedQuantity}
                                onChange={e => {
                                  const newQty = parseInt(e.target.value) || 0;
                                  setAutoPlanItems(autoPlanItems.map(pi =>
                                    pi.medicineId === item.medicineId
                                      ? { ...pi, suggestedQuantity: newQty, subtotal: newQty * pi.unitPrice }
                                      : pi
                                  ));
                                }}
                                className="w-20 h-8 px-2 text-center border border-gray-200 rounded"
                                min="0"
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              ¥{item.subtotal.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setAutoPlanItems(autoPlanItems.filter(pi => pi.medicineId !== item.medicineId))}
                                className="text-red-500 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {isGeneratingPlan && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm text-blue-700">正在分析临床用量、库存周转和效期数据...</p>
                  </div>
                )}

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">手动添加药品</label>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {medicines.map(m => (
                      <button
                        key={m.id}
                        onClick={() => addManualItem(m.id)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          manualItems.find(i => i.medicineId === m.id)
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {m.genericName}
                      </button>
                    ))}
                  </div>
                </div>

                {manualItems.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-gray-600">药品</th>
                          <th className="px-4 py-2 text-center text-gray-600 w-28">数量</th>
                          <th className="px-4 py-2 text-right text-gray-600 w-28">单价</th>
                          <th className="px-4 py-2 text-right text-gray-600 w-28">小计</th>
                          <th className="px-4 py-2 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {manualItems.map(item => {
                          const medicine = medicines.find(m => m.id === item.medicineId);
                          return (
                            <tr key={item.medicineId}>
                              <td className="px-4 py-3">{medicine?.genericName}</td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={e => updateManualItemQty(item.medicineId, parseInt(e.target.value) || 0)}
                                  className="w-full h-8 px-2 text-center border border-gray-200 rounded"
                                  min="0"
                                />
                              </td>
                              <td className="px-4 py-3 text-right">¥{item.unitPrice.toFixed(2)}</td>
                              <td className="px-4 py-3 text-right font-medium">
                                ¥{(item.quantity * item.unitPrice).toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => removeManualItem(item.medicineId)}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  共 {allPlanItems.length} 种药品
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">合计金额</p>
                    <p className="text-2xl font-bold text-blue-600">¥{totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPlanModal(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100"
                    >
                      取消
                    </button>
                    <button
                      onClick={submitPlan}
                      disabled={!selectedSupplier || allPlanItems.length === 0}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      提交审批
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                审批采购单 - {getApprovalLevelText(showApprovalModal.status)}
              </h2>
              <button onClick={() => setShowApprovalModal(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">订单号</p>
                    <p className="font-medium text-gray-900">{showApprovalModal.orderNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">供应商</p>
                    <p className="font-medium text-gray-900">{showApprovalModal.supplierName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">药品数量</p>
                    <p className="font-medium text-gray-900">{showApprovalModal.items.length} 种</p>
                  </div>
                  <div>
                    <p className="text-gray-500">采购金额</p>
                    <p className="font-bold text-blue-600">¥{showApprovalModal.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-600">药品名称</th>
                      <th className="px-4 py-2 text-center text-gray-600 w-20">数量</th>
                      <th className="px-4 py-2 text-right text-gray-600 w-24">小计</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {showApprovalModal.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-2">{item.medicineName}</td>
                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">¥{item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">审批进度</p>
                <div className="flex items-center gap-2">
                  {[1, 2].map(level => {
                    const isCurrent = getApprovalProgress(showApprovalModal) >= level;
                    const isComplete = getApprovalProgress(showApprovalModal) > level;
                    return (
                      <div key={level} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isComplete ? 'bg-green-500 text-white' : 
                          isCurrent ? 'bg-blue-500 text-white' : 
                          'bg-gray-200 text-gray-500'
                        }`}>
                          {isComplete ? <Check className="w-4 h-4" /> : level}
                        </div>
                        {level < 2 && (
                          <div className="w-16 h-1 mx-2 bg-gray-200 rounded">
                            <div 
                              className={`h-full rounded ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`}
                              style={{ width: isComplete ? '100%' : '0%' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>药学部主任</span>
                  <span>分管院长</span>
                </div>
              </div>

              {showApprovalModal.approvals.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">历史审批意见</p>
                  {showApprovalModal.approvals.map(ap => (
                    <div key={ap.id} className="text-sm mb-2 last:mb-0">
                      <span className="font-medium text-gray-900">{ap.approver} ({ap.approverRole}): </span>
                      <span className={ap.status === 'approved' ? 'text-green-600' : 'text-red-600'}>
                        {ap.status === 'approved' ? '同意' : '驳回'} - {ap.opinion}
                      </span>
                      <span className="text-gray-400 ml-2">{new Date(ap.approvedAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">审批意见</label>
                <textarea
                  value={approvalOpinion}
                  onChange={e => setApprovalOpinion(e.target.value)}
                  className="w-full h-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="请输入审批意见..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleApproval(true)}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center font-medium"
                >
                  <Check className="w-4 h-4 mr-2" />
                  通过
                </button>
                <button
                  onClick={() => handleApproval(false)}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center font-medium"
                >
                  <X className="w-4 h-4 mr-2" />
                  驳回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOrderDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">订单详情 - {showOrderDetailModal.orderNo}</h2>
              <button onClick={() => setShowOrderDetailModal(null)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">供应商</p>
                  <p className="font-medium text-gray-900 mt-1">{showOrderDetailModal.supplierName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">状态</p>
                  <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[showOrderDetailModal.status]}`}>
                    {statusLabels[showOrderDetailModal.status]}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">创建人</p>
                  <p className="font-medium text-gray-900 mt-1">{showOrderDetailModal.createdBy}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">创建日期</p>
                  <p className="font-medium text-gray-900 mt-1">{showOrderDetailModal.createdAt}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">预计到货</p>
                  <p className="font-medium text-gray-900 mt-1">{showOrderDetailModal.estimatedDelivery || '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">总金额</p>
                  <p className="font-bold text-blue-600 mt-1 text-xl">¥{showOrderDetailModal.totalAmount.toFixed(2)}</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-600">药品名称</th>
                      <th className="px-4 py-3 text-center text-gray-600 w-20">数量</th>
                      <th className="px-4 py-3 text-right text-gray-600 w-24">单价</th>
                      <th className="px-4 py-3 text-right text-gray-600 w-24">小计</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {showOrderDetailModal.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">{item.medicineName}</td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">¥{item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium">¥{item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium">合计</td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">¥{showOrderDetailModal.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {showOrderDetailModal.approvals.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">审批记录</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {showOrderDetailModal.approvals.map(ap => (
                      <div key={ap.id} className="text-sm">
                        <span className="font-medium">{ap.approver} ({ap.approverRole})</span>
                        <span className={`ml-2 ${ap.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                          {ap.status === 'approved' ? '同意' : '驳回'}
                        </span>
                        <span className="text-gray-500 ml-2">"{ap.opinion}"</span>
                        <span className="text-gray-400 ml-2">{new Date(ap.approvedAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowOrderDetailModal(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
