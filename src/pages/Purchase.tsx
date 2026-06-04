import { useState } from 'react';
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
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { PurchaseOrder } from '../types';
import { statusLabels, statusColors } from '../config/navConfig';
import { generatePurchasePlan } from '../utils/validation';

export const Purchase = () => {
  const {
    medicines,
    suppliers,
    purchaseOrders,
    addPurchaseOrder,
    updatePurchaseOrder,
    approvePurchaseOrder,
    user,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'plans' | 'approvals' | 'orders'>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState<PurchaseOrder | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [planItems, setPlanItems] = useState<{ medicineId: string; quantity: number; unitPrice: number }[]>([]);

  const filteredOrders = purchaseOrders.filter(o =>
    o.orderNo.includes(searchQuery) ||
    o.supplierName.includes(searchQuery)
  );

  const pendingApprovals = filteredOrders.filter(
    o => o.status === 'pending_dept' || o.status === 'pending_hospital'
  );

  const addPlanItem = (medicineId: string) => {
    const medicine = medicines.find(m => m.id === medicineId);
    if (medicine && !planItems.find(i => i.medicineId === medicineId)) {
      const currentStock = 100;
      const monthlyUsage = [80, 95, 88, 102, 90];
      const turnoverRate = 6.5;
      const { suggestedQuantity } = generatePurchasePlan(medicine, currentStock, monthlyUsage, turnoverRate);

      setPlanItems([...planItems, { medicineId, quantity: suggestedQuantity, unitPrice: medicine.price }]);
    }
  };

  const removePlanItem = (medicineId: string) => {
    setPlanItems(planItems.filter(i => i.medicineId !== medicineId));
  };

  const generateAutoPlan = () => {
    const autoItems = medicines.slice(0, 5).map(m => {
      const currentStock = 50 + Math.random() * 50;
      const monthlyUsage = [80, 95, 88, 102, 90];
      const turnoverRate = 5 + Math.random() * 3;
      const { suggestedQuantity } = generatePurchasePlan(m, currentStock, monthlyUsage, turnoverRate);
      return { medicineId: m.id, quantity: suggestedQuantity, unitPrice: m.price };
    });
    setPlanItems(autoItems);
  };

  const submitPlan = () => {
    if (!selectedSupplier || planItems.length === 0) return;

    const supplier = suppliers.find(s => s.id === selectedSupplier);
    const items = planItems.map(item => ({
      id: Math.random().toString(36).substring(2, 11),
      medicineId: item.medicineId,
      medicineName: medicines.find(m => m.id === item.medicineId)?.genericName || '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
    }));

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
    setPlanItems([]);
    setSelectedSupplier('');
    setActiveTab('approvals');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购管理</h1>
          <p className="text-gray-500 mt-1">智能采购计划、多级审批、订单跟踪</p>
        </div>
        <button
          onClick={() => setShowPlanModal(true)}
          className="flex items-center px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          创建采购计划
        </button>
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
            {tab.badge && tab.badge > 0 && (
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
                    <p className="text-sm text-gray-500">{order.items.length} 种药品</p>
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
                  {(order.status === 'pending_dept' || order.status === 'pending_hospital') &&
                   (user?.role === 'dept_director' || user?.role === 'hospital_director' || user?.role === 'admin') ? (
                    <button
                      onClick={() => setShowApprovalModal(order)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-end"
                    >
                      审批 <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button className="text-gray-400 hover:text-gray-600 text-sm">
                      查看详情
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">创建采购计划</h2>
              <button onClick={() => setShowPlanModal(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择供应商 *</label>
                <select
                  value={selectedSupplier}
                  onChange={e => setSelectedSupplier(e.target.value)}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择供应商</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">采购药品</label>
                  <button
                    onClick={generateAutoPlan}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    智能生成
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {medicines.map(m => (
                    <button
                      key={m.id}
                      onClick={() => addPlanItem(m.id)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        planItems.find(i => i.medicineId === m.id)
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {m.genericName}
                    </button>
                  ))}
                </div>
              </div>

              {planItems.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-600">药品</th>
                        <th className="px-4 py-3 text-center text-gray-600 w-28">数量</th>
                        <th className="px-4 py-3 text-right text-gray-600 w-28">单价</th>
                        <th className="px-4 py-3 text-right text-gray-600 w-28">小计</th>
                        <th className="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {planItems.map(item => {
                        const medicine = medicines.find(m => m.id === item.medicineId);
                        return (
                          <tr key={item.medicineId}>
                            <td className="px-4 py-3">{medicine?.genericName}</td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={e => setPlanItems(planItems.map(
                                  i => i.medicineId === item.medicineId
                                    ? { ...i, quantity: parseInt(e.target.value) || 0 }
                                    : i
                                ))}
                                className="w-full h-8 px-2 text-center border border-gray-200 rounded"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">¥{item.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-medium">
                              ¥{(item.quantity * item.unitPrice).toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => removePlanItem(item.medicineId)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right font-medium">合计</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-600">
                          ¥{planItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={submitPlan}
                  disabled={!selectedSupplier || planItems.length === 0}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  提交审批
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">审批采购单</h2>
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

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">审批进度</p>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    showApprovalModal.status !== 'pending_dept' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    1
                  </div>
                  <div className="flex-1 h-1 bg-gray-200 rounded">
                    <div className={`h-full rounded ${
                      showApprovalModal.status !== 'pending_dept' ? 'bg-green-500' : 'bg-gray-200'
                    }`} style={{ width: '100%' }}></div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    showApprovalModal.status === 'pending_hospital' || showApprovalModal.status === 'approved'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    2
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>药学部主任</span>
                  <span>分管院长</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">审批意见</label>
                <textarea
                  className="w-full h-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="请输入审批意见..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    const level = showApprovalModal.status === 'pending_dept' ? 1 : 2;
                    approvePurchaseOrder(showApprovalModal.id, level, user?.name || '', '同意', 'approved');
                    setShowApprovalModal(null);
                  }}
                  className="flex-1 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  通过
                </button>
                <button
                  onClick={() => {
                    const level = showApprovalModal.status === 'pending_dept' ? 1 : 2;
                    approvePurchaseOrder(showApprovalModal.id, level, user?.name || '', '驳回', 'rejected');
                    setShowApprovalModal(null);
                  }}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  驳回
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
