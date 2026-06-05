import { useState, useMemo, useEffect, useCallback } from 'react';
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
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { PurchasePlanItem } from '../types';
import { statusLabels, statusColors } from '../config/navConfig';
import { purchaseApi } from '../services/api';

interface PurchaseOrderWithItems {
  id: string;
  orderNo: string;
  supplierId: string;
  supplierName: string;
  totalAmount: number;
  status: 'draft' | 'pending_dept' | 'pending_hospital' | 'approved' | 'rejected' | 'in_transit' | 'completed';
  createdBy: string;
  approvedByDept: string | null;
  approvedByHospital: string | null;
  approvalOpinions: Array<{
    level: number;
    approvedBy: string;
    opinion: string;
    approved: boolean;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    medicineId: string;
    medicineName: string;
    specification: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export const Purchase = () => {
  const { user } = useAppStore();

  const [activeTab, setActiveTab] = useState<'plans' | 'approvals' | 'orders'>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState<PurchaseOrderWithItems | null>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState<PurchaseOrderWithItems | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [autoPlanItems, setAutoPlanItems] = useState<PurchasePlanItem[]>([]);
  const [manualItems, setManualItems] = useState<{ medicineId: string; medicineName: string; quantity: number; unitPrice: number }[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalOpinion, setApprovalOpinion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderWithItems[]>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [medicines, setMedicines] = useState<Array<{ id: string; genericName: string; specification: string; price: number }>>([]);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await purchaseApi.getOrders();
      if (response.success) {
        setPurchaseOrders(response.data as PurchaseOrderWithItems[]);
      }
    } catch (error) {
      console.error('加载采购订单失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/statistics/overview');
      const data = await response.json();
      if (data.success) {
        setSuppliers([
          { id: 'SUP0001', name: '国药集团药业股份有限公司' },
          { id: 'SUP0002', name: '上海医药集团股份有限公司' },
          { id: 'SUP0003', name: '九州通医药集团股份有限公司' },
          { id: 'SUP0004', name: '华润医药商业集团有限公司' },
        ]);
      }
    } catch (error) {
      console.error('加载供应商失败:', error);
      setSuppliers([
        { id: 'SUP0001', name: '国药集团药业股份有限公司' },
        { id: 'SUP0002', name: '上海医药集团股份有限公司' },
        { id: 'SUP0003', name: '九州通医药集团股份有限公司' },
        { id: 'SUP0004', name: '华润医药商业集团有限公司' },
      ]);
    }
  }, []);

