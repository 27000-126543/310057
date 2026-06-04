import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  User,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Prescription, InventoryBatch } from '@/types';

interface ReturnItem {
  batchId: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  packageIntact: boolean;
}

export function ReturnsProcess() {
  const { prescriptions, inventoryBatches, returnRecords, user, addReturnRecord, approveReturn } =
    useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'apply' | 'list'>('apply');

  const completedPrescriptions = useMemo(() => {
    return prescriptions.filter(
      (p) => p.status === 'completed' && p.items.some((item) => item.batchId)
    );
  }, [prescriptions]);

  const filteredPrescriptions = useMemo(() => {
    return completedPrescriptions.filter(
      (p) =>
        p.prescriptionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [completedPrescriptions, searchQuery]);

  const pendingReturns = returnRecords.filter((r) => r.status === 'pending');

  const handleSelectPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    const items: ReturnItem[] = prescription.items
      .filter((item) => item.batchId)
      .map((item) => ({
        batchId: item.batchId!,
        medicineName: item.medicineName,
        batchNumber: item.batchNumber || '',
        quantity: item.quantity,
        packageIntact: true,
      }));
    setReturnItems(items);
    setReturnReason('');
  };

  const handleUpdateReturnItem = (batchId: string, updates: Partial<ReturnItem>) => {
    setReturnItems((prev) =>
      prev.map((item) => (item.batchId === batchId ? { ...item, ...updates } : item))
    );
  };

  const handleSubmitReturn = () => {
    if (!selectedPrescription) return;
    if (!returnReason.trim()) {
      alert('请填写退药原因');
      return;
    }

    const returnNo = `RT${Date.now().toString().slice(-8)}`;

    addReturnRecord({
      returnNo,
      prescriptionId: selectedPrescription.id,
      prescriptionNo: selectedPrescription.prescriptionNo,
      patientId: selectedPrescription.patientId,
      patientName: selectedPrescription.patientName,
      items: returnItems.filter((item) => item.quantity > 0),
      reason: returnReason,
      operator: user?.name || '系统',
      status: 'pending',
    });

    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      setSelectedPrescription(null);
      setReturnItems([]);
      setReturnReason('');
      setActiveTab('list');
    }, 2000);
  };

  const handleApproveReturn = (returnId: string) => {
    approveReturn(returnId, user?.name || '系统');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">退药管理</h1>
        <p className="text-gray-500 mt-1">患者退药申请、批次核对、库存回库</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待审核退药</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{pendingReturns.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <RotateCcw className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日退药</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {
                  returnRecords.filter(
                    (r) =>
                      new Date(r.createdAt).toDateString() === new Date().toDateString()
                  ).length
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">本月退药</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{returnRecords.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">退药率</p>
              <p className="text-2xl font-bold text-green-600 mt-1">2.3%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'apply'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            退药申请
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'list'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            退药记录
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'apply' ? (
            <div className="flex gap-6">
              <div className="flex-1">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索处方号、患者姓名..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
                  {filteredPrescriptions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p>暂无符合条件的处方</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredPrescriptions.map((prescription) => (
                        <div
                          key={prescription.id}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedPrescription?.id === prescription.id
                              ? 'bg-blue-50'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSelectPrescription(prescription)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {prescription.prescriptionNo}
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {prescription.patientName}
                                </span>
                                <span>{prescription.department}</span>
                                <span>{prescription.items.length} 种药品</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-400">
                              {new Date(prescription.dispensedAt || '').toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-96">
                {selectedPrescription ? (
                  <div className="border border-gray-200 rounded-lg p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">退药明细</h3>

                    <div className="space-y-4 mb-6">
                      {returnItems.map((item) => (
                        <div key={item.batchId} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium text-gray-900 mb-2">{item.medicineName}</div>
                          <div className="text-sm text-gray-500 mb-2">
                            批号：{item.batchNumber}
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                退药数量
                              </label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateReturnItem(item.batchId, {
                                    quantity: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-20 px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                包装完整
                              </label>
                              <input
                                type="checkbox"
                                checked={item.packageIntact}
                                onChange={(e) =>
                                  handleUpdateReturnItem(item.batchId, {
                                    packageIntact: e.target.checked,
                                  })
                                }
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                          {!item.packageIntact && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                              <AlertTriangle className="w-3 h-3" />
                              包装不完整将无法重新入库
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        退药原因
                      </label>
                      <textarea
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        placeholder="请输入退药原因..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      onClick={handleSubmitReturn}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      提交退药申请
                    </button>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-8 text-center">
                    <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">请选择处方进行退药</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        退药单号
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        患者信息
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        关联处方
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        药品数量
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                        退药原因
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        状态
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {returnRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-medium text-gray-900">
                          {record.returnNo}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="font-medium">{record.patientName}</div>
                          <div className="text-xs text-gray-500">{record.patientId}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{record.prescriptionNo}</td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {record.items.length} 种
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                          {record.reason}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              record.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-600'
                                : record.status === 'completed'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {record.status === 'pending'
                              ? '待审核'
                              : record.status === 'completed'
                              ? '已完成'
                              : '已拒绝'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {record.status === 'pending' && (
                            <button
                              onClick={() => handleApproveReturn(record.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              审核通过
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">退药申请已提交</h3>
            <p className="text-gray-500">请等待药师审核</p>
          </div>
        </div>
      )}
    </div>
  );
}