import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { statisticsApi } from '@/services/api';
import ReactECharts from 'echarts-for-react';
import * as XLSX from 'xlsx';

interface OverviewData {
  totalPurchaseAmount: number;
  avgTurnoverDays: number;
  expiringRate: number;
  expiringValue: number;
  warningRate: number;
  warningValue: number;
  totalInventoryValue: number;
  prescriptionCount: number;
  supplierCount: number;
  medicineCount: number;
  batchCount: number;
}

interface MonthlyPurchaseItem {
  month: string;
  purchaseAmount: number;
  prescriptionCount: number;
}

interface CategoryPurchaseItem {
  name: string;
  value: number;
}

interface SupplierPurchaseItem {
  name: string;
  amount: number;
  count: number;
}

interface TurnoverItem {
  name: string;
  category: string;
  totalStock: number;
  dispensed: number;
  avgMonthlyUsage: number;
  turnoverDays: number;
}

interface ExpiryData {
  expiringRate: string;
  warningRate: string;
  totalValue: number;
  expiringValue: number;
  warningValue: number;
}

export function StatisticsReports() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyPurchaseItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryPurchaseItem[]>([]);
  const [supplierData, setSupplierData] = useState<SupplierPurchaseItem[]>([]);
  const [turnoverData, setTurnoverData] = useState<TurnoverItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const period = selectedPeriod === 'month' ? 'month' : selectedPeriod === 'quarter' ? 'quarter' : 'year';
      
      const [overviewRes, monthlyRes, categoryRes, supplierRes, turnoverRes, categoriesRes] = await Promise.all([
        statisticsApi.getOverview(period),
        statisticsApi.getMonthlyPurchase(),
        statisticsApi.getPurchaseByCategory(period),
        statisticsApi.getPurchaseBySupplier({ period, limit: 20 }),
        statisticsApi.getInventoryTurnover({ limit: 15 }),
        statisticsApi.getCategories(),
      ]);

      setOverview(overviewRes.data);
      setMonthlyData(monthlyRes.data || []);
      setCategoryData(categoryRes.data || []);
      setSupplierData(supplierRes.data || []);
      setTurnoverData(turnoverRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPurchaseAmount = overview?.totalPurchaseAmount || 0;
  const avgTurnoverDays = overview?.avgTurnoverDays || 0;

  const expiryLossRate: ExpiryData = useMemo(() => ({
    expiringRate: (overview?.expiringRate || 0).toFixed(2),
    warningRate: (overview?.warningRate || 0).toFixed(2),
    totalValue: overview?.totalInventoryValue || 0,
    expiringValue: overview?.expiringValue || 0,
    warningValue: overview?.warningValue || 0,
  }), [overview]);

  const filteredTurnoverData = useMemo(() => {
    if (selectedCategory === 'all') return turnoverData;
    return turnoverData.filter((item) => item.category === selectedCategory);
  }, [turnoverData, selectedCategory]);

  const monthlyPurchaseOption = useMemo(() => {
    const months = monthlyData.map((d) => d.month);
    const purchaseAmounts = monthlyData.map((d) => Math.round(d.purchaseAmount / 10000));
    const prescriptionCounts = monthlyData.map((d) => d.prescriptionCount);

    return {
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
        data: months,
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
          data: purchaseAmounts,
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
          data: prescriptionCounts,
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
    };
  }, [monthlyData]);

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
        data: categoryData,
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
  }), [categoryData]);

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
      data: filteredTurnoverData.map((m) => m.name),
      axisLabel: {
        fontSize: 11,
        interval: 0,
      },
    },
    series: [
      {
        type: 'bar',
        data: filteredTurnoverData.map((m) => ({
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
  }), [filteredTurnoverData]);

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

  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      const period = selectedPeriod === 'month' ? '月度' : selectedPeriod === 'quarter' ? '季度' : '年度';
      
      const [purchaseRes, supplierRes, categoryRes, turnoverRes, expiryRes] = await Promise.all([
        statisticsApi.getExportPurchase(selectedPeriod),
        statisticsApi.getExportSuppliers(selectedPeriod),
        statisticsApi.getPurchaseByCategory(selectedPeriod),
        statisticsApi.getInventoryTurnover({ limit: 15 }),
        statisticsApi.getInventoryExpiry(),
      ]);

      const purchaseSummaryData = [
        [`${period}采购订单汇总`],
        ['订单号', '供应商', '状态', '总金额', '创建日期', '采购项数'],
        ...(purchaseRes.data || []).map((order: any) => [
          order.orderNo,
          order.supplierName,
          getStatusText(order.status),
          order.totalAmount,
          order.createdAt,
          order.itemCount,
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
        ...(supplierRes.data || []).slice(0, 20).map((s: any, i: number) => [
          i + 1, s.name, s.count, s.amount,
        ]),
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(supplierData);
      ws2['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws2, '供应商统计');

      const categoryTotal = (categoryRes.data || []).reduce((sum: number, c: any) => sum + c.value, 0);
      const categoryData = [
        ['药品分类采购统计'],
        ['分类', '采购金额(元)', '占比'],
        ...(categoryRes.data || []).map((c: any) => [
          c.name, c.value, categoryTotal > 0 ? `${((c.value / categoryTotal) * 100).toFixed(1)}%` : '0%',
        ]),
      ];
      const ws3 = XLSX.utils.aoa_to_sheet(categoryData);
      ws3['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws3, '分类统计');

      const turnoverList = turnoverRes.data || [];
      const turnoverData = [
        ['库存周转分析(TOP15)'],
        ['排名', '药品名称', '分类', '当前库存', '月均用量', '周转天数', '状态'],
        ...turnoverList.map((m: any, i: number) => [
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

      const expiryDataList = expiryRes.data || { expiringRate: 0, warningRate: 0, totalValue: 0, expiringValue: 0, warningValue: 0 };
      const expiryData = [
        ['效期预警分析'],
        ['状态', '金额(元)', '占比', '说明'],
        ['30天内到期', expiryDataList.expiringValue || 0, `${(expiryDataList.expiringRate || 0).toFixed(2)}%`, '需紧急处理'],
        ['30-90天到期', expiryDataList.warningValue || 0, `${(expiryDataList.warningRate || 0).toFixed(2)}%`, '需关注'],
        ['库存总价值', expiryDataList.totalValue || 0, '100%', ''],
      ];
      const ws5 = XLSX.utils.aoa_to_sheet(expiryData);
      ws5['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws5, '效期分析');

      const now = new Date();
      const fileName = `药房运营分析报告_${period}_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.xlsx`;

      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('导出Excel失败:', error);
      alert('导出Excel失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

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
              <p className="text-2xl font-bold text-gray-900 mt-1">{overview?.prescriptionCount || 0}</p>
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
                {supplierData.slice(0, 10).map((supplier, index) => (
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
                  <span className="font-medium text-gray-900">{overview?.supplierCount || 0} 家</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>药品品规数</span>
                  <span className="font-medium text-gray-900">{overview?.medicineCount || 0} 种</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span>库存批次</span>
                  <span className="font-medium text-gray-900">{overview?.batchCount || 0} 批</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
