import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  Calendar,
  Package,
  MapPin,
  TrendingDown,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { checkExpiryStatus } from '@/utils/validation';

export function InventoryExpiry() {
  const { inventoryBatches, medicines } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDays, setSelectedDays] = useState<number | 'all'>('all');

  const expiryInventory = useMemo(() => {
    return inventoryBatches
      .map((batch) => {
        const medicine = medicines.find((m) => m.id === batch.medicineId);
        const expiry = new Date(batch.expiryDate);
        const now = new Date();
        const daysToExpiry = Math.ceil(
          (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const expiryStatus = checkExpiryStatus(batch.expiryDate);
        const estimatedLoss =
          daysToExpiry <= 0 ? (medicine?.price || 0) * batch.quantity : 0;

        return {
          ...batch,
          medicine,
          daysToExpiry,
          expiryStatus,
          estimatedLoss,
        };
      })
      .filter((item) => item.expiryStatus !== 'normal')
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  }, [inventoryBatches, medicines]);

  const filteredInventory = useMemo(() => {
    return expiryInventory.filter((item) => {
      const matchSearch =
        item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDays =
        selectedDays === 'all' || item.daysToExpiry <= selectedDays;
      return matchSearch && matchDays;
    });
  }, [expiryInventory, searchQuery, selectedDays]);

  const criticalItems = filteredInventory.filter(
    (item) => item.expiryStatus === 'danger'
  ).length;

  const warningItems = filteredInventory.filter(
    (item) => item.expiryStatus === 'warning'
  ).length;

  const totalEstimatedLoss = filteredInventory.reduce(
    (sum, item) => sum + item.estimatedLoss,
    0
  );

  const getExpiryStatusClass = (status: string) => {
    switch (status) {
      case 'danger':
        return 'bg-red-100 text-red-600 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      default:
        return 'bg-green-100 text-green-600 border-green-200';
    }
  };

  const getExpiryStatusText = (status: string) => {
    switch (status) {
      case 'danger':
        return '紧急预警';
      case 'warning':
        return '效期预警';
      default:
        return '正常';
    }
  };

  const getDaysColor = (days: number) => {
    if (days <= 0) return 'text-red-600 font-bold';
    if (days <= 30) return 'text-red-500';
    if (days <= 90) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">效期预警</h1>
        <p className="text-gray-500 mt-1">药品效期监控、临期预警、过期损失统计</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">30天内到期</p>
              <p className="text-3xl font-bold text-red-700 mt-1">{criticalItems}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700">90天内到期</p>
              <p className="text-3xl font-bold text-yellow-700 mt-1">{warningItems}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">预警批次总数</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {filteredInventory.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700">预估损失金额</p>
              <p className="text-3xl font-bold text-orange-700 mt-1">
                ¥{totalEstimatedLoss.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索药品名称、批号..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedDays === 'all' ? 'all' : selectedDays}
              onChange={(e) =>
                setSelectedDays(
                  e.target.value === 'all' ? 'all' : parseInt(e.target.value)
                )
              }
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部预警</option>
              <option value="30">30天内到期</option>
              <option value="60">60天内到期</option>
              <option value="90">90天内到期</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredInventory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">暂无效期预警</h3>
            <p className="text-gray-500">所有药品效期均在正常范围内</p>
          </div>
        ) : (
          filteredInventory.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md ${getExpiryStatusClass(
                item.expiryStatus
              )}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.medicineName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.expiryStatus === 'danger'
                          ? 'bg-red-200 text-red-700'
                          : 'bg-yellow-200 text-yellow-700'
                      }`}
                    >
                      {getExpiryStatusText(item.expiryStatus)}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">批号：</span>
                      <span className="font-mono text-gray-900">
                        {item.batchNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">规格：</span>
                      <span className="text-gray-900">
                        {item.medicine?.specification}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">库存数量：</span>
                      <span className="text-gray-900 font-medium">
                        {item.quantity} {item.medicine?.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">储位：</span>
                      <span className="flex items-center gap-1 text-gray-900">
                        <MapPin className="w-4 h-4" />
                        {item.location}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">供应商：</span>
                      <span className="text-gray-900">{item.supplierName}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <div
                    className={`text-3xl font-bold ${getDaysColor(
                      item.daysToExpiry
                    )}`}
                  >
                    {item.daysToExpiry > 0 ? item.daysToExpiry : 0}
                  </div>
                  <div className="text-sm text-gray-500">天后到期</div>
                  <div className="mt-2 text-sm">
                    <span className="text-gray-500">有效期至：</span>
                    <span className="text-gray-700">{item.expiryDate}</span>
                  </div>
                </div>
              </div>
              {item.daysToExpiry <= 0 && (
                <div className="mt-4 pt-4 border-t border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-medium">该批次药品已过期</span>
                    </div>
                    <div className="text-red-700">
                      预估损失：
                      <span className="font-bold">
                        ¥{item.estimatedLoss.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}