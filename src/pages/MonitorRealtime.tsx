import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Thermometer,
  Droplets,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  MapPin,
  RefreshCw,
  Volume2,
  X,
} from 'lucide-react';
import { monitorApi } from '@/services/api';
import { checkTemperatureStatus, checkHumidityStatus } from '@/utils/validation';

interface WarehouseZone {
  id: string;
  name: string;
  minTemp: number;
  maxTemp: number;
  minHumidity: number;
  maxHumidity: number;
  currentTemp: number;
  currentHumidity: number;
  capacity: number;
  used: number;
}

interface MonitorRecord {
  id: string;
  zoneId: string;
  zoneName: string;
  temperature: number;
  humidity: number;
  isAlert: boolean;
  alertType?: string;
  recordedAt: string;
  handled: boolean;
  handledBy?: string;
  handledAt?: string;
}

interface AlertLog {
  id: string;
  zoneId: string;
  zoneName: string;
  alertType: string;
  message: string;
  timestamp: string;
  handled: boolean;
  handledBy?: string;
  handledAt?: string;
}

export function MonitorRealtime() {
  const [zones, setZones] = useState<WarehouseZone[]>([]);
  const [records, setRecords] = useState<MonitorRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    zoneId: string;
    zoneName: string;
    alertType: string;
    message: string;
    temperature: number;
    humidity: number;
  } | null>(null);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const audioContextRef = useRef<AudioContext | null>(null);
  const alertedZonesRef = useRef<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const [zonesRes, recordsRes, alertsRes] = await Promise.all([
        monitorApi.getZones(),
        monitorApi.getRecords({ limit: 50 }),
        monitorApi.getAlerts({ limit: 50 }),
      ]);
      setZones(zonesRes.data || []);
      setRecords(recordsRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (error) {
      console.error('加载监控数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const playAlarmSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
    
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime);
      osc2.stop(ctx.currentTime + 0.5);
    }, 600);
  }, []);

  const showBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ef4444"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    }
  }, []);

  const triggerAlarm = useCallback(
    (
      zoneId: string,
      zoneName: string,
      alertType: string,
      message: string,
      temperature: number,
      humidity: number
    ) => {
      if (alertedZonesRef.current.has(zoneId)) return;
      alertedZonesRef.current.add(zoneId);

      setAlertModal({
        show: true,
        zoneId,
        zoneName,
        alertType,
        message,
        temperature,
        humidity,
      });

      setIsAlarmPlaying(true);
      playAlarmSound();

      const alertTypeText =
        alertType === 'temp' ? '温度超标' : alertType === 'humidity' ? '湿度超标' : '温湿度超标';
      showBrowserNotification(`【报警】${zoneName} - ${alertTypeText}`, message);

      setTimeout(() => {
        alertedZonesRef.current.delete(zoneId);
      }, 30000);
    },
    [playAlarmSound, showBrowserNotification]
  );

  useEffect(() => {
    if (zones.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const updatedZones = [...zones];
        for (let i = 0; i < updatedZones.length; i++) {
          const zone = updatedZones[i];
          let tempVariation = (Math.random() - 0.5) * 2;
          let humidityVariation = (Math.random() - 0.5) * 5;

          if (Math.random() < 0.15) {
            tempVariation = (Math.random() * 6 - 3) * 2;
          }
          if (Math.random() < 0.1) {
            humidityVariation = (Math.random() * 15 - 7.5) * 2;
          }

          const newTemp = Math.max(
            -10,
            Math.min(40, Math.round((zone.currentTemp + tempVariation) * 10) / 10)
          );
          const newHumidity = Math.max(
            10,
            Math.min(95, Math.round((zone.currentHumidity + humidityVariation) * 10) / 10)
          );

          try {
            const res = await monitorApi.updateZoneData(zone.id, newTemp, newHumidity);
            if (res.success && res.data) {
              updatedZones[i] = { ...zone, currentTemp: newTemp, currentHumidity: newHumidity };

              if (res.data.alert) {
                triggerAlarm(
                  zone.id,
                  zone.name,
                  res.data.alert.alertType,
                  res.data.alert.message,
                  newTemp,
                  newHumidity
                );
              }
            }
          } catch (err) {
            console.error('更新库区数据失败:', err);
          }
        }
        setZones(updatedZones);
        setLastUpdateTime(new Date());

        const [recordsRes, alertsRes] = await Promise.all([
          monitorApi.getRecords({ limit: 50 }),
          monitorApi.getAlerts({ limit: 50 }),
        ]);
        setRecords(recordsRes.data || []);
        setAlerts(alertsRes.data || []);
      } catch (err) {
        console.error('定时更新失败:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [zones, triggerAlarm]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isAlarmPlaying) {
      const timer = setTimeout(() => setIsAlarmPlaying(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isAlarmPlaying]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setLastUpdateTime(new Date());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleResolveAlert = async (recordId: string) => {
    try {
      await monitorApi.handleRecord(recordId, '系统');
      setRecords((prev) =>
        prev.map((r) =>
          r.id === recordId ? { ...r, handled: true, handledBy: '系统', handledAt: new Date().toISOString() } : r
        )
      );
    } catch (error) {
      console.error('处理报警失败:', error);
    }
  };

  const handleResolveAlertLog = async (alertId: string) => {
    try {
      await monitorApi.handleAlert(alertId, '系统');
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, handled: true, handledBy: '系统', handledAt: new Date().toISOString() } : a
        )
      );
    } catch (error) {
      console.error('处理报警日志失败:', error);
    }
  };

  const [activeTab, setActiveTab] = useState<'records' | 'logs'>('records');

  const unhandledAlerts = alerts.filter((a) => !a.handled);

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

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case 'temp':
        return '温度超标';
      case 'humidity':
        return '湿度超标';
      case 'both':
        return '温湿度超标';
      default:
        return '其他';
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
      {alertModal?.show && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${
              isAlarmPlaying ? 'animate-pulse' : ''
            }`}
            style={{
              boxShadow: isAlarmPlaying
                ? '0 0 40px rgba(239, 68, 68, 0.6), 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">温湿度超限报警</h3>
                    <p className="text-red-100 text-sm mt-0.5">{alertModal.zoneName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAlarmPlaying && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full">
                      <Volume2 className="w-4 h-4 text-white animate-bounce" />
                      <span className="text-white text-xs font-medium">报警中</span>
                    </div>
                  )}
                  <button
                    onClick={() => setAlertModal(null)}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{alertModal.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">当前温度</span>
                    </div>
                    <p
                      className={`text-2xl font-bold ${
                        alertModal.alertType === 'temp' || alertModal.alertType === 'both'
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {alertModal.temperature}°C
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplets className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">当前湿度</span>
                    </div>
                    <p
                      className={`text-2xl font-bold ${
                        alertModal.alertType === 'humidity' || alertModal.alertType === 'both'
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {alertModal.humidity}%
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">报警时间：</span>
                  {new Date().toLocaleString()}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setAlertModal(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  稍后处理
                </button>
                <button
                  onClick={async () => {
                    const record = records.find(
                      (r) => r.zoneId === alertModal.zoneId && !r.handled
                    );
                    if (record) {
                      await handleResolveAlert(record.id);
                    }
                    setAlertModal(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  标记已处理
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">实时监控</h1>
          <p className="text-gray-500 mt-1">库区温湿度实时监控、超限报警</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400">数据更新间隔</p>
            <p className="text-sm font-medium text-gray-600">5秒</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            手动刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">监控库区</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{zones.length}</p>
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
                  zones.filter((zone) => {
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
            <div
              className={`w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center ${
                isAlarmPlaying ? 'animate-bounce' : ''
              }`}
            >
              <Bell className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">最后更新</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {lastUpdateTime.toLocaleTimeString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {zones.map((zone) => {
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
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('records')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'records'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                监测记录
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'logs'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                报警日志
                {unhandledAlerts.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {unhandledAlerts.length}
                  </span>
                )}
              </button>
            </div>
            <span className="text-sm text-gray-500">
              {activeTab === 'records'
                ? `最近 ${records.slice(0, 20).length} 条监测记录`
                : `共 ${alerts.length} 条报警日志`}
            </span>
          </div>
        </div>

        {activeTab === 'records' ? (
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
                {records.slice(0, 20).map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(record.recordedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{record.zoneName}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={
                          record.alertType === 'temp' || record.alertType === 'both'
                            ? 'text-red-600 font-medium'
                            : 'text-gray-600'
                        }
                      >
                        {record.temperature}°C
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={
                          record.alertType === 'humidity' || record.alertType === 'both'
                            ? 'text-red-600 font-medium'
                            : 'text-gray-600'
                        }
                      >
                        {record.humidity}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {record.isAlert ? (
                        <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                          {getAlertTypeText(record.alertType || '')}
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
                      ) : record.isAlert ? (
                        <span className="text-red-600 text-sm font-medium">待处理</span>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">报警时间</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">库区</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">报警类型</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">报警信息</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">状态</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">处理人</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">处理时间</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alerts.slice(0, 50).map((alert) => (
                  <tr
                    key={alert.id}
                    className={`hover:bg-gray-50 ${!alert.handled ? 'bg-red-50/50' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{alert.zoneName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.alertType === 'temp'
                            ? 'bg-orange-100 text-orange-700'
                            : alert.alertType === 'humidity'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {getAlertTypeText(alert.alertType)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {alert.message}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {alert.handled ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          已处理
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          待处理
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {alert.handledBy || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {alert.handledAt ? new Date(alert.handledAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!alert.handled && (
                        <button
                          onClick={() => handleResolveAlertLog(alert.id)}
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
        )}
      </div>
    </div>
  );
}
