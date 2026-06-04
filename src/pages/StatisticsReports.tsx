import React, { useState, useMemo, useCallback } from 'react';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  PieChart,
  BarChart2,
  TrendingUp as TrendingUpIcon,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import ReactECharts from 'echarts-for-react';
import * as XLSX from 'xlsx';

export function StatisticsReports() {
  const { medicines, suppliers, purchaseOrders, inventoryBatches, prescriptions } = useAppStore();

  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(medicines.map((m) => m.category));
    return Array.from(cats);
  }, [medicines]);

  const getDateFilter = useCallback(() => {
    const now = new Date();
    let startDate: Date;
    switch (selectedPeriod) {
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return startDate;
  }, [selectedPeriod]);

  const filteredPurchaseOrders = useMemo(() => {
    const startDate = getDateFilter();
    return purchaseOrders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate;
    });
  }, [purchaseOrders, getDateFilter]);

  const filteredPrescriptions = useMemo(() => {
    const startDate = getDateFilter();
    return prescriptions.filter((p) => {
      const prescDate = new Date(p.createdAt);
      return prescDate >= startDate;
    });
  }, [prescriptions, getDateFilter]);

  const purchaseBySupplier = useMemo(() => {
    const supplierData = new Map<string, { name: string; amount: number; count: number }>();

    filteredPurchaseOrders.forEach((order) => {
      if (order.status === 'completed' || order.status === 'approved' || order.status === 'in_transit') {
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
  }, [filteredPurchaseOrders]);

  const purchaseByCategory = useMemo(() => {
    const categoryData = new Map<string, number>();

    filteredPurchaseOrders.forEach((order) => {
      if (order.status === 'completed' || order.status === 'approved' || order.status === 'in_transit') {
        order.items.forEach((item) => {
          const medicine = medicines.find((m) => m.id === item.medicineId);
          if (medicine) {
            const existing = categoryData.get(medicine.category) || 0;
            categoryData.set(medicine.category, existing + item.subtotal);
          }
        });
      }
    });

    return Array.from(categoryData.entries())
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredPurchaseOrders, medicines]);

  const monthlyData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const purchaseByMonth = new Array(12).fill(0);
    const prescriptionByMonth = new Array(12).fill(0);

    const now = new Date();
    const year = now.getFullYear();

    purchaseOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      if (orderDate.getFullYear() === year && order.status === 'completed') {
        purchaseByMonth[orderDate.getMonth()] += order.totalAmount;
      }
    });

    prescriptions.forEach((p) => {
      const prescDate = new Date(p.createdAt);
      if (prescDate.getFullYear() === year && p.status === 'completed') {
        prescriptionByMonth[prescDate.getMonth()] += 1;
      }
    });

    return {
      months,
      purchaseAmounts: purchaseByMonth.map((v) => Math.round(v / 10000)),
      prescriptionCounts: prescriptionByMonth,
    };
  }, [purchaseOrders, prescriptions]);

  const turnoverByMedicine = useMemo(() => {
    return medicines
      .map((medicine) => {
        const totalStock = inventoryBatches
          .filter((b) => b.medicineId === medicine.id)
          .reduce((sum, b) => sum + b.quantity, 0);

        const dispensed = filteredPrescriptions
          .filter((p) => p.status === 'completed' || p.status === 'dispensing')
          .flatMap((p) => p.items)
          .filter((i) => i.medicineName === medicine.genericName)
          .reduce((sum, i) => sum + i.quantity, 0);

        const avgMonthlyUsage = medicine.monthlyUsage?.length
          ? medicine.monthlyUsage.reduce((a, b) => a + b, 0) / medicine.monthlyUsage.length
          : dispensed / 3;

        const turnoverDays = avgMonthlyUsage > 0 ? Math.round((totalStock / avgMonthlyUsage) * 30) : 0;

        return {
          name: medicine.genericName,
          category: medicine.category,
          totalStock,
          dispensed,
          avgMonthlyUsage: Math.round(avgMonthlyUsage),
          turnoverDays,
        };
      })
      .filter((m) => selectedCategory === 'all' || m.category === selectedCategory)
      .filter((m) => m.totalStock > 0 || m.dispensed > 0)
      .sort((a, b) => b.turnoverDays - a.turnoverDays)
      .slice(0, 15);
  }, [medicines, inventoryBatches, filteredPrescriptions, selectedCategory]);

  const expiryLossRate = useMemo(() => {
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const ninetyDaysLater = new Date();
    ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);

    let expiringValue = 0;
    let warningValue = 0;
    let totalValue = 0;

    inventoryBatches.forEach((batch) => {
      const medicine = medicines.find((m) => m.id === batch.medicineId);
      const price = medicine?.price || 0;
      const value = price * batch.quantity;
      totalValue += value;

      const expiry = new Date(batch.expiryDate);
      if (expiry <= thirtyDaysLater) {
        expiringValue += value;
      } else if (expiry <= ninetyDaysLater) {
        warningValue += value;
      }
    });

    return {
      expiringRate: totalValue > 0 ? ((expiringValue / totalValue) * 100).toFixed(2) : '0.00',
      warningRate: totalValue > 0 ? ((warningValue / totalValue) * 100).toFixed(2) : '0.00',
      totalValue: Math.round(totalValue),
      expiringValue: Math.round(expiringValue),
      warningValue: Math.round(warningValue),
    };
  }, [inventoryBatches, medicines]);

  const totalPurchaseAmount = useMemo(() => {
    return filteredPurchaseOrders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [filteredPurchaseOrders]);

  const avgTurnoverDays = useMemo(() => {
    const validMedicines = turnoverByMedicine.filter((m) => m.turnoverDays > 0);
    if (validMedicines.length === 0) return 0;
    return Math.round(validMedicines.reduce((sum, m) => sum + m.turnoverDays, 0) / validMedicines.length);
  }, [turnoverByMedicine]);

  const monthlyPurchaseOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['采购金额(万元)', '处方数量'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: monthlyData.months,
      axisLabel: {
        fontSize: 12,
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '采购金额(万元)',
        axisLabel: {
          formatter: '{value}',
        },
      },
      {
        type: 'value',
        name: '处方数量',
        axisLabel: {
          formatter: '{value}',
        },
      },
    ],
    series: [
      {
        name: '采购金额(万元)',
        type: 'bar',
        data: monthlyData.purchaseAmounts,
        itemStyle: {
          color: '#3b82f6',
          borderRadius: [4, 4, 0, 0],
        },
        yAxisIndex: 0,
        barWidth: '40%',
      },
      {
        name: '处方数量',
        type: 'line',
        data: monthlyData.prescriptionCounts,
        itemStyle: {
          color: '#10b981',
        },
        lineStyle: {
          width: 3,
        },
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: 1,
      },
    ],
  }), [monthlyData]);

  const categoryPurchaseOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: purchaseByCategory,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        label: {
          show: true,
          formatter: '{b}: {d}%',
        },
      },
    ],
  }), [purchaseByCategory]);

  const turnoverOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      name: '周转天数',
      axisLabel: {
        formatter: '{value}天',
      },
    },
    yAxis: {
      type: 'category',
      data: turnoverByMedicine.map((m) => m.name),
      axisLabel: {
        fontSize: 11,
        interval: 0,
      },
    },
    series: [
      {
        type: 'bar',
        data: turnoverByMedicine.map((m) => ({
          value: m.turnoverDays,
          itemStyle: {
            color: m.turnoverDays > 60 ? '#ef4444' : m.turnoverDays > 30 ? '#f59e0b' : '#10b981',
          },
        })),
        barWidth: '60%',
        label: {
          show: true,
          position: 'right',
          formatter: '{c}天',
        },
      },
    ],
  }), [turnoverByMedicine]);

  const exportToExcel = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const wb = XLSX.utils.book_new();

        const purchaseSummaryData = [
          ['采购订单汇总'],
          ['订单号', '供应商', '状态', '总金额', '创建日期', '采购项数'],
          ...filteredPurchaseOrders.map((order) => [
            order.orderNo,
            order.supplierName,
            getStatusText(order.status),
            order.totalAmount,
            order.createdAt,
            order.items.length,
          ]),
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(purchaseSummaryData);
        ws1['!cols'] = [
          { wch: 15 }, { wch: 20 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
        ];
        XLSX.utils.book_append_sheet(wb, ws1, '采购订单');

        const supplierData = [
          ['供应商采购统计'],
          ['排名', '供应商名称', '采购次数', '采购金额(元)'],
          ...purchaseBySupplier.slice(0, 20).map((s, i) => [
            i + 1, s.name, s.count, s.amount,
          ]),
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(supplierData);
        ws2['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws2, '供应商统计');

        const categoryData = [
          ['药品分类采购统计'],
          ['分类', '采购金额(元)', '占比'],
          ...purchaseByCategory.map((c) => {
            const total = purchaseByCategory.reduce((sum, c) => sum + c.value, 0);
            return [c.name, c.value, `${((c.value / total) * 100).toFixed(1)}%`];
          }),
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(categoryData);
        ws3['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws3, '分类统计');

        const turnoverData = [
          ['库存周转分析(TOP15)'],
          ['排名', '药品名称', '分类', '当前库存', '月均用量', '周转天数', '状态'],
          ...turnoverByMedicine.map((m, i) => [
            i + 1,
            m.name,
            m.category,
            m.totalStock,
            m.avgMonthlyUsage,
            m.turnoverDays,
            m.turnoverDays > 60 ? '周转过慢' : m.turnoverDays > 30 ? '周转正常' : '周转良好',
          ]),
        ];
        const ws4 = XLSX.utils.aoa_to_sheet(turnoverData);
        ws4['!cols'] = [
          { wch: 8 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        ];
        XLSX.utils.book_append_sheet(wb, ws4, '周转分析');

        const expiryData = [
          ['效期预警分析'],
          ['状态', '金额(元)', '占比', '说明'],
          ['30天内到期', expiryLossRate.expiringValue, `${expiryLossRate.expiringRate}%`, '需紧急处理'],
          ['30-90天到期', expiryLossRate.warningValue, `${expiryLossRate.warningRate}%`, '需关注'],
          ['库存总价值', expiryLossRate.totalValue, '100%', ''],
        ];
        const ws5 = XLSX.utils.aoa_to_sheet(expiryData);
        ws5['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws5, '效期分析');

        const now = new Date();
        const periodText = selectedPeriod === 'month' ? '月度' : selectedPeriod === 'quarter' ? '季度' : '年度';
        const fileName = `药房运营分析报告_${periodText}_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.xlsx`;

        XLSX.writeFile(wb, fileName);
      } catch (error) {
        console.error('导出Excel失败:', error);
        alert('导出Excel失败，请重试');
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      draft: '草稿',
      pending_dept: '待药学部审批',
      pending_hospital: '待院领导审批',
      approved: '已批准',
      rejected: '已驳回',
      in_transit: '在途',
      completed: '已完成',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据报表</h1>
          <p className="text-gray-500 mt-1">采购金额、周转天数、效期损失统计分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year')}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="month">本月</option>
              <option value="quarter">本季度</option>
              <option value="year">本年度</option>
            </select>
          </div>
          <button
            onClick={exportToExcel}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                导出Excel
              </>
            )}
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
              <p className="text-sm text-gray-500">
                {selectedPeriod === 'month' ? '本月' : selectedPeriod === 'quarter' ? '本季度' : '本年度'}采购总金额
              </p>
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{avgTurnoverDays} 天</p>
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
              <p className="text-sm text-gray-500">30天内效期损失率</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  parseFloat(expiryLossRate.expiringRate) > 2 ? 'text-red-600' : 'text-orange-600'
                }`}
              >
                {expiryLossRate.expiringRate}%
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                parseFloat(expiryLossRate.expiringRate) > 2 ? 'bg-red-100' : 'bg-orange-100'
              }`}
            >
              <AlertTriangle
                className={`w-6 h-6 ${
                  parseFloat(expiryLossRate.expiringRate) > 2 ? 'text-red-600' : 'text-orange-600'
                }`}
              />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
            涉及金额 ¥{expiryLossRate.expiringValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {selectedPeriod === 'month' ? '本月' : selectedPeriod === 'quarter' ? '本季度' : '本年度'}处方总数
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredPrescriptions.length}</p>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              月度采购趋势
            </h3>
            <span className="text-xs text-gray-400">本年度数据</span>
          </div>
          <ReactECharts option={monthlyPurchaseOption} style={{ height: '300px' }} />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              药品分类采购占比
            </h3>
            <span className="text-xs text-gray-400">
              {selectedPeriod === 'month' ? '本月' : selectedPeriod === 'quarter' ? '本季度' : '本年度'}
            </span>
          </div>
          <ReactECharts option={categoryPurchaseOption} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-500" />
            库存周转天数排行 (TOP15)
          </h3>
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
        <ReactECharts option={turnoverOption} style={{ height: '400px' }} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">供应商采购排行</h3>
            <span className="text-xs text-gray-400">TOP10</span>
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
            <h3 className="font-semibold text-gray-900">效期预警分析</h3>
            <span className="text-xs text-gray-400">当前库存</span>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-800">30天内到期</span>
                  </div>
                  <span className="text-red-600 font-bold">{expiryLossRate.expiringRate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600">涉及金额</span>
                  <span className="text-red-800 font-medium">
                    ¥{expiryLossRate.expiringValue.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-red-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full"
                    style={{ width: `${Math.min(parseFloat(expiryLossRate.expiringRate) * 10, 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-yellow-800">30-90天到期</span>
                  </div>
                  <span className="text-yellow-600 font-bold">{expiryLossRate.warningRate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-yellow-600">涉及金额</span>
                  <span className="text-yellow-800 font-medium">
                    ¥{expiryLossRate.warningValue.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-2 bg-yellow-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${Math.min(parseFloat(expiryLossRate.warningRate) * 5, 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUpIcon className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-800">库存总价值</span>
                  </div>
                  <span className="text-green-600 font-bold">100%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">总金额</span>
                  <span className="text-green-800 font-medium">
                    ¥{expiryLossRate.totalValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-sm text-gray-500">
                <div className="flex items-center justify-between py-1">
                  <span>供应商总数</span>
                  <span className="font-medium text-gray-900">{suppliers.length} 家</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>药品品规数</span>
                  <span className="font-medium text-gray-900">{medicines.length} 种</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>库存批次</span>
                  <span className="font-medium text-gray-900">{inventoryBatches.length} 批</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
