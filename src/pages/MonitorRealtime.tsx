import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  Droplets,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { checkTemperatureStatus, checkHumidityStatus } from '@/utils/validation';

export function MonitorRealtime() {
  const { warehouseZones, monitorRecords, user, updateMonitorData, addMonitorRecord, handleAlert } =
    useAppStore();

  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      warehouseZones.forEach((zone) => {
        const tempVariation = (Math.random() - 0.5) * 2;
        const humidityVariation = (Math.random() - 0.5) * 5;
        const newTemp = Math.round((zone.currentTemp + tempVariation) * 10) / 10;
        const newHumidity = Math.round((zone.currentHumidity + humidityVariation) * 10) / 10;

        updateMonitorData(zone.id, newTemp, newHumidity);

        const tempStatus = checkTemperatureStatus(newTemp, zone.minTemp, zone.maxTemp);
        const humidityStatus = checkHumidityStatus(newHumidity, zone.minHumidity, zone.maxHumidity);

        if (tempStatus.status === 'danger' || humidityStatus.status === 'danger') {
          addMonitorRecord({
            zoneId: zone.id,
            zoneName: zone.name,
            temperature: newTemp,
            humidity: newHumidity,
            isAlert: true,
            alertType:
              tempStatus.status === 'danger' && humidityStatus.status === 'danger'
                ? 'both'
                : tempStatus.status === 'danger'
                ? 'temp'
                : 'humidity',
            recordedAt: new Date().toISOString(),
            handled: false,
          });
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [warehouseZones, updateMonitorData, addMonitorRecord]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleResolveAlert = (recordId: string) => {
    handleAlert(recordId, user?.name || '系统');
  };

  const unhandledAlerts = monitorRecords.filter((r) => r.isAlert && !r.handled);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'danger':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'danger':
        return '超标';
      case 'warning':
        return '预警';
      default:
        return '正常';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">实时监控</h1>
          <p className="text-gray-500 mt-1">库区温湿度实时监控、超限报警</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">监控库区</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{warehouseZones.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">正常运行</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {
                  warehouseZones.filter((zone) => {
                    const tempStatus = checkTemperatureStatus(
                      zone.currentTemp,
                      zone.minTemp,
                      zone.maxTemp
                    );
                    const humidityStatus = checkHumidityStatus(
                      zone.currentHumidity,
                      zone.minHumidity,
                      zone.maxHumidity
                    );
                    return tempStatus.status === 'normal' && humidityStatus.status === 'normal';
                  }).length
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
              <p className="text-sm text-gray-500">待处理报警</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{unhandledAlerts.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">最后更新</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {warehouseZones.map((zone) => {
          const tempStatus = checkTemperatureStatus(
            zone.currentTemp,
            zone.minTemp,
            zone.maxTemp
          );
          const humidityStatus = checkHumidityStatus(
            zone.currentHumidity,
            zone.minHumidity,
            zone.maxHumidity
          );
          const isAlert = tempStatus.status === 'danger' || humidityStatus.status === 'danger';

          return (
            <div
              key={zone.id}
              className={`bg-white rounded-xl shadow-sm border-2 p-5 transition-all cursor-pointer ${
                isAlert
                  ? 'border-red-300 animate-pulse'
                  : selectedZone === zone.id
                  ? 'border-blue-400'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
              onClick={() => setSelectedZone(zone.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{zone.name}</h3>
                  <p className="text-sm text-gray-500">
                    温度: {zone.minTemp}-{zone.maxTemp}°C | 湿度: {zone.minHumidity}-
                    {zone.maxHumidity}%
                  </p>
                </div>
                {isAlert && (
                  <span className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg border bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">温度</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-2xl font-bold ${
                        tempStatus.status === 'danger'
                          ? 'text-red-600'
                          : tempStatus.status === 'warning'
                          ? 'text-yellow-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {zone.currentTemp}
                    </span>
                    <span className="text-sm text-gray-500">°C</span>
                  </div>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                      tempStatus.status
                    )}`}
                  >
                    {getStatusText(tempStatus.status)}
                  </span>
                </div>

                <div className="p-3 rounded-lg border bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">湿度</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-2xl font-bold ${
                        humidityStatus.status === 'danger'
                          ? 'text-red-600'
                          : humidityStatus.status === 'warning'
                          ? 'text-yellow-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {zone.currentHumidity}
                    </span>
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <span
                    className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(
                      humidityStatus.status
                    )}`}
                  >
                    {getStatusText(humidityStatus.status)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">存储容量</span>
                  <span className="font-medium text-gray-900">
                    {zone.used}/{zone.capacity} ({Math.round((zone.used / zone.capacity) * 100)}%)
                  </span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(zone.used / zone.capacity) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">报警记录</h3>
          <span className="text-sm text-gray-500">最近 {monitorRecords.slice(0, 20).length} 条</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">库区</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">温度</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">湿度</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">报警类型</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">状态</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monitorRecords.slice(0, 20).map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(record.recordedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{record.zoneName}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={record.alertType === 'temp' || record.alertType === 'both' ? 'text-red-600 font-medium' : 'text-gray-600'}
                    >
                      {record.temperature}°C
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={record.alertType === 'humidity' || record.alertType === 'both' ? 'text-red-600 font-medium' : 'text-gray-600'}
                    >
                      {record.humidity}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {record.isAlert ? (
                      <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                        {record.alertType === 'temp'
                          ? '温度超标'
                          : record.alertType === 'humidity'
                          ? '湿度超标'
                          : '温湿度超标'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                        正常
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {record.handled ? (
                      <span className="text-green-600 text-sm">已处理</span>
                    ) : (
                      <span className="text-red-600 text-sm font-medium">待处理</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!record.handled && record.isAlert && (
                      <button
                        onClick={() => handleResolveAlert(record.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        处理
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}