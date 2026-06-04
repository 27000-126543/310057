import { Router, type Request, type Response } from 'express';
import { db, generateId } from '../db/index.js';

const router = Router();

function checkTemperatureStatus(temp: number, minTemp: number, maxTemp: number) {
  if (temp < minTemp) {
    return { status: 'danger', message: `温度过低: ${temp}°C，下限为${minTemp}°C` };
  }
  if (temp > maxTemp) {
    return { status: 'danger', message: `温度过高: ${temp}°C，上限为${maxTemp}°C` };
  }
  if (temp < minTemp + 2 || temp > maxTemp - 2) {
    return { status: 'warning', message: `温度接近阈值: ${temp}°C` };
  }
  return { status: 'normal', message: '温度正常' };
}

function checkHumidityStatus(humidity: number, minHumidity: number, maxHumidity: number) {
  if (humidity < minHumidity) {
    return { status: 'danger', message: `湿度过低: ${humidity}%，下限为${minHumidity}%` };
  }
  if (humidity > maxHumidity) {
    return { status: 'danger', message: `湿度过高: ${humidity}%，上限为${maxHumidity}%` };
  }
  if (humidity < minHumidity + 5 || humidity > maxHumidity - 5) {
    return { status: 'warning', message: `湿度接近阈值: ${humidity}%` };
  }
  return { status: 'normal', message: '湿度正常' };
}

router.get('/zones', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  res.json({
    success: true,
    data: db.data.warehouseZones,
  });
});

router.put('/zones/:id/data', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { id } = req.params;
  const { temperature, humidity } = req.body;
  
  const zoneIndex = db.data.warehouseZones.findIndex((z) => z.id === id);
  if (zoneIndex === -1) {
    res.status(404).json({ success: false, error: '库区不存在' });
    return;
  }
  
  const zone = db.data.warehouseZones[zoneIndex];
  zone.currentTemp = temperature;
  zone.currentHumidity = humidity;
  
  const tempStatus = checkTemperatureStatus(temperature, zone.minTemp, zone.maxTemp);
  const humidityStatus = checkHumidityStatus(humidity, zone.minHumidity, zone.maxHumidity);
  
  const isAlert = tempStatus.status === 'danger' || humidityStatus.status === 'danger';
  let alertType: string | null = null;
  let alertMessage = '';
  
  if (tempStatus.status === 'danger' && humidityStatus.status === 'danger') {
    alertType = 'both';
    alertMessage = `${tempStatus.message}，${humidityStatus.message}`;
  } else if (tempStatus.status === 'danger') {
    alertType = 'temp';
    alertMessage = tempStatus.message;
  } else if (humidityStatus.status === 'danger') {
    alertType = 'humidity';
    alertMessage = humidityStatus.message;
  }
  
  const monitorRecord = {
    id: generateId('MON', 6),
    zoneId: zone.id,
    zoneName: zone.name,
    temperature,
    humidity,
    isAlert,
    alertType,
    alertMessage,
    recordedAt: new Date().toISOString(),
    handled: false,
  };
  
  db.data.monitorRecords.push(monitorRecord);
  await db.write();
  
  res.json({
    success: true,
    data: {
      zone,
      tempStatus,
      humidityStatus,
      isAlert,
      alertType,
      alertMessage,
    },
  });
});

router.get('/records', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { zoneId, limit = 100, isAlert } = req.query;
  
  let records = db.data.monitorRecords;
  if (zoneId) {
    records = records.filter((r) => r.zoneId === zoneId);
  }
  if (isAlert !== undefined) {
    records = records.filter((r) => r.isAlert === (isAlert === 'true'));
  }
  
  records = records.slice(-Number(limit));
  records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  
  res.json({
    success: true,
    data: records,
  });
});

router.get('/alerts', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { handled, limit = 50 } = req.query;
  
  let alerts = db.data.alertLogs;
  if (handled !== undefined) {
    alerts = alerts.filter((a) => a.handled === (handled === 'true'));
  }
  
  alerts = alerts.slice(-Number(limit));
  alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  res.json({
    success: true,
    data: alerts,
  });
});

router.post('/alerts', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { zoneId, zoneName, alertType, message } = req.body;
  
  const alertLog = {
    id: generateId('ALT', 6),
    zoneId,
    zoneName,
    alertType,
    message,
    handled: false,
    handledBy: null,
    handledAt: null,
    timestamp: new Date().toISOString(),
  };
  
  db.data.alertLogs.push(alertLog);
  await db.write();
  
  res.json({
    success: true,
    data: alertLog,
  });
});

router.post('/alerts/:id/handle', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { id } = req.params;
  const { handledBy } = req.body;
  
  const alertIndex = db.data.alertLogs.findIndex((a) => a.id === id);
  if (alertIndex === -1) {
    res.status(404).json({ success: false, error: '报警日志不存在' });
    return;
  }
  
  const alert = db.data.alertLogs[alertIndex];
  alert.handled = true;
  alert.handledBy = handledBy;
  alert.handledAt = new Date().toISOString();
  
  const recordIndex = db.data.monitorRecords.findIndex(
    (r) => r.zoneId === alert.zoneId && !r.handled && r.isAlert
  );
  if (recordIndex !== -1) {
    db.data.monitorRecords[recordIndex].handled = true;
  }
  
  await db.write();
  
  res.json({
    success: true,
    data: alert,
  });
});

router.post('/records/:id/handle', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { id } = req.params;
  const { handledBy } = req.body;
  
  const recordIndex = db.data.monitorRecords.findIndex((r) => r.id === id);
  if (recordIndex === -1) {
    res.status(404).json({ success: false, error: '监测记录不存在' });
    return;
  }
  
  const record = db.data.monitorRecords[recordIndex];
  record.handled = true;
  
  const alertIndex = db.data.alertLogs.findIndex(
    (a) => a.zoneId === record.zoneId && !a.handled
  );
  if (alertIndex !== -1) {
    db.data.alertLogs[alertIndex].handled = true;
    db.data.alertLogs[alertIndex].handledBy = handledBy;
    db.data.alertLogs[alertIndex].handledAt = new Date().toISOString();
  }
  
  await db.write();
  
  res.json({
    success: true,
    data: record,
  });
});

export default router;
