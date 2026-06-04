import React, { useState, useMemo } from 'react';
import {
  Warehouse,
  Search,
  Filter,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Package,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { checkExpiryStatus, checkStockStatus } from '@/utils/validation';
import { storageConditionLabels } from '@/config/navConfig';

export function InventoryList() {
  const { inventoryBatches, medicines, warehouseZones } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const inventoryWithDetails = useMemo(() => {
    return inventoryBatches.map((batch) => {
      const medicine = medicines.find((m) => m.id === batch.medicineId);
      const expiryStatus = checkExpiryStatus(batch.expiryDate);
      const totalQuantity = inventoryBatches
        .filter((b) => b.medicineId === batch.medicineId)
        .reduce((sum, b) => sum + b.quantity, 0);
      const stockStatus = checkStockStatus(
        totalQuantity,
        medicine?.minStock || 0,
        medicine?.maxStock || 1000
      );

      return {
        ...batch,
        medicine,
        expiryStatus,
        stockStatus,
        totalQuantity,
      };
    });
  }, [inventoryBatches, medicines]);

  const filteredInventory = useMemo(() => {
    return inventoryWithDetails.filter((item) => {
      const matchSearch =
        item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchZone = selectedZone === 'all' || item.zoneId === selectedZone;
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'expiry_danger' && item.expiryStatus === 'danger') ||
        (selectedStatus === 'expiry_warning' && item.expiryStatus === 'warning') ||
        (selectedStatus === 'stock_low' && item.stockStatus === 'low') ||
        (selectedStatus === 'stock_empty' && item.stockStatus === 'empty');
      return matchSearch && matchZone && matchStatus;
    });
  }, [inventoryWithDetails, searchQuery, selectedZone, selectedStatus]);

  const getExpiryStatusClass = (status: string) => {
    switch (status) {
      case 'danger':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-green-100 text-green-600';
    }
  };

  const getExpiryStatusText = (status: string) => {
    switch (status) {
      case 'danger':
        return '临期';
      case 'warning':
        return '预警';
      default:
        return '正常';
    }
  };

  const getStockStatusClass = (status: string) => {
    switch (status) {
      case 'empty':
        return 'bg-red-100 text-red-600';
      case 'low':
        return 'bg-orange-100 text-orange-600';
      case 'high':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-green-100 text-green-600';
    }
  };

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'empty':
        return '缺货';
      case 'low':
        return '偏低';
      case 'high':
        return '偏高';
      default:
        return '正常';
    }
  };

  const getDaysToExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const totalValue = inventoryWithDetails.reduce((sum, item) => {
    const price = item.medicine?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  const expiringItems = inventoryWithDetails.filter(
    (item) => item.expiryStatus !== 'normal'
  ).length;

  const lowStockItems = inventoryWithDetails.filter(
    (item) => item.stockStatus === 'low' || item.stockStatus === 'empty'
  ).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">库存查询</h1>
        <p className="text-gray-500 mt-1">实时库存查询、批号追踪、库存状态监控</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">库存总金额</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ¥{totalValue.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">库存批次</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {inventoryBatches.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">效期预警</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{expiringItems}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">库存偏低</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{lowStockItems}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
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
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部库区</option>
              {warehouseZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="expiry_danger">效期临期</option>
              <option value="expiry_warning">效期预警</option>
              <option value="stock_low">库存偏低</option>
              <option value="stock_empty">库存缺货</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            共 {filteredInventory.length} 条记录
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">药品信息</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">批号</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">生产日期</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">有效期</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">效期状态</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">库存数量</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">库存状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">储位</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">供应商</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{item.medicineName}</div>
                    <div className="text-xs text-gray-500">
                      {item.medicine?.specification} | {item.medicine?.dosageForm}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-sm text-gray-700">
                    {item.batchNumber}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500">
                    {item.productionDate}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-gray-700">{item.expiryDate}</div>
                    <div className="text-xs text-gray-400">
                      剩余 {getDaysToExpiry(item.expiryDate)} 天
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getExpiryStatusClass(
                        item.expiryStatus
                      )}`}
                    >
                      {getExpiryStatusText(item.expiryStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="font-medium text-gray-900">{item.quantity}</div>
                    <div className="text-xs text-gray-400">
                      总库存: {item.totalQuantity}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusClass(
                        item.stockStatus
                      )}`}
                    >
                      {getStockStatusText(item.stockStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{item.location}</span>
                    </div>
                    <div className="text-xs text-gray-400">{item.zoneName}</div>
                  </td>
                  <td className="px-4 py-4 text-gray-700">{item.supplierName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}