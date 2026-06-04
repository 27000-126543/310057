import { Medicine, Supplier, PurchaseOrder, InventoryBatch, Prescription, WarehouseZone, MonitorRecord, ReturnRecord, User } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 11);
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const formatDateTime = (date: Date) => date.toISOString();

const medicineNames = [
  { generic: '阿莫西林胶囊', trade: '阿莫仙', category: '抗生素' },
  { generic: '布洛芬缓释胶囊', trade: '芬必得', category: '解热镇痛' },
  { generic: '奥美拉唑肠溶胶囊', trade: '洛赛克', category: '消化系统' },
  { generic: '硝苯地平控释片', trade: '拜新同', category: '心血管' },
  { generic: '盐酸二甲双胍片', trade: '格华止', category: '糖尿病' },
  { generic: '阿托伐他汀钙片', trade: '立普妥', category: '心血管' },
  { generic: '注射用头孢曲松钠', trade: '罗氏芬', category: '抗生素' },
  { generic: '地塞米松磷酸钠注射液', trade: '', category: '激素类' },
  { generic: '盐酸氨溴索口服溶液', trade: '沐舒坦', category: '呼吸系统' },
  { generic: '氯雷他定片', trade: '开瑞坦', category: '抗过敏' },
  { generic: '胰岛素注射液', trade: '诺和灵', category: '糖尿病', highRisk: true },
  { generic: '肝素钠注射液', trade: '', category: '血液系统', highRisk: true },
  { generic: '氯化钾注射液', trade: '', category: '电解质', highRisk: true },
  { generic: '甘露醇注射液', trade: '', category: '脱水剂' },
  { generic: '维生素C注射液', trade: '', category: '维生素' },
];

const dosageForms = ['片剂', '胶囊剂', '注射剂', '口服液', '颗粒剂', '软膏剂', '吸入剂'];
const manufacturers = ['辉瑞制药', '拜耳医药', '诺华制药', '默沙东', '强生制药', '国药集团', '上药集团', '扬子江药业'];
const suppliers = [
  { name: '国药控股有限公司', rating: 5 },
  { name: '上海医药分销控股', rating: 4 },
  { name: '华润医药商业集团', rating: 5 },
  { name: '九州通医药集团', rating: 4 },
  { name: '南京医药股份', rating: 3 },
];

export function generateMedicines(): Medicine[] {
  return medicineNames.map((m, i) => ({
    id: generateId(),
    genericName: m.generic,
    tradeName: m.trade || m.generic,
    dosageForm: dosageForms[i % dosageForms.length],
    specification: `${(i + 1) * 10}mg * ${10 + i * 2}片`,
    manufacturer: manufacturers[i % manufacturers.length],
    approvalNumber: `国药准字H${(1000000 + i * 1234).toString()}`,
    storageCondition: i % 3 === 0 ? 'cold' : i % 3 === 1 ? 'cool' : 'normal',
    isHighRisk: m.highRisk || false,
    category: m.category,
    minStock: 50 + i * 10,
    maxStock: 500 + i * 50,
    unit: '盒',
    price: Math.round((10 + i * 5 + Math.random() * 50) * 100) / 100,
    createdAt: formatDate(new Date(2024, 0, 1 + i)),
  }));
}

export function generateSuppliers(): Supplier[] {
  return suppliers.map((s, i) => ({
    id: generateId(),
    name: s.name,
    businessLicense: `91310000${(1000000000 + i * 111111111).toString()}`,
    gspCertificate: `GS1000${202400 + i}`,
    supplyScope: ['西药', '中成药', '生物制品'].slice(0, 2 + (i % 2)),
    rating: s.rating,
    gspExpiryDate: formatDate(new Date(2025 + i, 5 + i, 15)),
    contact: ['张经理', '李总监', '王主管', '赵经理', '陈总'][i],
    phone: `1380013800${i}`,
    address: ['北京市朝阳区', '上海市静安区', '广州市天河区', '武汉市江汉区', '南京市鼓楼区'][i] + '医药产业园',
    createdAt: formatDate(new Date(2023, i, 1)),
  }));
}

