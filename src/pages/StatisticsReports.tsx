import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import ReactECharts from 'echarts-for-react';

export function StatisticsReports() {
  const { medicines, suppliers, purchaseOrders, inventoryBatches, prescriptions } = useAppStore();

  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set(medicines.map((m) => m.category));
    return Array.from(cats);
  }, [medicines]);

  const purchaseBySupplier = useMemo(() => {
    const supplierData = new Map<string, { name: string; amount: number; count: number }>();

    purchaseOrders.forEach((order) => {
      if (order.status === 'completed' || order.status === 'approved') {
        const existing = supplierData.get(order.supplierId) || {
          name: order.supplierName,
          amount: 0,
          count: 0,
        };
        supplierData.set(order.supplierId, {
          ...existing,
          amount: existing.amount + order.totalAmount,
          count: existing.count + 1,
        });
      }
    });

    return Array.from(supplierData.values()).sort((a, b) => b.amount - a.amount);
  }, [purchaseOrders]);

  const turnoverByMedicine = useMemo(() => {
    return medicines
      .map((medicine) => {
        const totalStock = inventoryBatches
          .filter((b) => b.medicineId === medicine.id)
          .reduce((sum, b) => sum + b.quantity, 0);

        const dispensed = prescriptions
          .filter((p) => p.status === 'completed')
          .flatMap((p) => p.items)
          .filter((i) => i.medicineName === medicine.genericName)
          .reduce((sum, i) => sum + i.quantity, 0);

        const turnoverDays = totalStock > 0 ? Math.round((totalStock / (dispensed || 1)) * 30) : 0;

        return {
          name: medicine.genericName,
          category: medicine.category,
          totalStock,
          dispensed,
          turnoverDays,
        };
      })
      .filter((m) => selectedCategory === 'all' || m.category === selectedCategory)
      .sort((a, b) => b.turnoverDays - a.turnoverDays)
      .slice(0, 10);
  }, [medicines, inventoryBatches, prescriptions, selectedCategory]);

  const expiryLossRate = useMemo(() => {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    let expiringValue = 0;
    let totalValue = 0;

    inventoryBatches.forEach((batch) => {
      const medicine = medicines.find((m) => m.id === batch.medicineId);
      const price = medicine?.price || 0;
      const value = price * batch.quantity;
      totalValue += value;

      const expiry = new Date(batch.expiryDate);
      if (expiry <= thirtyDaysLater) {
        expiringValue += value;
      }
    });

    return totalValue > 0 ? ((expiringValue / totalValue) * 100).toFixed(2) : '0.00';
  }, [inventoryBatches, medicines]);

  const monthlyPurchaseOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['采购金额', '处方数量'],
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(万元)',
      },
      {
        type: 'value',
        name: '数量',
      },
    ],
    series: [
      {
        name: '采购金额',
        type: 'bar',
        data: [120, 132, 101, 134, 90, 230, 210, 182, 191, 234, 290, 330],
        itemStyle: { color: '#3b82f6' },
        yAxisIndex: 0,
      },
      {
        name: '处方数量',
        type: 'line',
        data: [820, 932, 901, 934, 1290, 1330, 1320, 1450, 1380, 1520, 1600, 1780],
        itemStyle: { color: '#10b981' },
        yAxisIndex: 1,
      },
    ],
  };

  const categoryPurchaseOption = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 1048, name: '抗生素' },
          { value: 735, name: '心血管' },
          { value: 580, name: '消化系统' },
          { value: 484, name: '神经系统' },
          { value: 300, name: '呼吸系统' },
          { value: 280, name: '其他' },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  const totalPurchaseAmount = purchaseOrders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据报表</h1>
          <p className="text-gray-500 mt-1">采购金额、周转天数、效期损失统计分析</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">本月</option>
            <option value="quarter">本季度</option>
            <option value="year">本年度</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <FileSpreadsheet className="w-4 h-4" />
            导出Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <FileText className="w-4 h-4" />
            生成PDF报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">采购总金额</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ¥{totalPurchaseAmount.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="w-4 h-4" />
            同比增长 12.5%
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均周转天数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">28 天</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
            <TrendingDown className="w-4 h-4" />
            较上月减少 3 天
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">效期损失率</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{expiryLossRate}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
            控制在 5% 目标内
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">处方总数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{prescriptions.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
            <TrendingUp className="w-4 h-4" />
            环比增长 8.2%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">月度采购趋势</h3>
          <ReactECharts option={monthlyPurchaseOption} style={{ height: '300px' }} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">药品分类采购占比</h3>
          <ReactECharts option={categoryPurchaseOption} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">供应商采购排行</h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">排名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">供应商</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">采购次数</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">采购金额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchaseBySupplier.slice(0, 10).map((supplier, index) => (
                  <tr key={supplier.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index < 3
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{supplier.name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{supplier.count} 次</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      ¥{supplier.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">周转天数排行 (TOP10)</h3>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">排名</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">药品名称</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">分类</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">库存</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">周转天数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {turnoverByMedicine.map((medicine, index) => (
                  <tr key={medicine.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          medicine.turnoverDays > 60
                            ? 'bg-red-100 text-red-600'
                            : medicine.turnoverDays > 30
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{medicine.name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{medicine.category}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{medicine.totalStock}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-medium ${
                          medicine.turnoverDays > 60
                            ? 'text-red-600'
                            : medicine.turnoverDays > 30
                            ? 'text-orange-600'
                            : 'text-green-600'
                        }`}
                      >
                        {medicine.turnoverDays} 天
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}