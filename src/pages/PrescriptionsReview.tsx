import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileCheck,
  User,
  Calendar,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Prescription } from '@/types';
import { statusColors, statusLabels } from '@/config/navConfig';

export function PrescriptionsReview() {
  const { prescriptions, medicines, user, reviewPrescription } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const pendingPrescriptions = useMemo(() => {
    return prescriptions
      .filter((p) => p.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [prescriptions]);

  const filteredPrescriptions = useMemo(() => {
    return pendingPrescriptions.filter(
      (p) =>
        p.prescriptionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pendingPrescriptions, searchQuery]);

  const handleReview = (prescription: Prescription, approved: boolean) => {
    if (approved && prescription.warnings.length > 0) {
      const confirmed = window.confirm(
        `该处方存在 ${prescription.warnings.length} 条用药警示，确定审核通过吗？`
      );
      if (!confirmed) return;
    }
    reviewPrescription(prescription.id, user?.name || '系统', approved ? 'reviewed' : 'rejected');
    setSelectedPrescription(null);
    setShowDetailModal(false);
  };

  const getWarningSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getWarningTypeText = (type: string) => {
    switch (type) {
      case 'conflict':
        return '配伍禁忌';
      case 'duplicate':
        return '重复用药';
      case 'dosage':
        return '剂量异常';
      case 'age':
        return '年龄限制';
      default:
        return '其他';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">处方审核</h1>
        <p className="text-gray-500 mt-1">处方用药审核、配伍禁忌校验、重复用药检查</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待审核处方</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {pendingPrescriptions.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">含警示处方</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {pendingPrescriptions.filter((p) => p.warnings.length > 0).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日已审核</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {
                  prescriptions.filter(
                    (p) =>
                      p.status === 'reviewed' &&
                      new Date(p.createdAt).toDateString() === new Date().toDateString()
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
              <p className="text-sm text-gray-500">平均审核时间</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">2.3 分钟</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索处方号、患者姓名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-sm text-gray-500">
                共 {filteredPrescriptions.length} 张待审核处方
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {filteredPrescriptions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500">暂无待审核处方</p>
              </div>
            ) : (
              filteredPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedPrescription(prescription);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-bold text-gray-900">
                          {prescription.prescriptionNo}
                        </span>
                        {prescription.warnings.length > 0 && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                            {prescription.warnings.length} 条警示
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {prescription.patientName} ({prescription.patientAge}岁)
                        </span>
                        <span>{prescription.department}</span>
                        <span>{prescription.doctor}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {new Date(prescription.createdAt).toLocaleString()}
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="text-sm text-gray-600 mb-2">
                      药品列表（{prescription.items.length} 种）
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {prescription.items.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                        >
                          {item.medicineName}
                        </span>
                      ))}
                      {prescription.items.length > 4 && (
                        <span className="px-2 py-1 text-gray-500 text-sm">
                          +{prescription.items.length - 4} 种
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-96">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">审核提示</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 text-xs font-bold">!</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">高警示药品</p>
                  <p className="text-gray-500">需要双人核对确认</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-600 text-xs font-bold">!</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">儿童患者</p>
                  <p className="text-gray-500">请确认用量符合儿童规范</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">i</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">配伍禁忌</p>
                  <p className="text-gray-500">存在药物相互作用风险</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDetailModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    处方审核 - {selectedPrescription.prescriptionNo}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {selectedPrescription.patientName} | {selectedPrescription.department} |{' '}
                    {selectedPrescription.doctor}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedPrescription.warnings.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    用药警示
                  </h3>
                  <div className="space-y-3">
                    {selectedPrescription.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getWarningSeverityClass(
                          warning.severity
                        )}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-white rounded text-xs font-medium">
                            {getWarningTypeText(warning.type)}
                          </span>
                          <span className="text-sm font-medium">
                            {warning.medicines.join(' + ')}
                          </span>
                        </div>
                        <p className="text-sm">{warning.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">处方明细</h3>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                          药品名称
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">
                          规格
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">
                          数量
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">
                          用法用量
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPrescription.items.map((item) => (
                        <tr key={item.id} className="hover:bg-white">
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-900">
                              {item.medicineName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {item.specification}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600 text-sm">
                            {item.dosage} {item.frequency}，共{item.days}天
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => handleReview(selectedPrescription, false)}
                className="px-6 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                驳回
              </button>
              <button
                onClick={() => handleReview(selectedPrescription, true)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                审核通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}