export function generatePurchaseOrders(medicines: Medicine[], suppliers: Supplier[]): PurchaseOrder[] {
  const statuses: PurchaseOrder['status'][] = ['draft', 'pending_dept', 'pending_hospital', 'approved', 'in_transit', 'completed'];
  return Array.from({ length: 12 }, (_, i) => {
    const supplier = suppliers[i % suppliers.length];
    const orderMedicines = medicines.slice(i % 5, (i % 5) + 3);
    const items = orderMedicines.map(m => ({
      id: generateId(),
      medicineId: m.id,
      medicineName: m.genericName,
      quantity: 50 + Math.floor(Math.random() * 200),
      unitPrice: m.price,
      subtotal: 0,
    })).map(item => ({ ...item, subtotal: item.quantity * item.unitPrice }));

    return {
      id: generateId(),
      orderNo: `PO${2024000 + i}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      status: statuses[i % statuses.length],
      planDate: formatDate(new Date(2024, Math.floor(i / 2), 1 + (i % 10))),
      totalAmount: items.reduce((sum, item) => sum + item.subtotal, 0),
      items,
      approvals: [],
      createdBy: ['采购专员A', '采购专员B', '采购专员C'][i % 3],
      createdAt: formatDate(new Date(2024, Math.floor(i / 2), 1 + (i % 10))),
      estimatedDelivery: formatDate(new Date(2024, Math.floor(i / 2), 8 + (i % 10))),
    };
  });
}

export function generateInventoryBatches(medicines: Medicine[], suppliers: Supplier[]): InventoryBatch[] {
  const zones = [
    { id: 'zone1', name: '冷藏库', type: 'cold' },
    { id: 'zone2', name: '阴凉库', type: 'cool' },
    { id: 'zone3', name: '常温库A区', type: 'normal' },
    { id: 'zone4', name: '常温库B区', type: 'normal' },
    { id: 'zone5', name: '高警示药品区', type: 'high_risk' },
  ];

  return medicines.flatMap((m, mi) => {
    const zone = m.isHighRisk ? zones[4] : zones[mi % 4];
    return Array.from({ length: 2 }, (_, bi) => {
      const qty = Math.floor(100 + Math.random() * 400);
      return {
        id: generateId(),
        medicineId: m.id,
        medicineName: m.genericName,
        supplierId: suppliers[mi % suppliers.length].id,
        supplierName: suppliers[mi % suppliers.length].name,
        batchNumber: `B${2024}${String(mi + 1).padStart(3, '0')}${bi + 1}`,
        productionDate: formatDate(new Date(2024, mi % 12, 1)),
        expiryDate: formatDate(new Date(2025 + Math.floor(mi / 6), mi % 12, 28)),
        quantity: qty,
        initialQuantity: qty,
        zoneId: zone.id,
        zoneName: zone.name,
        location: `${zone.name}-${String(Math.floor(mi / 4) + 1).padStart(2, '0')}-${String((mi % 10) + 1).padStart(2, '0')}`,
        receivedAt: formatDateTime(new Date(2024, mi % 6, 5 + bi * 2)),
        receivedBy: ['验收员张', '验收员李', '验收员王'][mi % 3],
      };
    });
  });
}

export function generatePrescriptions(medicines: Medicine[]): Prescription[] {
  const departments = ['内科', '外科', '儿科', '妇产科', '心内科', '呼吸科', '消化科', '骨科'];
  const doctors = ['王医生', '李医生', '张医生', '刘医生', '陈医生', '杨医生'];
  const floors = ['1楼调剂台', '2楼调剂台', '3楼调剂台', '4楼调剂台', '5楼调剂台', '6楼调剂台'];
  const patientNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二'];

  return Array.from({ length: 20 }, (_, i) => {
    const numItems = 1 + (i % 3);
    const items = medicines.slice(i % (medicines.length - numItems), (i % (medicines.length - numItems)) + numItems).map(m => ({
      id: generateId(),
      medicineId: m.id,
      medicineName: m.genericName,
      specification: m.specification,
      quantity: 1 + (i % 5),
      dosage: '1片',
      frequency: '每日3次',
      days: 3 + (i % 4),
    }));

    const hasWarnings = i % 3 === 0;
    const warnings = hasWarnings ? [
      {
        type: 'dosage' as const,
        severity: 'medium' as const,
        medicines: items.map(item => item.medicineName),
        description: '建议确认儿童用量是否适当',
      },
    ] : [];

    return {
      id: generateId(),
      prescriptionNo: `RX${20240000 + i}`,
      patientId: `P${10000 + i}`,
      patientName: patientNames[i % patientNames.length],
      patientAge: 5 + Math.floor(Math.random() * 75),
      patientGender: i % 2 === 0 ? 'male' : 'female',
      department: departments[i % departments.length],
      doctor: doctors[i % doctors.length],
      items,
      status: ['pending', 'reviewed', 'dispensing', 'completed'][i % 4] as Prescription['status'],
      warnings,
      dispatcher: i % 2 === 0 ? '调剂药师A' : undefined,
      reviewer: i > 2 ? '审核药师B' : undefined,
      floorStation: floors[i % floors.length],
      createdAt: formatDateTime(new Date(2024, 5, 1 + Math.floor(i / 4), 8 + (i % 8), (i * 15) % 60)),
      dispensedAt: i > 4 ? formatDateTime(new Date(2024, 5, 1 + Math.floor(i / 4), 9 + (i % 8), (i * 15) % 60)) : undefined,
    };
  });
}

export function generateWarehouseZones(): WarehouseZone[] {
  return [
    {
      id: 'zone1',
      name: '冷藏库',
      type: 'cold',
      minTemp: 2,
      maxTemp: 8,
      minHumidity: 45,
      maxHumidity: 75,
      currentTemp: 4.5,
      currentHumidity: 58,
      capacity: 5000,
      used: 3200,
      location: '药房负一层A区',
    },
    {
      id: 'zone2',
      name: '阴凉库',
      type: 'cool',
      minTemp: 10,
      maxTemp: 20,
      minHumidity: 45,
      maxHumidity: 75,
      currentTemp: 15.2,
      currentHumidity: 62,
      capacity: 10000,
      used: 6800,
      location: '药房一层B区',
    },
    {
      id: 'zone3',
      name: '常温库A区',
      type: 'normal',
      minTemp: 10,
      maxTemp: 30,
      minHumidity: 35,
      maxHumidity: 75,
      currentTemp: 22.8,
      currentHumidity: 55,
      capacity: 15000,
      used: 9500,
      location: '药房二层A区',
    },
    {
      id: 'zone4',
      name: '常温库B区',
      type: 'normal',
      minTemp: 10,
      maxTemp: 30,
      minHumidity: 35,
      maxHumidity: 75,
      currentTemp: 24.1,
      currentHumidity: 52,
      capacity: 15000,
      used: 8200,
      location: '药房二层B区',
    },
    {
      id: 'zone5',
      name: '高警示药品区',
      type: 'high_risk',
      minTemp: 15,
      maxTemp: 25,
      minHumidity: 40,
      maxHumidity: 70,
      currentTemp: 20.5,
      currentHumidity: 48,
      capacity: 2000,
      used: 1200,
      location: '药房一层C区（双人双锁）',
    },
  ];
}

export function generateMonitorRecords(zones: WarehouseZone[]): MonitorRecord[] {
  const records: MonitorRecord[] = [];
  const now = new Date();

  for (let i = 0; i < 168; i++) {
    zones.forEach((zone, zi) => {
      const time = new Date(now.getTime() - (168 - i) * 3600000);
      const tempVariation = Math.sin(i / 12) * 2;
      const humidityVariation = Math.cos(i / 8) * 5;
      const temp = zone.currentTemp + tempVariation + (zi === 2 && i % 20 === 0 ? 8 : 0);
      const humidity = zone.currentHumidity + humidityVariation;
      const isTempAlert = temp < zone.minTemp || temp > zone.maxTemp;
      const isHumidityAlert = humidity < zone.minHumidity || humidity > zone.maxHumidity;

      records.push({
        id: generateId(),
        zoneId: zone.id,
        zoneName: zone.name,
        temperature: Math.round(temp * 10) / 10,
        humidity: Math.round(humidity * 10) / 10,
        isAlert: isTempAlert || isHumidityAlert,
        alertType: isTempAlert && isHumidityAlert ? 'both' : isTempAlert ? 'temp' : isHumidityAlert ? 'humidity' : undefined,
        recordedAt: formatDateTime(time),
        handled: !(isTempAlert || isHumidityAlert),
      });
    });
  }

  return records.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

export function generateReturnRecords(prescriptions: Prescription[], batches: InventoryBatch[]): ReturnRecord[] {
  return prescriptions.slice(0, 5).map((p, i) => ({
    id: generateId(),
    returnNo: `RT${2024000 + i}`,
    prescriptionId: p.id,
    prescriptionNo: p.prescriptionNo,
    patientId: p.patientId,
    patientName: p.patientName,
    items: p.items.slice(0, 1).map(item => {
      const batch = batches.find(b => b.medicineId === item.medicineId);
      return {
        batchId: batch?.id || '',
        medicineName: item.medicineName,
        batchNumber: batch?.batchNumber || '',
        quantity: 1,
        packageIntact: i % 2 === 0,
      };
    }),
    reason: ['患者不良反应', '医嘱调整', '药品未使用', '包装破损', '其他'][i],
    operator: '值班药师A',
    status: ['pending', 'approved', 'completed'][i % 3] as ReturnRecord['status'],
    createdAt: formatDateTime(new Date(2024, 5, 10 + i)),
    completedAt: i > 1 ? formatDateTime(new Date(2024, 5, 11 + i)) : undefined,
  }));
}

export function getCurrentUser(): User {
  return {
    id: 'user1',
    username: 'admin',
    name: '系统管理员',
    role: 'admin',
    roleName: '系统管理员',
    department: '信息科',
  };
}

export function getDemoUsers(): User[] {
  return [
    { id: 'user1', username: 'admin', name: '系统管理员', role: 'admin', roleName: '系统管理员', department: '信息科' },
    { id: 'user2', username: 'pharmacy_admin', name: '张主任', role: 'pharmacy_admin', roleName: '药房管理员', department: '药剂科' },
    { id: 'user3', username: 'purchase', name: '李采购', role: 'purchase', roleName: '采购专员', department: '采购部' },
    { id: 'user4', username: 'dept_director', name: '王主任', role: 'dept_director', roleName: '药学部主任', department: '药学部' },
    { id: 'user5', username: 'hospital_director', name: '刘院长', role: 'hospital_director', roleName: '分管院长', department: '院部' },
    { id: 'user6', username: 'dispenser', name: '陈药师', role: 'dispenser', roleName: '调剂药师', department: '药房' },
    { id: 'user7', username: 'duty_pharmacist', name: '周药师', role: 'duty_pharmacist', roleName: '值班药师', department: '药房' },
  ];
}
