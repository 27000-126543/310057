import { Router, type Request, type Response } from 'express';
import { db, generateId } from '../db/index.js';

const router = Router();

const drugCategories: Record<string, string[]> = {
  '青霉素类': ['阿莫西林胶囊', '注射用青霉素钠', '氨苄西林'],
  '头孢菌素类': ['注射用头孢曲松钠', '头孢克肟胶囊', '头孢呋辛酯片'],
  '喹诺酮类': ['盐酸左氧氟沙星片', '诺氟沙星胶囊', '环丙沙星'],
  'NSAIDs': ['阿司匹林肠溶片', '布洛芬缓释胶囊', '双氯芬酸钠肠溶片', '萘普生'],
  '他汀类': ['阿托伐他汀钙片', '辛伐他汀片', '瑞舒伐他汀钙片', '普伐他汀钠片'],
  'ACEI': ['卡托普利片', '依那普利', '贝那普利', '赖诺普利'],
  'ARB': ['缬沙坦胶囊', '氯沙坦钾片', '厄贝沙坦片', '替米沙坦片'],
  '钙通道阻滞剂': ['硝苯地平控释片', '氨氯地平片', '非洛地平缓释片'],
  '质子泵抑制剂': ['奥美拉唑肠溶胶囊', '兰索拉唑', '泮托拉唑', '雷贝拉唑'],
  '抗组胺药': ['氯雷他定片', '西替利嗪', '扑尔敏', '异丙嗪'],
  '降糖药': ['盐酸二甲双胍片', '格列美脲', '阿卡波糖', '西格列汀'],
  '抗凝药': ['华法林钠片', '利伐沙班', '达比加群酯'],
  '抗血小板': ['阿司匹林肠溶片', '氯吡格雷', '替格瑞洛'],
  '糖皮质激素': ['泼尼松', '地塞米松', '甲泼尼龙', '氢化可的松'],
  '大环内酯类': ['红霉素', '阿奇霉素', '克拉霉素', '罗红霉素'],
  '氨基糖苷类': ['庆大霉素', '阿米卡星', '妥布霉素'],
  '磺胺类': ['复方磺胺甲恶唑', '柳氮磺吡啶'],
  '抗真菌药': ['氟康唑', '伊曲康唑', '伏立康唑'],
  '抗病毒药': ['阿昔洛韦', '更昔洛韦', '奥司他韦'],
  '苯二氮卓类': ['地西泮', '阿普唑仑', '劳拉西泮'],
};

function getDrugCategory(medicineName: string): string | null {
  for (const [category, medicines] of Object.entries(drugCategories)) {
    if (medicines.some((m) => medicineName.includes(m) || m.includes(medicineName))) {
      return category;
    }
  }
  return null;
}

function checkCompatibility(items: any[], patientAge: number, patientWeight?: number) {
  const warnings: any[] = [];
  const medicineNames = items.map((item) => item.medicineName);
  
  db.data.drugConflicts.forEach((conflict) => {
    const foundMedicines = conflict.medicines.filter((m: string) =>
      medicineNames.some((name) => name.includes(m) || m.includes(name))
    );
    if (foundMedicines.length >= 2) {
      warnings.push({
        type: conflict.type,
        severity: conflict.severity,
        medicines: foundMedicines,
        description: conflict.description,
      });
    }
  });
  
  const categoriesFound = new Map<string, string[]>();
  medicineNames.forEach((name) => {
    const category = getDrugCategory(name);
    if (category) {
      const existing = categoriesFound.get(category) || [];
      existing.push(name);
      categoriesFound.set(category, existing);
    }
  });
  
  categoriesFound.forEach((meds, category) => {
    if (meds.length >= 2) {
      warnings.push({
        type: 'duplicate',
        severity: 'medium',
        medicines: meds,
        description: `同属${category}，存在重复用药风险，请确认用药必要性`,
      });
    }
  });
  
  if (patientAge < 18) {
    medicineNames.forEach((name) => {
      const pediatricDosage = db.data.pediatricDosages.find(
        (d) => name.includes(d.medicineName) || d.medicineName.includes(name)
      );
      if (pediatricDosage && patientAge < pediatricDosage.minAge) {
        warnings.push({
          type: 'pediatric',
          severity: 'high',
          medicines: [name],
          description: `${name}不适用于${patientAge}岁儿童，最小适用年龄为${pediatricDosage.minAge}岁`,
        });
      }
    });
  }
  
  return warnings;
}

function calculatePediatricDosage(medicineName: string, patientAge: number, patientWeight: number) {
  const dosageInfo = db.data.pediatricDosages.find(
    (d) => medicineName.includes(d.medicineName) || d.medicineName.includes(medicineName)
  );
  
  if (!dosageInfo) {
    return null;
  }
  
  if (patientAge < dosageInfo.minAge) {
    return {
      maxDose: 0,
      recommendedDose: 0,
      unit: dosageInfo.unit,
      warning: `不适用于${patientAge}岁儿童`,
    };
  }
  
  if (dosageInfo.calculation === 'perKg') {
    return {
      recommendedDose: Math.round(dosageInfo.maxDose * 0.6 * patientWeight),
      maxDose: dosageInfo.maxDose * patientWeight,
      unit: dosageInfo.unit,
    };
  }
  
  return {
    recommendedDose: Math.round(dosageInfo.maxDose * 0.6),
    maxDose: dosageInfo.maxDose,
    unit: dosageInfo.unit,
  };
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { status } = req.query;
  
  let prescriptions = db.data.prescriptions;
  if (status) {
    prescriptions = prescriptions.filter((p) => p.status === status);
  }
  
  prescriptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const prescriptionsWithItems = prescriptions.map((presc) => ({
    ...presc,
    items: db.data.prescriptionItems.filter((item) => item.prescriptionId === presc.id),
  }));
  
  res.json({
    success: true,
    data: prescriptionsWithItems,
  });
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { id } = req.params;
  
  const prescription = db.data.prescriptions.find((p) => p.id === id);
  if (!prescription) {
    res.status(404).json({ success: false, error: '处方不存在' });
    return;
  }
  
  const items = db.data.prescriptionItems.filter((item) => item.prescriptionId === id);
  const warnings = db.data.prescriptionWarnings.filter((w) => w.prescriptionId === id);
  
  res.json({
    success: true,
    data: { ...prescription, items, warnings },
  });
});

