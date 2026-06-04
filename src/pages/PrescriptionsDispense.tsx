import React, { useState, useMemo } from 'react';
import {
  Scan,
  Search,
  Package,
  MapPin,
  CheckCircle,
  User,
  Pill,
  AlertTriangle,
  QrCode,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Prescription, InventoryBatch } from '@/types';

interface BatchAssignment {
  itemId: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
}

export function PrescriptionsDispense() {
  const { prescriptions, inventoryBatches, user, dispensePrescription } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [batchAssignments, setBatchAssignments] = useState<BatchAssignment[]>([]);
  const [scannedPrescriptionNo, setScannedPrescriptionNo] = useState('');
  const [dispenseSuccess, setDispenseSuccess] = useState(false);

  const reviewedPrescriptions = useMemo(() => {
    return prescriptions
      .filter((p) => p.status === 'reviewed')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [prescriptions]);

  const filteredPrescriptions = useMemo(() => {
    return reviewedPrescriptions.filter(
      (p) =>
        p.prescriptionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [reviewedPrescriptions, searchQuery]);

  const getAvailableBatches = (medicineId: string): InventoryBatch[] => {
    return inventoryBatches.filter(
      (b) => b.medicineId === medicineId && b.quantity > 0
    );
  };

  const handleSelectPrescription = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    const assignments: BatchAssignment[] = prescription.items.map((item) => {
      const batches = getAvailableBatches(item.medicineId);
      const defaultBatch = batches[0];
      return {
        itemId: item.id,
        batchId: defaultBatch?.id || '',
        batchNumber: defaultBatch?.batchNumber || '',
        quantity: item.quantity,
      };
    });
    setBatchAssignments(assignments);
    setDispenseSuccess(false);
  };

  const handleBatchChange = (itemId: string, batchId: string) => {
    const batch = inventoryBatches.find((b) => b.id === batchId);
    setBatchAssignments((prev) =>
      prev.map((a) =>
        a.itemId === itemId
          ? { ...a, batchId, batchNumber: batch?.batchNumber || '' }
          : a
      )
    );
  };

  const handleScan = () => {
    const prescription = reviewedPrescriptions.find(
      (p) => p.prescriptionNo === scannedPrescriptionNo.toUpperCase()
    );
    if (prescription) {
      handleSelectPrescription(prescription);
      setScannedPrescriptionNo('');
    } else {
      alert('未找到该处方，请检查处方号');
    }
  };

  const handleDispense = () => {
    if (!selectedPrescription) return;

    const missingBatches = batchAssignments.filter((a) => !a.batchId);
    if (missingBatches.length > 0) {
      alert('请为所有药品选择批次');
      return;
    }

    dispensePrescription(
      selectedPrescription.id,
      user?.name || '系统',
      batchAssignments.map((a) => ({
        itemId: a.itemId,
        batchId: a.batchId,
        batchNumber: a.batchNumber,
      }))
    );

    setDispenseSuccess(true);
    setTimeout(() => {
      setSelectedPrescription(null);
      setBatchAssignments([]);
      setDispenseSuccess(false);
    }, 2000);
  };

  if (dispenseSuccess) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">发药完成</h2>
          <p className="text-gray-500">处方 {selectedPrescription?.prescriptionNo} 已成功发药</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">处方调剂</h1>
        <p className="text-gray-500 mt-1">扫码发药、批次选择、库存扣减</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待调剂处方</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {reviewedPrescriptions.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日已发药</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {
                  prescriptions.filter(
                    (p) =>
                      p.status === 'completed' &&
                      new Date(p.dispensedAt || '').toDateString() ===
                        new Date().toDateString()
                  ).length
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均发药时间</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">45 秒</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Scan className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">发药准确率</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">99.8%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索处方号、患者姓名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="扫描处方号..."
                  value={scannedPrescriptionNo}
                  onChange={(e) => setScannedPrescriptionNo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleScan}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                扫码
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">待调剂处方列表</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredPrescriptions.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p>暂无待调剂处方</p>
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
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-gray-900">
                              {prescription.prescriptionNo}
                            </span>
                            {prescription.floorStation && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">
                                {prescription.floorStation}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {prescription.patientName}
                            </span>
                            <span>{prescription.items.length} 种药品</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-96">
          {selectedPrescription ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              <div className="p-4 bg-blue-600 text-white">
                <h3 className="font-bold text-lg">{selectedPrescription.prescriptionNo}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-blue-100">
                  <span>{selectedPrescription.patientName}</span>
                  <span>{selectedPrescription.department}</span>
                </div>
              </div>

              <div className="p-4 max-h-[500px] overflow-y-auto">
                <h4 className="font-medium text-gray-900 mb-3">药品明细</h4>
                <div className="space-y-4">
                  {selectedPrescription.items.map((item, index) => {
                    const batches = getAvailableBatches(item.medicineId);
                    const assignment = batchAssignments.find((a) => a.itemId === item.id);

                    return (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.medicineName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.specification}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-white rounded text-sm font-medium">
                            x{item.quantity}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {item.dosage} {item.frequency}，共{item.days}天
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">选择批次</label>
                          <select
                            value={assignment?.batchId || ''}
                            onChange={(e) => handleBatchChange(item.id, e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">请选择批次</option>
                            {batches.map((batch) => (
                              <option key={batch.id} value={batch.id}>
                                {batch.batchNumber} | 库存：{batch.quantity} | 有效期：
                                {batch.expiryDate}
                              </option>
                            ))}
                          </select>
                        </div>
                        {batches.length === 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            库存不足
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleDispense}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  确认发药
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center sticky top-6">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">请选择待调剂处方</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}