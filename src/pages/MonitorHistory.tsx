import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  History,
  Search,
  Download,
  Calendar as CalendarIcon,
  Filter,
  Thermometer,
  Droplets,
  AlertTriangle,
} from 'lucide-react';
import { monitorApi } from '@/services/api';
import ReactECharts from 'echarts-for-react';

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
}

export function MonitorHistory() {
  const [zones, setZones] = useState<WarehouseZone[]>([]);
  const [records, setRecords] = useState<MonitorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = useCallback(async () => {
    try {
      const [zonesRes, recordsRes] = await Promise.all([
        monitorApi.getZones(),
        monitorApi.getRecords({ limit: 200 }),
      ]);
      setZones(zonesRes.data || []);
      setRecords(recordsRes.data || []);
    } catch (error) {
      console.error('加载历史数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const recordDate = new Date(record.recordedAt).toISOString().split('T')[0];
      const matchZone = selectedZone === 'all' || record.zoneId === selectedZone;
      const matchDate = recordDate >= startDate && recordDate <= endDate;
      return matchZone && matchDate;
    });
  }, [records, selectedZone, startDate, endDate]);

  const chartData = useMemo(() => {
    const zoneRecords = new Map<string, { time: string; temp: number; humidity: number }[]>();

    filteredRecords.forEach((record) => {
      if (!zoneRecords.has(record.zoneId)) {
        zoneRecords.set(record.zoneId, []);
      }
      zoneRecords.get(record.zoneId)!.push({
        time: new Date(record.recordedAt).toLocaleTimeString(),
        temp: record.temperature,
        humidity: record.humidity,
      });
    });

    return zoneRecords;
  }, [filteredRecords]);

  const alertCount = filteredRecords.filter((r) => r.isAlert).length;

  const getZoneOption = (zoneId: string) => {
    const zone = zones.find((z) => z.id === zoneId);
    const data = chartData.get(zoneId) || [];

    return {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['温度', '湿度'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: data.slice(0, 50).map((d) => d.time),
      },
      yAxis: [
        {
          type: 'value',
          name: '温度(°C)',
          position: 'left',
        },
        {
          type: 'value',
          name: '湿度(%)',
          position: 'right',
        },
      ],
      series: [
        {
          name: '温度',
          type: 'line',
          smooth: true,
          data: data.slice(0, 50).map((d) => d.temp),
          itemStyle: { color: '#ef4444' },
          yAxisIndex: 0,
        },
        {
          name: '湿度',
          type: 'line',
          smooth: true,
          data: data.slice(0, 50).map((d) => d.humidity),
          itemStyle: { color: '#3b82f6' },
          yAxisIndex: 1,
        },
      ],
    };
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">历史数据</h1>
        <p className="text-gray-500 mt-1">温湿度历史数据查询与趋势分析</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">记录总数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredRecords.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">报警次数</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{alertCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均温度</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {filteredRecords.length > 0
                  ? (
                      filteredRecords.reduce((sum, r) => sum + r.temperature, 0) /
                      filteredRecords.length
                    ).toFixed(1)
                  : 0}
                °C
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Thermometer className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均湿度</p>
              <p className="text-2xl font-bold text-cyan-600 mt-1">
                {filteredRecords.length > 0
                  ? (
                      filteredRecords.reduce((sum, r) => sum + r.humidity, 0) /
                      filteredRecords.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Droplets className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部库区</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {(selectedZone === 'all' ? zones : zones.filter((z) => z.id === selectedZone)).map(
          (zone) => (
            <div key={zone.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-4">{zone.name}</h3>
              <ReactECharts
                option={getZoneOption(zone.id)}
                style={{ height: '300px' }}
                opts={{ renderer: 'canvas' }}
              />
            </div>
          )
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">数据明细</h3>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">库区</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">温度</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">湿度</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.slice(0, 100).map((record) => (
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
                        报警
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">
                        正常
                      </span>
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