router.post('/:id/validate', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { id } = req.params;
  
  const prescription = db.data.prescriptions.find((p) => p.id === id);
  if (!prescription) {
    res.status(404).json({ success: false, error: '处方不存在' });
    return;
  }
  
  const items = db.data.prescriptionItems.filter((item) => item.prescriptionId === id);
  const warnings = checkCompatibility(items, prescription.patientAge, prescription.patientWeight);
  
  await db.write();
  
  const pediatricDosageResults: Record<string, any> = {};
  if (prescription.patientAge < 18 && prescription.patientWeight) {
    items.forEach((item) => {
      const dosageInfo = calculatePediatricDosage(
        item.medicineName,
        prescription.patientAge,
        prescription.patientWeight!
      );
      if (dosageInfo) {
        const freqMatch = item.frequency?.match(/(\d+)次/);
        const dailyTimes = freqMatch ? parseInt(freqMatch[1]) : 1;
        const actualDose = item.quantity * dailyTimes;
        
        pediatricDosageResults[item.id] = {
          ...dosageInfo,
          actualDose,
          isOverLimit: actualDose > (dosageInfo.maxDose || 0) * 1.2,
        };
      }
    });
  }
  
  res.json({
    success: true,
    data: {
      warnings,
      pediatricDosageResults,
    },
  });
});

router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { items, patientAge, patientWeight } = req.body;
  
  const warnings = checkCompatibility(items, patientAge, patientWeight);
  
  const pediatricDosageResults: Record<string, any> = {};
  if (patientAge < 18 && patientWeight) {
    items.forEach((item: any) => {
      const dosageInfo = calculatePediatricDosage(item.medicineName, patientAge, patientWeight);
      if (dosageInfo) {
        const freqMatch = item.frequency?.match(/(\d+)次/);
        const dailyTimes = freqMatch ? parseInt(freqMatch[1]) : 1;
        const actualDose = item.quantity * dailyTimes;
        
        pediatricDosageResults[item.medicineName] = {
          ...dosageInfo,
          actualDose,
          isOverLimit: actualDose > (dosageInfo.maxDose || 0) * 1.2,
        };
      }
    });
  }
  
  res.json({
    success: true,
    data: {
      warnings,
      pediatricDosageResults,
    },
  });
});

router.post('/:id/review', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { id } = req.params;
  const { reviewedBy, status, opinion } = req.body;
  
  const prescriptionIndex = db.data.prescriptions.findIndex((p) => p.id === id);
  if (prescriptionIndex === -1) {
    res.status(404).json({ success: false, error: '处方不存在' });
    return;
  }
  
  const prescription = db.data.prescriptions[prescriptionIndex];
  prescription.status = status;
  prescription.reviewedBy = reviewedBy;
  prescription.reviewOpinion = opinion;
  prescription.reviewedAt = new Date().toISOString();
  prescription.updatedAt = new Date().toISOString();
  
  if (status === 'dispensing') {
    const items = db.data.prescriptionItems.filter((item) => item.prescriptionId === id);
    items.forEach((item) => {
      const batch = db.data.inventoryBatches.find(
        (b) => b.medicineName === item.medicineName && b.status === 'normal'
      );
      if (batch && batch.quantity >= item.quantity) {
        batch.quantity -= item.quantity;
      }
    });
  }
  
  await db.write();
  
  const items = db.data.prescriptionItems.filter((item) => item.prescriptionId === id);
  
  res.json({
    success: true,
    data: { ...prescription, items },
  });
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { patientName, patientAge, patientWeight, patientGender, department, doctor, items } = req.body;
  
  const prescriptionId = generateId('RX', 6);
  const prescriptionNo = `RX${Date.now().toString().slice(-8)}`;
  
  const newPrescription = {
    id: prescriptionId,
    prescriptionNo,
    patientName,
    patientAge,
    patientWeight: patientWeight || null,
    patientGender: patientGender || '未知',
    department,
    doctor,
    status: 'pending',
    reviewedBy: null,
    reviewOpinion: null,
    reviewedAt: null,
    dispensedBy: null,
    dispensedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const prescriptionItems = items.map((item: any, index: number) => ({
    id: generateId('RXI', 4),
    prescriptionId,
    sortOrder: index,
    ...item,
  }));
  
  db.data.prescriptions.push(newPrescription);
  db.data.prescriptionItems.push(...prescriptionItems);
  await db.write();
  
  res.json({
    success: true,
    data: { ...newPrescription, items: prescriptionItems },
  });
});

router.get('/drugs/conflicts', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  res.json({
    success: true,
    data: db.data.drugConflicts,
  });
});

router.get('/drugs/pediatric-dosages', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  res.json({
    success: true,
    data: db.data.pediatricDosages,
  });
});

export default router;
