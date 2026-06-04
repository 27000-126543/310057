import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Pill,
  ShoppingCart,
  Package,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Activity,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { statusLabels, statusColors } from '../config/navConfig';

const StatCard = ({
  icon: Icon,
  title,
  value,
  unit,
  trend,
  trendUp,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  unit?: string;
  trend?: string;
  trendUp?: boolean;
  color: string;
}) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <div className="flex items-baseline mt-2">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
        </div>
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 mr-1 ${!trendUp && 'rotate-180'}`} />
            {trend}
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export const Dashboard = () => {
  const {
    medicines,
    purchaseOrders,
    inventoryBatches,
    prescriptions,
    warehouseZones,
    monitorRecords,
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalInventoryValue = inventoryBatches.reduce((sum, batch) => {
    const medicine = medicines.find(m => m.id === batch.medicineId);
    return sum + (medicine?.price || 0) * batch.quantity;
  }, 0);

  const pendingApprovals = purchaseOrders.filter(
    o => o.status === 'pending_dept' || o.status === 'pending_hospital'
  );

  const lowStockMedicines = medicines.filter(m => {
    const total = inventoryBatches
      .filter(b => b.medicineId === m.id)
      .reduce((s, b) => s + b.quantity, 0);
    return total < m.minStock;
  });

  const recentPrescriptions = prescriptions.slice(0, 5);

  const recentAlerts = monitorRecords.filter(r => r.isAlert && !r.handled).slice(0, 5);

  const inventoryChartOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['入库量', '出库量'],
      top: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '入库量',
        type: 'line',
        smooth: true,
        data: [120, 132, 101, 134, 90, 230, 210],
        lineStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
      },
      {
        name: '出库量',
        type: 'line',
        smooth: true,
        data: [220, 182, 191, 234, 290, 330, 310],
        lineStyle: { color: '#10b981' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  const categoryChartOption = {
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: 1048, name: '抗生素', itemStyle: { color: '#3b82f6' } },
          { value: 735, name: '心血管', itemStyle: { color: '#10b981' } },
          { value: 580, name: '消化系统', itemStyle: { color: '#f59e0b' } },
          { value: 484, name: '解热镇痛', itemStyle: { color: '#8b5cf6' } },
          { value: 300, name: '其他', itemStyle: { color: '#6b7280' } },
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
          <p className="text-gray-500 mt-1">欢迎回来，这是药房今日运营概览</p>
        </div>
        <div className="flex items-center text-gray-500">
          <Clock className="w-4 h-4 mr-2" />
          <span>{currentTime.toLocaleString('zh-CN')}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <StatCard
          icon={Pill}
          title="药品品种"
          value={medicines.length}
          unit="种"
          trend="+2 本周新增"
          trendUp
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          icon={ShoppingCart}
          title="待审批采购"
          value={pendingApprovals.length}
          unit="单"
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
        <StatCard
          icon={Package}
          title="库存总金额"
          value={totalInventoryValue.toFixed(0)}
          unit="元"
          trend="+5.2% 较上月"
          trendUp
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <StatCard
          icon={ClipboardList}
          title="今日处方"
          value={prescriptions.filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString()).length || 12}
          unit="张"
          trend="+12.5% 较昨日"
          trendUp
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      {lowStockMedicines.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
            <span className="text-amber-700 font-medium">库存预警：</span>
            <span className="text-amber-600 ml-2">
              有 {lowStockMedicines.length} 种药品库存低于安全线
            </span>
            <button className="ml-auto text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center">
              查看详情 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">库存出入趋势</h3>
          <ReactECharts option={inventoryChartOption} style={{ height: '300px' }} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">药品分类占比</h3>
          <ReactECharts option={categoryChartOption} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">库区温湿度</h3>
          <div className="space-y-4">
            {warehouseZones.map(zone => (
              <div key={zone.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{zone.name}</span>
                  <Activity className="w-4 h-4 text-green-500" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">温度</span>
                    <p className="font-semibold text-gray-900">{zone.currentTemp}°C</p>
                  </div>
                  <div>
                    <span className="text-gray-500">湿度</span>
                    <p className="font-semibold text-gray-900">{zone.currentHumidity}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">最近处方</h3>
            <button className="text-blue-600 text-sm hover:text-blue-700">查看全部</button>
          </div>
          <div className="space-y-3">
            {recentPrescriptions.map(prescription => (
              <div key={prescription.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div>
                  <p className="font-medium text-gray-900">{prescription.patientName}</p>
                  <p className="text-sm text-gray-500">{prescription.prescriptionNo}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[prescription.status]}`}>
                  {statusLabels[prescription.status]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">报警记录</h3>
            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
              {recentAlerts.length} 条未处理
            </span>
          </div>
          <div className="space-y-3">
            {recentAlerts.length > 0 ? recentAlerts.map(alert => (
              <div key={alert.id} className="flex items-start p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-red-700">{alert.zoneName}</p>
                  <p className="text-sm text-red-600">
                    {alert.alertType === 'temp' && `温度异常: ${alert.temperature}°C`}
                    {alert.alertType === 'humidity' && `湿度异常: ${alert.humidity}%`}
                    {alert.alertType === 'both' && `温湿度异常`}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-400">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无报警记录</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
