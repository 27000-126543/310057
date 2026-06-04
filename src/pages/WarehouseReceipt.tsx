import React, { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ThermometerSnowflake,
  Sun,
  Home,
  ShieldAlert,
  UserCheck,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { PurchaseOrder, Medicine, InventoryBatch } from '@/types';
import { allocateStorage } from '@/utils/validation';
import { storageConditionLabels } from '@/config/navConfig';

interface ReceiptItem {
  id: string;
  medicineId: string;
  medicineName: string;
  orderQuantity: number;
  receivedQuantity: number;
  batchNumber: string;
  productionDate: string;
  expiryDate: string;
  zoneId: string;
  zoneName: string;
  location: string;
  isHighRisk: boolean;
  storageCondition: 'cold' | 'cool' | 'normal';
}

export function WarehouseReceipt() {
  const {
    purchaseOrders,
    medicines,
    inventoryBatches,
    warehouseZones,
    user,
    updatePurchaseOrder,
    addInventoryBatch,
  } = useAppStore();

  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [firstReviewer, setFirstReviewer] = useState('');
  const [secondReviewer, setSecondReviewer] = useState('');
  const [receiptSuccess, setReceiptSuccess] = useState(false);

  const inTransitOrders = purchaseOrders.filter(
    (o) => o.status === 'in_transit' || o.status === 'approved'
  );

  const filteredOrders = inTransitOrders.filter((o) =>
    o.orderNo.toLowerCase().includes(searchOrderNo.toLowerCase())
  );

  const handleSelectOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    const items: ReceiptItem[] = order.items.map((item) => {
      const medicine = medicines.find((m) => m.id === item.medicineId);
      const allocation = allocateStorage(medicine!, warehouseZones);
      return {
        id: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        orderQuantity: item.quantity,
        receivedQuantity: item.quantity,
        batchNumber: '',
        productionDate: '',
        expiryDate: '',
        zoneId: allocation.zoneId,
        zoneName: allocation.zoneName,
        location: allocation.location,
        isHighRisk: medicine?.isHighRisk || false,
        storageCondition: medicine?.storageCondition || 'normal',
      };
    });
    setReceiptItems(items);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<ReceiptItem>) => {
    setReceiptItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );
  };

  const handleAutoAllocate = (itemId: string) => {
    const item = receiptItems.find((i) => i.id === itemId);
    const medicine = medicines.find((m) => m.id === item?.medicineId);
    if (medicine) {
      const allocation = allocateStorage(medicine, warehouseZones);
      handleUpdateItem(itemId, {
        zoneId: allocation.zoneId,
        zoneName: allocation.zoneName,
        location: allocation.location,
      });
    }
  };

  const validateReceipt = (): boolean => {
    for (const item of receiptItems) {
      if (!item.batchNumber) {
        alert(`请输入 ${item.medicineName} 的批号`);
        return false;
      }
      if (!item.productionDate) {
        alert(`请输入 ${item.medicineName} 的生产日期`);
        return false;
      }
      if (!item.expiryDate) {
        alert(`请输入 ${item.medicineName} 的有效期`);
        return false;
      }
      if (new Date(item.expiryDate) <= new Date(item.productionDate)) {
        alert(`${item.medicineName} 的有效期不能早于生产日期`);
        return false;
      }
    }

    const hasHighRisk = receiptItems.some((item) => item.isHighRisk);
    if (hasHighRisk) {
      if (!firstReviewer || !secondReviewer) {
        alert('高警示药品需要双人复核，请填写两位复核人');
        return false;
      }
      if (firstReviewer === secondReviewer) {
        alert('两位复核人不能相同');
        return false;
      }
    }

    return true;
  };

  const handleConfirmReceipt = () => {
    if (!validateReceipt()) return;

    receiptItems.forEach((item) => {
      addInventoryBatch({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        supplierId: selectedOrder!.supplierId,
        supplierName: selectedOrder!.supplierName,
        batchNumber: item.batchNumber,
        productionDate: item.productionDate,
        expiryDate: item.expiryDate,
        quantity: item.receivedQuantity,
        initialQuantity: item.receivedQuantity,
        zoneId: item.zoneId,
        zoneName: item.zoneName,
        location: item.location,
        receivedBy: user?.name || '系统',
      });
    });

    updatePurchaseOrder(selectedOrder!.id, { status: 'completed' });

    setReceiptSuccess(true);
    setShowConfirmModal(false);
  };

  const resetForm = () => {
    setSelectedOrder(null);
    setReceiptItems([]);
    setFirstReviewer('');
    setSecondReviewer('');
    setReceiptSuccess(false);
  };

  const getStorageIcon = (condition: string) => {
    switch (condition) {
      case 'cold':
        return <ThermometerSnowflake className="w-4 h-4 text-cyan-500" />;
      case 'cool':
        return <Sun className="w-4 h-4 text-blue-500" />;
      case 'normal':
        return <Home className="w-4 h-4 text-gray-500" />;
      default:
        return <Home className="w-4 h-4 text-gray-500" />;
    }
  };

  if (receiptSuccess) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">入库完成</h2>
          <p className="text-gray-500 mb-8">
            采购订单 {selectedOrder?.orderNo} 的药品已成功入库
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              继续入库
            </button>
            <button
              onClick={() => setReceiptSuccess(false)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              查看详情
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={resetForm}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            返回订单列表
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">到货验收</h2>
            <span className="px-3 py-1 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
              {selectedOrder.orderNo}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">供应商：</span>
              <span className="font-medium text-gray-900">{selectedOrder.supplierName}</span>
            </div>
            <div>
              <span className="text-gray-500">计划日期：</span>
              <span className="font-medium text-gray-900">{selectedOrder.planDate}</span>
            </div>
            <div>
              <span className="text-gray-500">采购金额：</span>
              <span className="font-medium text-gray-900">¥{selectedOrder.totalAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">药品品种：</span>
              <span className="font-medium text-gray-900">{selectedOrder.items.length} 种</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">到货明细</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">药品信息</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">订购数量</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">实收数量</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">批号</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">生产日期</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">有效期</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">储位分配</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receiptItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {item.isHighRisk && (
                          <span className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                            <ShieldAlert className="w-3 h-3 text-red-600" />
                          </span>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{item.medicineName}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {getStorageIcon(item.storageCondition)}
                            {storageConditionLabels[item.storageCondition]}
                            {item.isHighRisk && (
                              <span className="text-red-500 ml-1">| 高警示</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-900">
                      {item.orderQuantity}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="number"
                        value={item.receivedQuantity}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { receivedQuantity: parseInt(e.target.value) || 0 })
                        }
                        className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="text"
                        value={item.batchNumber}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { batchNumber: e.target.value })
                        }
                        placeholder="输入批号"
                        className="w-28 px-2 py-1 border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="date"
                        value={item.productionDate}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { productionDate: e.target.value })
                        }
                        className="px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { expiryDate: e.target.value })
                        }
                        className="px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{item.location}</span>
                        </div>
                        <button
                          onClick={() => handleAutoAllocate(item.id)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          重新分配
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {receiptItems.some((item) => item.isHighRisk) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">高警示药品复核</h3>
                <p className="text-sm text-red-700">本批次包含高警示药品，需要双人复核确认</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">第一复核人</label>
                <input
                  type="text"
                  value={firstReviewer}
                  onChange={(e) => setFirstReviewer(e.target.value)}
                  placeholder="请输入第一复核人姓名"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">第二复核人</label>
                <input
                  type="text"
                  value={secondReviewer}
                  onChange={(e) => setSecondReviewer(e.target.value)}
                  placeholder="请输入第二复核人姓名"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={resetForm}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            确认入库
          </button>
        </div>

        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">确认入库</h3>
              <p className="text-gray-600 mb-6">
                确认将采购订单 {selectedOrder.orderNo} 的 {receiptItems.length} 种药品入库？
                入库后库存将自动更新。
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmReceipt}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">入库管理</h1>
        <p className="text-gray-500 mt-1">到货验收、批号管理、智能储位分配</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号..."
              value={searchOrderNo}
              onChange={(e) => setSearchOrderNo(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Package className="w-4 h-4" />
            待入库订单：{inTransitOrders.length} 个
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">待入库订单列表</h3>
        </div>
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>暂无待入库订单</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">订单号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">供应商</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">药品品种</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">采购金额</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">计划日期</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium text-gray-900">{order.orderNo}</td>
                  <td className="px-4 py-4 text-gray-700">{order.supplierName}</td>
                  <td className="px-4 py-4 text-center text-gray-700">{order.items.length} 种</td>
                  <td className="px-4 py-4 text-center font-medium text-gray-900">
                    ¥{order.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500">{order.planDate}</td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'in_transit'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {order.status === 'in_transit' ? '在途' : '待收货'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleSelectOrder(order)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      验收入库
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}