import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Thermometer,
  Droplets,
  Package,
  DollarSign,
  User,
  Pill,
  TrendingUp,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import ReactECharts from 'echarts-for-react';

export function StatisticsVisual() {
  const {
    medicines,
    suppliers,
    purchaseOrders,
    inventoryBatches,
    prescriptions,
    warehouseZones,
    monitorRecords,
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const totalInventoryValue = inventoryBatches.reduce((sum, batch) => {
    const medicine = medicines.find((m) => m.id === batch.medicineId);
    return sum + (medicine?.price || 0) * batch.quantity;
  }, 0);

  const completedOrders = purchaseOrders.filter((o) => o.status === 'completed');
  const totalPurchaseAmount = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const todayPrescriptions = prescriptions.filter(
    (p) => new Date(p.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const expiringBatches = inventoryBatches.filter((batch) => {
    const expiry = new Date(batch.expiryDate);
    const daysToExpiry = Math.ceil(
      (expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysToExpiry <= 90;
  }).length;

  const lowStockMedicines = medicines.filter((medicine) => {
    const totalStock = inventoryBatches
      .filter((b) => b.medicineId === medicine.id)
      .reduce((sum, b) => sum + b.quantity, 0);
    return totalStock < medicine.minStock;
  }).length;

  const inventoryTrendOption = {
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    },
    yAxis: {
      type: 'value',
      name: '库存变动',
    },
    series: [
      {
        name: '入库',
        type: 'bar',
        stack: 'total',
        data: [120, 132, 101, 134, 90, 230, 210],
        itemStyle: { color: '#10b981' },
      },
      {
        name: '出库',
        type: 'bar',
        stack: 'total',
        data: [-80, -92, -71, -84, -60, -130, -110],
        itemStyle: { color: '#f59e0b' },
      },
    ],
  };

  const getZoneColor = (usage: number) => {
    if (usage >= 80) return '#ef4444';
    if (usage >= 60) return '#f59e0b';
    if (usage >= 40) return '#3b82f6';
    return '#10b981';
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Monitor className="w-8 h-8 text-cyan-400" />
            智慧药房可视化大屏
          </h1>
          <p className="text-gray-400 mt-1">实时监控药房运营状态</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono text-cyan-400">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-gray-400">{currentTime.toLocaleDateString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">药品品种</p>
              <p className="text-3xl font-bold text-white mt-1">{medicines.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Pill className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">库存金额</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                ¥{(totalInventoryValue / 10000).toFixed(1)}万
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">供应商</p>
              <p className="text-3xl font-bold text-white mt-1">{suppliers.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">采购金额</p>
              <p className="text-3xl font-bold text-cyan-400 mt-1">
                ¥{(totalPurchaseAmount / 10000).toFixed(1)}万
              </p>
            </div>
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">今日处方</p>
              <p className="text-3xl font-bold text-orange-400 mt-1">{todayPrescriptions}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">预警数量</p>
              <p className="text-3xl font-bold text-red-400 mt-1">
                {expiringBatches + lowStockMedicines}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 h-full">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              库区温湿度监控
            </h3>
            <div className="space-y-4">
              {warehouseZones.map((zone) => {
                const usagePercent = (zone.used / zone.capacity) * 100;
                return (
                  <div key={zone.id} className="bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">{zone.name}</span>
                      <span className="text-xs text-gray-400">
                        {Math.round(usagePercent)}% 已使用
                      </span>
                    </div>
                    <div className="h-2 bg-gray-600 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${usagePercent}%`,
                          backgroundColor: getZoneColor(usagePercent),
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-gray-300">
                          <span className="text-white font-medium">{zone.currentTemp}</span>°C
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-300">
                          <span className="text-white font-medium">{zone.currentHumidity}</span>%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-5">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 h-full">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-green-400" />
              药房平面图
            </h3>
            <div className="relative bg-gray-700/50 rounded-lg p-6" style={{ height: '380px' }}>
              <div className="absolute top-4 left-4 right-4 h-24 grid grid-cols-4 gap-3">
                <div className="bg-cyan-500/30 border border-cyan-500 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-cyan-300 text-sm font-medium">冷藏库</span>
                  <span className="text-cyan-400 text-xs mt-1">2-8°C</span>
                  <span className="text-white font-bold">75%</span>
                </div>
                <div className="bg-blue-500/30 border border-blue-500 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-blue-300 text-sm font-medium">阴凉库</span>
                  <span className="text-blue-400 text-xs mt-1">≤20°C</span>
                  <span className="text-white font-bold">62%</span>
                </div>
                <div className="bg-green-500/30 border border-green-500 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-green-300 text-sm font-medium">常温库</span>
                  <span className="text-green-400 text-xs mt-1">10-30°C</span>
                  <span className="text-white font-bold">45%</span>
                </div>
                <div className="bg-red-500/30 border border-red-500 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-red-300 text-sm font-medium">高警示药</span>
                  <span className="text-red-400 text-xs mt-1">双人复核</span>
                  <span className="text-white font-bold">30%</span>
                </div>
              </div>

              <div className="absolute top-36 left-4 right-4 bottom-4 grid grid-cols-5 gap-2">
                {Array.from({ length: 25 }).map((_, i) => {
                  const heat = Math.random();
                  let bgColor = 'bg-green-500/20';
                  if (heat > 0.8) bgColor = 'bg-red-500/40';
                  else if (heat > 0.6) bgColor = 'bg-orange-500/30';
                  else if (heat > 0.4) bgColor = 'bg-yellow-500/20';

                  return (
                    <div
                      key={i}
                      className={`${bgColor} rounded border border-gray-600/50 flex items-center justify-center transition-all hover:scale-105`}
                    >
                      <span className="text-gray-400 text-xs">
                        {Math.floor(Math.random() * 100)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="absolute bottom-2 left-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500/40 rounded" />
                  <span className="text-gray-400">正常</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500/40 rounded" />
                  <span className="text-gray-400">偏低</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-orange-500/40 rounded" />
                  <span className="text-gray-400">偏高</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500/40 rounded" />
                  <span className="text-gray-400">紧张</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-6">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              今日出入库趋势
            </h3>
            <ReactECharts
              option={inventoryTrendOption}
              style={{ height: '180px' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              实时告警
            </h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {monitorRecords
                .filter((r) => r.isAlert && !r.handled)
                .slice(0, 5)
                .map((record) => (
                  <div
                    key={record.id}
                    className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{record.zoneName}</div>
                      <div className="text-xs text-gray-400">
                        {record.alertType === 'temp'
                          ? `温度异常: ${record.temperature}°C`
                          : record.alertType === 'humidity'
                          ? `湿度异常: ${record.humidity}%`
                          : `温湿度异常: ${record.temperature}°C / ${record.humidity}%`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(record.recordedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              {monitorRecords.filter((r) => r.isAlert && !r.handled).length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  暂无告警
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}