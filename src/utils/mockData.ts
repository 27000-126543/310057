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
  return medicineNames.map((m, i) => {
    const baseUsage = 80 + i * 20 + Math.floor(Math.random() * 50);
    const seasonalVariation = [
      baseUsage * (0.8 + Math.random() * 0.2),
      baseUsage * (0.9 + Math.random() * 0.2),
      baseUsage * (1.0 + Math.random() * 0.3),
      baseUsage * (1.1 + Math.random() * 0.2),
      baseUsage * (1.2 + Math.random() * 0.3),
      baseUsage * (1.3 + Math.random() * 0.2),
    ];
    const monthlyUsage = seasonalVariation.map(v => Math.round(v));
    const turnoverRate = 4 + Math.random() * 5;

    return {
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
      monthlyUsage,
      turnoverRate: Math.round(turnoverRate * 10) / 10,
      createdAt: formatDate(new Date(2024, 0, 1 + i)),
    };
  });
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
  const patientNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二', '陈小明', '刘小红', '王小宝', '李小丽'];

  const amoxicillin = medicines.find(m => m.genericName === '阿莫西林胶囊');
  const ibuprofen = medicines.find(m => m.genericName === '布洛芬缓释胶囊');
  const omeprazole = medicines.find(m => m.genericName === '奥美拉唑肠溶胶囊');
  const nifedipine = medicines.find(m => m.genericName === '硝苯地平控释片');
  const metformin = medicines.find(m => m.genericName === '盐酸二甲双胍片');
  const atorvastatin = medicines.find(m => m.genericName === '阿托伐他汀钙片');
  const ceftriaxone = medicines.find(m => m.genericName === '注射用头孢曲松钠');
  const dexamethasone = medicines.find(m => m.genericName === '地塞米松磷酸钠注射液');
  const loratadine = medicines.find(m => m.genericName === '氯雷他定片');
  const warfarin = medicines.find(m => m.genericName === '华法林') || ibuprofen;
  const aspirin = ibuprofen;
  const furosemide = medicines.find(m => m.genericName === '呋塞米') || omeprazole;
  const digoxin = medicines.find(m => m.genericName === '地高辛') || nifedipine;

  const specialPrescriptions = [
    {
      patientName: '王小宝',
      patientAge: 4,
      patientWeight: 18,
      patientGender: 'male' as const,
      department: '儿科',
      items: [
        { medicine: amoxicillin, quantity: 250, dosage: '250mg', frequency: '每日3次', days: 7 },
        { medicine: ibuprofen, quantity: 100, dosage: '100mg', frequency: '每日2次', days: 3 },
      ],
      note: '儿童患者，含阿莫西林+布洛芬正常组合'
    },
    {
      patientName: '刘小红',
      patientAge: 6,
      patientWeight: 22,
      patientGender: 'female' as const,
      department: '儿科',
      items: [
        { medicine: amoxicillin, quantity: 500, dosage: '500mg', frequency: '每日3次', days: 7 },
        { medicine: ceftriaxone, quantity: 1, dosage: '1g', frequency: '每日1次', days: 3 },
      ],
      note: '青霉素+头孢菌素，存在交叉过敏风险'
    },
    {
      patientName: '李小明',
      patientAge: 3,
      patientWeight: 14,
      patientGender: 'male' as const,
      department: '儿科',
      items: [
        { medicine: ibuprofen, quantity: 200, dosage: '200mg', frequency: '每日3次', days: 5 },
      ],
      note: '儿童布洛芬剂量过大（200mg*3=600mg/天，40mg/kg*14kg=560mg上限）'
    },
    {
      patientName: '张大爷',
      patientAge: 72,
      patientWeight: 65,
      patientGender: 'male' as const,
      department: '心内科',
      items: [
        { medicine: warfarin, quantity: 5, dosage: '5mg', frequency: '每日1次', days: 30 },
        { medicine: aspirin, quantity: 100, dosage: '100mg', frequency: '每日1次', days: 30 },
      ],
      note: '华法林+阿司匹林，出血风险'
    },
    {
      patientName: '王奶奶',
      patientAge: 68,
      patientWeight: 58,
      patientGender: 'female' as const,
      department: '心内科',
      items: [
        { medicine: digoxin, quantity: 0.25, dosage: '0.25mg', frequency: '每日1次', days: 30 },
        { medicine: furosemide, quantity: 20, dosage: '20mg', frequency: '每日1次', days: 30 },
        { medicine: nifedipine, quantity: 30, dosage: '30mg', frequency: '每日1次', days: 30 },
      ],
      note: '地高辛+呋塞米（低钾风险）+硝苯地平（升高地高辛浓度）'
    },
    {
      patientName: '刘叔',
      patientAge: 55,
      patientWeight: 75,
      patientGender: 'male' as const,
      department: '心内科',
      items: [
        { medicine: ibuprofen, quantity: 300, dosage: '300mg', frequency: '每日2次', days: 14 },
        { medicine: nifedipine, quantity: 30, dosage: '30mg', frequency: '每日1次', days: 30 },
        { medicine: atorvastatin, quantity: 20, dosage: '20mg', frequency: '每晚1次', days: 30 },
      ],
      note: '布洛芬+硝苯地平（血压过低风险）'
    },
    {
      patientName: '陈阿姨',
      patientAge: 62,
      patientWeight: 60,
      patientGender: 'female' as const,
      department: '内分泌科',
      items: [
        { medicine: metformin, quantity: 500, dosage: '500mg', frequency: '每日3次', days: 30 },
        { medicine: atorvastatin, quantity: 20, dosage: '20mg', frequency: '每晚1次', days: 30 },
      ],
      note: '糖尿病常规用药'
    },
    {
      patientName: '赵大哥',
      patientAge: 45,
      patientWeight: 80,
      patientGender: 'male' as const,
      department: '消化科',
      items: [
        { medicine: omeprazole, quantity: 20, dosage: '20mg', frequency: '每日1次', days: 14 },
        { medicine: loratadine, quantity: 10, dosage: '10mg', frequency: '每日1次', days: 7 },
      ],
      note: '奥美拉唑+氯雷他定，轻度相互作用'
    },
  ];

  const prescriptions: Prescription[] = [];

  specialPrescriptions.forEach((sp, i) => {
    const items = sp.items
      .filter(item => item.medicine)
      .map(item => ({
        id: generateId(),
        medicineId: item.medicine!.id,
        medicineName: item.medicine!.genericName,
        specification: item.medicine!.specification,
        quantity: item.quantity,
        dosage: item.dosage,
        frequency: item.frequency,
        days: item.days,
      }));

    prescriptions.push({
      id: generateId(),
      prescriptionNo: `RX${20240100 + i}`,
      patientId: `P${20000 + i}`,
      patientName: sp.patientName,
      patientAge: sp.patientAge,
      patientWeight: sp.patientWeight,
      patientGender: sp.patientGender,
      department: sp.department,
      doctor: doctors[i % doctors.length],
      items,
      status: i < 6 ? 'pending' : ['reviewed', 'dispensing', 'completed'][i % 3] as Prescription['status'],
      warnings: [],
      dispatcher: i >= 7 ? '调剂药师A' : undefined,
      reviewer: i >= 6 ? '审核药师B' : undefined,
      floorStation: floors[i % floors.length],
      createdAt: formatDateTime(new Date(2024, 5, 15 + Math.floor(i / 3), 8 + (i % 8), (i * 15) % 60)),
      dispensedAt: i >= 7 ? formatDateTime(new Date(2024, 5, 15 + Math.floor(i / 3), 9 + (i % 8), (i * 15) % 60)) : undefined,
    });
  });

  for (let i = specialPrescriptions.length; i < 25; i++) {
    const numItems = 1 + (i % 3);
    const startIdx = i % (medicines.length - numItems);
    const items = medicines.slice(startIdx, startIdx + numItems).map(m => ({
      id: generateId(),
      medicineId: m.id,
      medicineName: m.genericName,
      specification: m.specification,
      quantity: 1 + (i % 5),
      dosage: '1片',
      frequency: '每日3次',
      days: 3 + (i % 4),
    }));

    const age = i % 3 === 0 ? 5 + Math.floor(Math.random() * 10) : 18 + Math.floor(Math.random() * 70);
    const weight = age < 18 ? 15 + age * 2.5 : 50 + Math.floor(Math.random() * 40);

    prescriptions.push({
      id: generateId(),
      prescriptionNo: `RX${20240200 + i}`,
      patientId: `P${10000 + i}`,
      patientName: patientNames[i % patientNames.length],
      patientAge: age,
      patientWeight: Math.round(weight * 10) / 10,
      patientGender: i % 2 === 0 ? 'male' : 'female',
      department: departments[i % departments.length],
      doctor: doctors[i % doctors.length],
      items,
      status: ['pending', 'reviewed', 'dispensing', 'completed'][i % 4] as Prescription['status'],
      warnings: [],
      dispatcher: i % 2 === 0 ? '调剂药师A' : undefined,
      reviewer: i > 2 ? '审核药师B' : undefined,
      floorStation: floors[i % floors.length],
      createdAt: formatDateTime(new Date(2024, 5, 1 + Math.floor(i / 4), 8 + (i % 8), (i * 15) % 60)),
      dispensedAt: i > 4 ? formatDateTime(new Date(2024, 5, 1 + Math.floor(i / 4), 9 + (i % 8), (i * 15) % 60)) : undefined,
    });
  }

  return prescriptions;
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
