import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const file = path.join(dbDir, 'db.json');

export interface DatabaseSchema {
  users: any[];
  medicines: any[];
  suppliers: any[];
  inventoryBatches: any[];
  warehouseZones: any[];
  purchaseOrders: any[];
  purchaseOrderItems: any[];
  monitorRecords: any[];
  alertLogs: any[];
  prescriptions: any[];
  prescriptionItems: any[];
  prescriptionWarnings: any[];
  drugConflicts: any[];
  drugCategories: any[];
  pediatricDosages: any[];
}

const defaultData: DatabaseSchema = {
  users: [],
  medicines: [],
  suppliers: [],
  inventoryBatches: [],
  warehouseZones: [],
  purchaseOrders: [],
  purchaseOrderItems: [],
  monitorRecords: [],
  alertLogs: [],
  prescriptions: [],
  prescriptionItems: [],
  prescriptionWarnings: [],
  drugConflicts: [],
  drugCategories: [],
  pediatricDosages: [],
};

const adapter = new JSONFile<DatabaseSchema>(file);
export const db = new Low<DatabaseSchema>(adapter, defaultData);

export async function initDatabase() {
  await db.read();
  
  if (Object.keys(db.data).length === 0 || db.data.medicines.length === 0) {
    db.data = { ...defaultData };
    await initSeedData();
    await db.write();
    console.log('Database initialized with seed data');
  }
  
  console.log('Database ready');
}

