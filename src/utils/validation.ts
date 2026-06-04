import { PrescriptionItem, Medicine, PrescriptionWarning } from '../types';

interface DrugConflict {
  medicines: [string, string];
  severity: 'high' | 'medium' | 'low';
  description: string;
}

const drugConflicts: DrugConflict[] = [
  {
    medicines: ['阿莫西林胶囊', '氯霉素'],
    severity: 'high',
    description: '阿莫西林与氯霉素存在拮抗作用，可能降低抗菌效果'
  },
  {
    medicines: ['布洛芬缓释胶囊', '阿司匹林'],
    severity: 'medium',
    description: '联用可能增加胃肠道出血风险'
  },
  {
    medicines: ['奥美拉唑肠溶胶囊', '氯雷他定片'],
    severity: 'low',
    description: '奥美拉唑可能延长氯雷他定的代谢，需注意监测'
  },
  {
    medicines: ['硝苯地平控释片', '西地那非'],
    severity: 'high',
    description: '联用可能导致血压过低'
  },
  {
    medicines: ['盐酸二甲双胍片', '华法林'],
    severity: 'medium',
    description: '二甲双胍可能增强华法林的抗凝作用'
  },
  {
    medicines: ['阿托伐他汀钙片', '红霉素'],
    severity: 'high',
    description: '红霉素可能增加他汀类药物的肌病风险'
  },
  {
    medicines: ['注射用头孢曲松钠', '含钙注射液'],
    severity: 'high',
    description: '头孢曲松与含钙溶液存在配伍禁忌，可能形成沉淀'
  },
  {
    medicines: ['地塞米松磷酸钠注射液', '胰岛素'],
    severity: 'medium',
    description: '糖皮质激素可能升高血糖，需调整胰岛素剂量'
  },
];

const duplicateCategories: Record<string, string[]> = {
  '抗生素': ['阿莫西林胶囊', '注射用头孢曲松钠'],
  '解热镇痛': ['布洛芬缓释胶囊', '阿司匹林'],
  '质子泵抑制剂': ['奥美拉唑肠溶胶囊', '兰索拉唑'],
  '降压药': ['硝苯地平控释片', '氨氯地平'],
};

const pediatricDosageLimits: Record<string, { maxDose: number; unit: string }> = {
  '阿莫西林胶囊': { maxDose: 100, unit: 'mg/kg/day' },
  '布洛芬缓释胶囊': { maxDose: 40, unit: 'mg/kg/day' },
  '奥美拉唑肠溶胶囊': { maxDose: 1, unit: 'mg/kg/day' },
};

export function checkCompatibility(
  items: PrescriptionItem[],
  medicines: Medicine[],
  patientAge: number
): PrescriptionWarning[] {
  const warnings: PrescriptionWarning[] = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const conflict = drugConflicts.find(dc =>
        (dc.medicines[0] === items[i].medicineName && dc.medicines[1] === items[j].medicineName) ||
        (dc.medicines[1] === items[i].medicineName && dc.medicines[0] === items[j].medicineName)
      );

      if (conflict) {
        warnings.push({
          type: 'conflict',
          severity: conflict.severity,
          medicines: [items[i].medicineName, items[j].medicineName],
          description: conflict.description,
        });
      }
    }
  }

  const categories = new Map<string, string[]>();
  items.forEach(item => {
    const medicine = medicines.find(m => m.genericName === item.medicineName);
    if (medicine) {
      const existing = categories.get(medicine.category) || [];
      categories.set(medicine.category, [...existing, medicine.genericName]);
    }
  });

  categories.forEach((meds, category) => {
    if (meds.length > 1) {
      warnings.push({
        type: 'duplicate',
        severity: 'medium',
        medicines: meds,
        description: `同一药理分类(${category})存在重复用药，请确认是否必要`,
      });
    }
  });

  if (patientAge < 12) {
    items.forEach(item => {
      const limit = pediatricDosageLimits[item.medicineName];
      if (limit) {
        warnings.push({
          type: 'age',
          severity: 'low',
          medicines: [item.medicineName],
          description: `儿童患者(${patientAge}岁)使用${item.medicineName}，请确认用量是否符合儿童剂量规范(不超过${limit.maxDose}${limit.unit})`,
        });
      }
    });
  }

  return warnings;
}