  const loadMedicines = useCallback(async () => {
    try {
      setMedicines([
        { id: 'MED0001', genericName: '阿莫西林胶囊', specification: '0.25g*24粒', price: 15.8 },
        { id: 'MED0002', genericName: '注射用头孢曲松钠', specification: '1.0g', price: 45.5 },
        { id: 'MED0003', genericName: '阿司匹林肠溶片', specification: '100mg*30片', price: 18.2 },
        { id: 'MED0004', genericName: '布洛芬缓释胶囊', specification: '0.3g*20粒', price: 22.5 },
        { id: 'MED0005', genericName: '盐酸二甲双胍片', specification: '0.5g*30片', price: 32.8 },
        { id: 'MED0006', genericName: '阿托伐他汀钙片', specification: '20mg*7片', price: 58.6 },
        { id: 'MED0007', genericName: '硝苯地平控释片', specification: '30mg*7片', price: 42.3 },
        { id: 'MED0008', genericName: '奥美拉唑肠溶胶囊', specification: '20mg*14粒', price: 38.5 },
        { id: 'MED0009', genericName: '盐酸左氧氟沙星片', specification: '0.5g*4片', price: 28.9 },
        { id: 'MED0010', genericName: '氯雷他定片', specification: '10mg*6片', price: 25.6 },
      ]);
    } catch (error) {
      console.error('加载药品失败:', error);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadSuppliers();
    loadMedicines();
  }, [loadOrders, loadSuppliers, loadMedicines]);

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

  const handleGenerateAutoPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const response = await purchaseApi.generatePlan();
      if (response.success) {
        setAutoPlanItems(response.data as PurchasePlanItem[]);
      }
    } catch (error) {
      console.error('生成采购计划失败:', error);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const addManualItem = (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (medicine && !manualItems.find(i => i.medicineId === medicineId)) {
      setManualItems([...manualItems, { 
        medicineId, 
        medicineName: medicine.genericName,
        quantity: 50, 
        unitPrice: medicine.price 
      }]);
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
      medicineName: pi.medicineName,
      quantity: pi.suggestedQuantity,
      unitPrice: pi.unitPrice,
      subtotal: pi.subtotal,
      isAuto: true,
      reason: pi.reason,
    })), ...manualItems.map(mi => ({
      medicineId: mi.medicineId,
      medicineName: mi.medicineName,
      quantity: mi.quantity,
      unitPrice: mi.unitPrice,
      subtotal: mi.quantity * mi.unitPrice,
      isAuto: false,
      reason: '手动添加',
    }))];
    return items;
  }, [autoPlanItems, manualItems]);

  const totalAmount = useMemo(() => 
    allPlanItems.reduce((sum, item) => sum + item.subtotal, 0)
  , [allPlanItems]);

  const handleCreateOrder = async () => {
    if (allPlanItems.length === 0) {
      alert('请添加采购物品');
      return;
    }
    if (!selectedSupplier) {
      alert('请选择供应商');
      return;
    }

    setIsSubmitting(true);
    try {
      const supplier = suppliers.find(s => s.id === selectedSupplier);
      const response = await purchaseApi.createOrder({
        supplierId: selectedSupplier,
        supplierName: supplier?.name || '',
        items: allPlanItems.map((item, index) => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          specification: medicines.find(m => m.id === item.medicineId)?.specification || '',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
        createdBy: user?.name || '系统',
      });

      if (response.success) {
        setShowPlanModal(false);
        setAutoPlanItems([]);
        setManualItems([]);
        setSelectedSupplier('');
        loadOrders();
      }
    } catch (error) {
      console.error('创建采购单失败:', error);
      alert('创建采购单失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproval = async (approved: boolean) => {
    if (!showApprovalModal) return;
    
    const level = showApprovalModal.status === 'pending_dept' ? 1 : 2;
    const opinion = approvalOpinion || (approved ? '同意采购' : '驳回');

    try {
      const response = await purchaseApi.approveOrder(showApprovalModal.id, {
        level,
        approvedBy: user?.name || '系统',
        opinion,
        approved,
      });

      if (response.success) {
        setShowApprovalModal(null);
        setApprovalOpinion('');
        loadOrders();
      }
    } catch (error) {
      console.error('审批失败:', error);
      alert('审批失败，请重试');
    }
  };

  const handleSendToSupplier = async (orderId: string) => {
    try {
      const response = await purchaseApi.sendOrder(orderId);
      if (response.success) {
        loadOrders();
        alert('已发送给供应商');
      }
    } catch (error) {
      console.error('发送订单失败:', error);
      alert('发送失败，请重试');
    }
  };

  const handleReceive = async (orderId: string) => {
    try {
      const response = await purchaseApi.receiveOrder(orderId, user?.name);
      if (response.success) {
        loadOrders();
        alert('收货确认完成，库存已更新');
      }
    } catch (error) {
      console.error('确认收货失败:', error);
      alert('确认收货失败，请重试');
    }
  };

  const getApprovalProgress = (order: PurchaseOrderWithItems) => {
    const steps = [
      { key: 'draft', label: '草稿', completed: true },
      { key: 'pending_dept', label: '药学部主任', completed: order.status !== 'draft' && order.status !== 'pending_dept' },
      { key: 'pending_hospital', label: '分管院长', completed: order.status === 'approved' || order.status === 'in_transit' || order.status === 'completed' },
      { key: 'approved', label: '已批准', completed: order.status === 'approved' || order.status === 'in_transit' || order.status === 'completed' },
    ];
    return steps;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购管理</h1>
          <p className="text-gray-500 mt-1">智能采购计划生成、多级审批、订单跟踪</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建采购计划
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待审批</p>
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
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ¥{purchaseOrders
                  .filter(o => new Date(o.createdAt).getMonth() === new Date().getMonth())
                  .reduce((sum, o) => sum + o.totalAmount, 0)
                  .toLocaleString()}
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{completedOrders.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'plans'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            采购计划
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
              {autoPlanItems.length + manualItems.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'approvals'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            待审批
            <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-full text-xs">
              {pendingApprovals.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            订单跟踪
            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
              {purchaseOrders.length}
            </span>
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、供应商名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : activeTab === 'plans' ? (
            <div className="p-6">
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">点击"新建采购计划"按钮创建采购单</p>
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  新建采购计划
                </button>
              </div>
            </div>
          ) : activeTab === 'approvals' ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">订单号</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">供应商</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">金额</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">审批级别</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">创建时间</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingApprovals.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium text-gray-900">{order.orderNo}</td>
                    <td className="px-4 py-4 text-gray-600">{order.supplierName}</td>
                    <td className="px-4 py-4 text-center font-medium text-gray-900">
                      ¥{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {order.status === 'pending_dept' ? '一级审批' : '二级审批'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-500 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setShowOrderDetailModal(order)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowApprovalModal(order)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                        >
                          审批
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingApprovals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      暂无待审批订单
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">订单号</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">供应商</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">金额</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">创建时间</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 font-medium text-gray-900">{order.orderNo}</td>
                    <td className="px-4 py-4 text-gray-600">{order.supplierName}</td>
                    <td className="px-4 py-4 text-center font-medium text-gray-900">
                      ¥{order.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-500 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setShowOrderDetailModal(order)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status === 'approved' && (
                          <button
                            onClick={() => handleSendToSupplier(order.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                          >
                            <Send className="w-3 h-3" />
                            发送
                          </button>
                        )}
                        {order.status === 'in_transit' && (
                          <button
                            onClick={() => handleReceive(order.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            <Check className="w-3 h-3" />
                            收货
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      暂无订单
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">新建采购计划</h2>
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">选择供应商</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择供应商</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">智能采购计划</h3>
                  <button
                    onClick={handleGenerateAutoPlan}
                    disabled={isGeneratingPlan}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGeneratingPlan ? '生成中...' : '智能生成'}
                  </button>
                </div>

                {allPlanItems.length > 0 && (
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">药品名称</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">建议数量</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">单价</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">小计</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">计算依据</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allPlanItems.map((item) => (
                          <tr key={item.medicineId}>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {item.medicineName}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  if (item.isAuto) {
                                    setAutoPlanItems(autoPlanItems.map(pi =>
                                      pi.medicineId === item.medicineId
                                        ? { ...pi, suggestedQuantity: parseInt(e.target.value) || 0, subtotal: (parseInt(e.target.value) || 0) * pi.unitPrice }
                                        : pi
                                    ));
                                  } else {
                                    updateManualItemQty(item.medicineId, parseInt(e.target.value) || 0);
                                  }
                                }}
                                className="w-20 h-8 px-2 border border-gray-200 rounded text-center"
                              />
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">¥{item.unitPrice}</td>
                            <td className="px-4 py-3 text-center font-medium text-gray-900">
                              ¥{item.subtotal.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                              {item.reason}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  if (item.isAuto) {
                                    setAutoPlanItems(autoPlanItems.filter(pi => pi.medicineId !== item.medicineId));
                                  } else {
                                    removeManualItem(item.medicineId);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700"
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
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">手动添加药品</h3>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addManualItem(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="h-8 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">选择药品添加</option>
                      {medicines.filter(m => !allPlanItems.find(i => i.medicineId === m.id)).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.genericName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">合计金额</span>
                <span className="text-2xl font-bold text-blue-600">¥{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={isSubmitting || allPlanItems.length === 0 || !selectedSupplier}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                提交审批
              </button>
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">审批采购订单</h2>
              <p className="text-gray-500 mt-1">{showApprovalModal.orderNo}</p>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3">审批进度</h3>
                <div className="flex items-center">
                  {getApprovalProgress(showApprovalModal).map((step, index) => (
                    <React.Fragment key={step.key}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step.completed
                          ? 'bg-green-500 text-white'
                          : step.key === showApprovalModal.status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {step.completed ? <Check className="w-4 h-4" /> : index + 1}
                      </div>
                      <span className={`mx-2 text-xs ${
                        step.key === showApprovalModal.status ? 'text-blue-600 font-medium' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                      {index < 3 && <div className={`flex-1 h-1 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">采购金额</label>
                <p className="text-2xl font-bold text-gray-900">¥{showApprovalModal.totalAmount.toLocaleString()}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">采购物品</label>
                <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3">
                  {showApprovalModal.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-1">
                      <span className="text-gray-600">{item.medicineName}</span>
                      <span className="text-gray-900 font-medium">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">审批意见</label>
                <textarea
                  value={approvalOpinion}
                  onChange={(e) => setApprovalOpinion(e.target.value)}
                  placeholder="请输入审批意见..."
                  className="w-full h-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowApprovalModal(null)}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handleApproval(false)}
                className="px-6 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                驳回
              </button>
              <button
                onClick={() => handleApproval(true)}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                通过
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">订单详情</h2>
                  <p className="text-gray-500 mt-1">{showOrderDetailModal.orderNo}</p>
                </div>
                <button
                  onClick={() => setShowOrderDetailModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">供应商</p>
                  <p className="font-medium text-gray-900">{showOrderDetailModal.supplierName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[showOrderDetailModal.status]}`}>
                    {statusLabels[showOrderDetailModal.status]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">创建人</p>
                  <p className="font-medium text-gray-900">{showOrderDetailModal.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">创建时间</p>
                  <p className="font-medium text-gray-900">
                    {new Date(showOrderDetailModal.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-3">采购明细</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">药品名称</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">数量</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">单价</th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">小计</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {showOrderDetailModal.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-medium text-gray-900">{item.medicineName}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-3 text-center text-gray-600">¥{item.unitPrice}</td>
                          <td className="px-4 py-3 text-center font-medium text-gray-900">¥{item.subtotal}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-100">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-900">合计</td>
                        <td className="px-4 py-3 text-center font-bold text-blue-600">
                          ¥{showOrderDetailModal.totalAmount.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {showOrderDetailModal.approvalOpinions && showOrderDetailModal.approvalOpinions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">审批记录</h3>
                  <div className="space-y-3">
                    {showOrderDetailModal.approvalOpinions.map((opinion, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">
                            {opinion.level === 1 ? '药学部主任' : '分管院长'} - {opinion.approvedBy}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            opinion.approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {opinion.approved ? '通过' : '驳回'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{opinion.opinion}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(opinion.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowOrderDetailModal(null)}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function React({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