async function initSeedData() {
  const medicineNames = [
    { genericName: '阿莫西林胶囊', category: '青霉素类', specification: '0.25g*24粒', price: 15.8, manufacturer: '华北制药' },
    { genericName: '注射用头孢曲松钠', category: '头孢菌素类', specification: '1.0g', price: 45.5, manufacturer: '罗氏制药' },
    { genericName: '阿司匹林肠溶片', category: '解热镇痛', specification: '100mg*30片', price: 18.2, manufacturer: '拜耳医药' },
    { genericName: '布洛芬缓释胶囊', category: '解热镇痛', specification: '0.3g*20粒', price: 22.5, manufacturer: '中美史克' },
    { genericName: '盐酸二甲双胍片', category: '降糖药', specification: '0.5g*30片', price: 32.8, manufacturer: '中美上海施贵宝' },
    { genericName: '阿托伐他汀钙片', category: '他汀类', specification: '20mg*7片', price: 58.6, manufacturer: '辉瑞制药' },
    { genericName: '硝苯地平控释片', category: '钙通道阻滞剂', specification: '30mg*7片', price: 42.3, manufacturer: '拜耳医药' },
    { genericName: '奥美拉唑肠溶胶囊', category: '质子泵抑制剂', specification: '20mg*14粒', price: 38.5, manufacturer: '阿斯利康' },
    { genericName: '盐酸左氧氟沙星片', category: '喹诺酮类', specification: '0.5g*4片', price: 28.9, manufacturer: '第一三共' },
    { genericName: '氯雷他定片', category: '抗组胺药', specification: '10mg*6片', price: 25.6, manufacturer: '拜耳医药' },
  ];

  db.data.medicines = medicineNames.map((m, i) => ({
    id: `MED${String(i + 1).padStart(4, '0')}`,
    ...m,
    commonName: m.genericName,
    dosageForm: m.specification.includes('胶囊') ? '胶囊剂' : m.specification.includes('片') ? '片剂' : '注射剂',
    approvalNo: `国药准字H${String(10000000 + i).padStart(8, '0')}`,
    minStock: 50,
    maxStock: 500,
    isHighAlert: i < 2,
    storageCondition: i < 1 ? 'cold' : i < 3 ? 'cool' : 'normal',
    isControl: false,
    monthlyUsage: [80 + i * 10 + Math.floor(Math.random() * 30), 90 + i * 12 + Math.floor(Math.random() * 25), 85 + i * 11 + Math.floor(Math.random() * 28), 95 + i * 13 + Math.floor(Math.random() * 22), 100 + i * 14 + Math.floor(Math.random() * 20), 105 + i * 15 + Math.floor(Math.random() * 18)],
    turnoverRate: 3 + Math.random() * 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const supplierNames = [
    { name: '国药集团药业股份有限公司', creditLevel: 'A', rating: 4.8 },
    { name: '上海医药集团股份有限公司', creditLevel: 'A', rating: 4.7 },
    { name: '九州通医药集团股份有限公司', creditLevel: 'B', rating: 4.5 },
    { name: '华润医药商业集团有限公司', creditLevel: 'A', rating: 4.9 },
  ];

  db.data.suppliers = supplierNames.map((s, i) => ({
    id: `SUP${String(i + 1).padStart(4, '0')}`,
    ...s,
    contactPerson: `联系人${i + 1}`,
    contactPhone: `138${String(10000000 + i).padStart(8, '0')}`,
    address: `北京市朝阳区供应商路${i + 1}号`,
    businessLicense: `营业执照${String(100000000000 + i)}`,
    gspCertificate: `GSP证书${String(100000 + i)}`,
    supplyScope: '西药、中成药',
    status: 'active',
    createdAt: new Date().toISOString(),
  }));

  const zoneNames = [
    { name: '冷藏库', type: 'cold', minTemp: 2, maxTemp: 8, minHumidity: 45, maxHumidity: 65 },
    { name: '阴凉库1', type: 'cool', minTemp: 10, maxTemp: 20, minHumidity: 45, maxHumidity: 75 },
    { name: '阴凉库2', type: 'cool', minTemp: 10, maxTemp: 20, minHumidity: 45, maxHumidity: 75 },
    { name: '常温库1', type: 'normal', minTemp: 10, maxTemp: 30, minHumidity: 35, maxHumidity: 75 },
    { name: '常温库2', type: 'normal', minTemp: 10, maxTemp: 30, minHumidity: 35, maxHumidity: 75 },
  ];

  db.data.warehouseZones = zoneNames.map((z, i) => ({
    id: `ZONE${String(i + 1).padStart(4, '0')}`,
    ...z,
    currentTemp: z.minTemp + Math.random() * (z.maxTemp - z.minTemp),
    currentHumidity: z.minHumidity + Math.random() * (z.maxHumidity - z.minHumidity),
    createdAt: new Date().toISOString(),
  }));

  db.data.drugConflicts = [
    { id: 1, medicines: ['阿莫西林胶囊', '注射用头孢曲松钠'], severity: 'medium', type: 'conflict', description: '青霉素类与头孢菌素类存在交叉过敏风险，需确认患者过敏史' },
    { id: 2, medicines: ['阿司匹林肠溶片', '布洛芬缓释胶囊'], severity: 'high', type: 'duplicate', description: '均为NSAIDs类药物，重复使用增加胃肠道出血风险' },
    { id: 3, medicines: ['华法林', '阿司匹林肠溶片'], severity: 'high', type: 'conflict', description: '抗凝与抗血小板联用显著增加出血风险，需密切监测INR' },
    { id: 4, medicines: ['硝苯地平控释片', '西地那非'], severity: 'high', type: 'conflict', description: '可能导致血压显著降低，属禁忌联用' },
    { id: 5, medicines: ['奥美拉唑肠溶胶囊', '氯吡格雷'], severity: 'medium', type: 'interaction', description: '奥美拉唑可能降低氯吡格雷的抗血小板活性' },
    { id: 6, medicines: ['阿托伐他汀钙片', '红霉素'], severity: 'high', type: 'interaction', description: '红霉素显著增加他汀类血药浓度，增加横纹肌溶解风险' },
    { id: 7, medicines: ['盐酸左氧氟沙星片', '碳酸钙'], severity: 'medium', type: 'interaction', description: '钙制剂显著降低喹诺酮类的口服生物利用度' },
    { id: 8, medicines: ['盐酸二甲双胍片', '碘造影剂'], severity: 'high', type: 'conflict', description: '可能导致乳酸酸中毒，检查前需停用二甲双胍48小时' },
  ];

  db.data.pediatricDosages = [
    { medicineName: '阿莫西林胶囊', maxDose: 100, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
    { medicineName: '布洛芬缓释胶囊', maxDose: 40, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
    { medicineName: '阿司匹林肠溶片', maxDose: 100, unit: 'mg/kg/day', minAge: 12, calculation: 'perKg' },
    { medicineName: '盐酸左氧氟沙星片', maxDose: 500, unit: 'mg/day', minAge: 18, calculation: 'fixed' },
    { medicineName: '盐酸二甲双胍片', maxDose: 2000, unit: 'mg/day', minAge: 10, calculation: 'fixed' },
    { medicineName: '奥美拉唑肠溶胶囊', maxDose: 20, unit: 'mg/kg/day', minAge: 1, calculation: 'perKg' },
    { medicineName: '氯雷他定片', maxDose: 10, unit: 'mg/day', minAge: 12, calculation: 'fixed' },
    { medicineName: '注射用头孢曲松钠', maxDose: 100, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
  ];

  db.data.inventoryBatches = db.data.medicines.flatMap((med, i) => {
    const batches = [];
    for (let j = 0; j < 2; j++) {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 6 + j * 6 + Math.floor(Math.random() * 6));
      batches.push({
        id: `BATCH${String(i * 2 + j + 1).padStart(6, '0')}`,
        medicineId: med.id,
        medicineName: med.genericName,
        batchNo: `B${String(20240000 + i * 10 + j)}`,
        manufactureDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        quantity: 50 + Math.floor(Math.random() * 200),
        location: db.data.warehouseZones[j % db.data.warehouseZones.length].id,
        receivedBy: 'INIT',
        status: 'normal',
        createdAt: new Date().toISOString(),
      });
    }
    return batches;
  });

  db.data.users = [
    { id: 'USER0001', username: 'admin', password: '123456', name: '系统管理员', role: 'admin', department: '信息科' },
    { id: 'USER0002', username: 'pharma_head', password: '123456', name: '张主任', role: 'pharmacy_director', department: '药学部' },
    { id: 'USER0003', username: 'hospital_head', password: '123456', name: '李院长', role: 'hospital_director', department: '院领导' },
    { id: 'USER0004', username: 'pharmacist1', password: '123456', name: '王药师', role: 'pharmacist', department: '药学部' },
    { id: 'USER0005', username: 'doctor1', password: '123456', name: '刘医生', role: 'doctor', department: '内科' },
  ];
}

export function generateId(prefix: string, length: number = 4): string {
  const timestamp = Date.now().toString().slice(-length);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
}