export function checkExpiryStatus(expiryDate: string): 'normal' | 'warning' | 'danger' {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysToExpiry <= 0) return 'danger';
  if (daysToExpiry <= 30) return 'danger';
  if (daysToExpiry <= 90) return 'warning';
  return 'normal';
}

export function checkStockStatus(currentStock: number, minStock: number, maxStock: number): 'normal' | 'low' | 'high' | 'empty' {
  if (currentStock <= 0) return 'empty';
  if (currentStock < minStock * 0.5) return 'low';
  if (currentStock > maxStock) return 'high';
  return 'normal';
}

export function checkTemperatureStatus(
  current: number,
  min: number,
  max: number
): { status: 'normal' | 'warning' | 'danger'; message: string } {
  if (current < min - 2 || current > max + 2) {
    return { status: 'danger', message: `温度${current}°C超出范围[${min}-${max}]°C，严重超标！` };
  }
  if (current < min || current > max) {
    return { status: 'warning', message: `温度${current}°C接近阈值[${min}-${max}]°C，请注意` };
  }
  return { status: 'normal', message: `温度正常(${current}°C)` };
}

export function checkHumidityStatus(
  current: number,
  min: number,
  max: number
): { status: 'normal' | 'warning' | 'danger'; message: string } {
  if (current < min - 5 || current > max + 5) {
    return { status: 'danger', message: `湿度${current}%超出范围[${min}-${max}]%，严重超标！` };
  }
  if (current < min || current > max) {
    return { status: 'warning', message: `湿度${current}%接近阈值[${min}-${max}]%，请注意` };
  }
  return { status: 'normal', message: `湿度正常(${current}%)` };
}

export function allocateStorage(
  medicine: Medicine,
  zones: { id: string; name: string; type: string; used: number; capacity: number }[]
): { zoneId: string; zoneName: string; location: string } {
  let targetZoneType: string;

  if (medicine.isHighRisk) {
    targetZoneType = 'high_risk';
  } else {
    targetZoneType = medicine.storageCondition;
  }

  const availableZones = zones.filter(z => z.type === targetZoneType && z.used < z.capacity);

  if (availableZones.length === 0) {
    const fallbackZone = zones.find(z => z.type === 'normal' && z.used < z.capacity) || zones[0];
    return {
      zoneId: fallbackZone.id,
      zoneName: fallbackZone.name,
      location: `${fallbackZone.name}-A-01`,
    };
  }

  const zone = availableZones[0];
  const shelfNumber = Math.floor(zone.used / 100) + 1;
  const positionNumber = (zone.used % 100) + 1;

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    location: `${zone.name}-${String(shelfNumber).padStart(2, '0')}-${String(positionNumber).padStart(2, '0')}`,
  };
}

export function generatePurchasePlan(
  medicine: Medicine,
  currentStock: number,
  monthlyUsage: number[],
  turnoverRate: number
): { suggestedQuantity: number; reason: string } {
  const avgUsage = monthlyUsage.reduce((a, b) => a + b, 0) / monthlyUsage.length;
  const safetyStock = avgUsage * 0.3;
  const targetStock = avgUsage * 3 + safetyStock;
  const nearExpiryStock = 0;
  const availableStock = currentStock - nearExpiryStock;

  let suggestedQuantity = Math.ceil(targetStock - availableStock);

  if (turnoverRate < 3) {
    suggestedQuantity = Math.ceil(suggestedQuantity * 0.8);
  } else if (turnoverRate > 8) {
    suggestedQuantity = Math.ceil(suggestedQuantity * 1.2);
  }

  suggestedQuantity = Math.max(0, suggestedQuantity);
  suggestedQuantity = Math.min(suggestedQuantity, medicine.maxStock - currentStock);

  const reason = `基于历史用量(月均${avgUsage.toFixed(0)}单位)、安全库存(${safetyStock.toFixed(0)})、周转率(${turnoverRate.toFixed(1)})计算`;

  return { suggestedQuantity, reason };
}
