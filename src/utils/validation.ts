import { PrescriptionItem, Medicine, PrescriptionWarning, PurchasePlanItem, InventoryBatch } from '../types';

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
  {
    medicines: ['阿莫西林胶囊', '注射用头孢曲松钠'],
    severity: 'medium',
    description: '青霉素类与头孢菌素类存在交叉过敏风险，且同类抗生素联用无必要'
  },
  {
    medicines: ['布洛芬缓释胶囊', '双氯芬酸钠'],
    severity: 'high',
    description: '两种NSAIDs联用显著增加胃肠道出血和心血管风险'
  },
  {
    medicines: ['硝苯地平控释片', '地高辛'],
    severity: 'medium',
    description: '硝苯地平可能升高地高辛血药浓度，需监测地高辛水平'
  },
  {
    medicines: ['华法林', '阿司匹林'],
    severity: 'high',
    description: '抗凝与抗血小板联用显著增加出血风险'
  },
  {
    medicines: ['地高辛', '呋塞米'],
    severity: 'medium',
    description: '呋塞米导致的低钾血症可能增加地高辛中毒风险'
  },
  {
    medicines: ['氨茶碱', '环丙沙星'],
    severity: 'high',
    description: '环丙沙星可抑制氨茶碱代谢，可能导致茶碱中毒'
  },
  {
    medicines: ['盐酸二甲双胍片', '碘造影剂'],
    severity: 'high',
    description: '使用碘造影剂前需停用二甲双胍，以防乳酸酸中毒'
  },
  {
    medicines: ['氯雷他定片', '酮康唑'],
    severity: 'medium',
    description: '酮康唑可抑制氯雷他定代谢，增加不良反应风险'
  },
];

const pharmacologicCategories: Record<string, string[]> = {
  '青霉素类抗生素': ['阿莫西林胶囊', '氨苄西林', '哌拉西林'],
  '头孢菌素类': ['注射用头孢曲松钠', '头孢呋辛', '头孢克洛'],
  'NSAIDs': ['布洛芬缓释胶囊', '阿司匹林', '双氯芬酸钠', '塞来昔布'],
  '质子泵抑制剂': ['奥美拉唑肠溶胶囊', '兰索拉唑', '泮托拉唑', '雷贝拉唑'],
  '钙通道阻滞剂': ['硝苯地平控释片', '氨氯地平', '非洛地平'],
  'ACEI': ['依那普利', '贝那普利', '赖诺普利'],
  'ARB': ['氯沙坦', '缬沙坦', '厄贝沙坦'],
  '他汀类': ['阿托伐他汀钙片', '瑞舒伐他汀', '辛伐他汀'],
  '双胍类': ['盐酸二甲双胍片'],
  '磺脲类': ['格列美脲', '格列齐特', '格列吡嗪'],
  '抗凝药': ['华法林', '利伐沙班', '达比加群'],
  '抗血小板': ['阿司匹林', '氯吡格雷', '替格瑞洛'],
  '糖皮质激素': ['地塞米松磷酸钠注射液', '泼尼松', '甲泼尼龙'],
  '大环内酯类': ['红霉素', '阿奇霉素', '克拉霉素'],
  '喹诺酮类': ['环丙沙星', '左氧氟沙星', '莫西沙星'],
  '抗组胺药': ['氯雷他定片', '西替利嗪', '扑尔敏'],
  '利尿剂': ['呋塞米', '氢氯噻嗪', '螺内酯'],
  '强心苷': ['地高辛', '去乙酰毛花苷'],
  '茶碱类': ['氨茶碱', '多索茶碱'],
  '抗真菌药': ['酮康唑', '氟康唑', '伊曲康唑'],
};

const pediatricDosageLimits: Record<string, { maxDose: number; unit: string; minAge: number; calculation: 'perKg' | 'fixed' }> = {
  '阿莫西林胶囊': { maxDose: 100, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
  '布洛芬缓释胶囊': { maxDose: 40, unit: 'mg/kg/day', minAge: 0.5, calculation: 'perKg' },
  '奥美拉唑肠溶胶囊': { maxDose: 1, unit: 'mg/kg/day', minAge: 1, calculation: 'perKg' },
  '注射用头孢曲松钠': { maxDose: 100, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
  '硝苯地平控释片': { maxDose: 1.5, unit: 'mg/kg/day', minAge: 6, calculation: 'perKg' },
  '盐酸二甲双胍片': { maxDose: 2000, unit: 'mg/day', minAge: 10, calculation: 'fixed' },
  '阿托伐他汀钙片': { maxDose: 20, unit: 'mg/day', minAge: 10, calculation: 'fixed' },
  '氯雷他定片': { maxDose: 10, unit: 'mg/day', minAge: 2, calculation: 'fixed' },
  '华法林': { maxDose: 0.1, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
  '地高辛': { maxDose: 0.01, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
  '氨茶碱': { maxDose: 16, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
  '阿司匹林': { maxDose: 60, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
  '呋塞米': { maxDose: 2, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
  '地塞米松磷酸钠注射液': { maxDose: 0.5, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
  '红霉素': { maxDose: 50, unit: 'mg/kg/day', minAge: 0, calculation: 'perKg' },
  '环丙沙星': { maxDose: 30, unit: 'mg/kg/day', minAge: 18, calculation: 'perKg' },
};

export function checkCompatibility(
  items: PrescriptionItem[],
  medicines: Medicine[],
  patientAge: number,
  patientWeight?: number
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
    for (const [category, meds] of Object.entries(pharmacologicCategories)) {
      if (meds.includes(item.medicineName)) {
        const existing = categories.get(category) || [];
        categories.set(category, [...existing, item.medicineName]);
        break;
      }
    }
    const medicine = medicines.find(m => m.genericName === item.medicineName);
    if (medicine) {
      const existing = categories.get(medicine.category) || [];
      if (!existing.includes(medicine.genericName)) {
        categories.set(medicine.category, [...existing, medicine.genericName]);
      }
    }
  });

  categories.forEach((meds, category) => {
    if (meds.length > 1) {
      warnings.push({
        type: 'duplicate',
        severity: 'medium',
        medicines: meds,
        description: `同一药理分类(${category})存在重复用药：${meds.join('、')}，请确认是否必要`,
      });
    }
  });

  items.forEach(item => {
    const limit = pediatricDosageLimits[item.medicineName];
    if (limit) {
      if (patientAge < limit.minAge) {
        warnings.push({
          type: 'age',
          severity: 'high',
          medicines: [item.medicineName],
          description: `${item.medicineName}禁用于${limit.minAge}岁以下儿童，患者年龄${patientAge}岁`,
        });
      } else if (patientAge < 18) {
        let calculatedMaxDose: number;
        let actualDose: number;
        
        if (limit.calculation === 'perKg' && patientWeight) {
          calculatedMaxDose = limit.maxDose * patientWeight;
          actualDose = item.quantity;
          if (item.frequency) {
            const freqMatch = item.frequency.match(/(\d+)次/);
            const dailyTimes = freqMatch ? parseInt(freqMatch[1]) : 1;
            actualDose = item.quantity * dailyTimes;
          }
        } else {
          calculatedMaxDose = limit.maxDose;
          actualDose = item.quantity;
        }

        const doseRatio = actualDose / calculatedMaxDose;
        if (doseRatio > 1.2) {
          warnings.push({
            type: 'dosage',
            severity: 'high',
            medicines: [item.medicineName],
            description: `儿童患者(${patientAge}岁${patientWeight ? `，${patientWeight}kg` : ''})使用${item.medicineName}剂量过大：${actualDose}${limit.unit.split('/')[0]}，最大推荐剂量${calculatedMaxDose.toFixed(1)}${limit.unit.split('/')[0]}，超出${((doseRatio - 1) * 100).toFixed(0)}%`,
          });
        } else if (doseRatio > 1) {
          warnings.push({
            type: 'dosage',
            severity: 'medium',
            medicines: [item.medicineName],
            description: `儿童患者(${patientAge}岁${patientWeight ? `，${patientWeight}kg` : ''})使用${item.medicineName}剂量接近上限：${actualDose}${limit.unit.split('/')[0]}，最大推荐剂量${calculatedMaxDose.toFixed(1)}${limit.unit.split('/')[0]}`,
          });
        } else {
          warnings.push({
            type: 'age',
            severity: 'low',
            medicines: [item.medicineName],
            description: `儿童患者(${patientAge}岁${patientWeight ? `，${patientWeight}kg` : ''})使用${item.medicineName}，剂量${actualDose}${limit.unit.split('/')[0]}，在推荐范围内(≤${calculatedMaxDose.toFixed(1)}${limit.unit.split('/')[0]})`,
          });
        }
      }
    } else if (patientAge < 12) {
      warnings.push({
        type: 'age',
        severity: 'low',
        medicines: [item.medicineName],
        description: `儿童患者(${patientAge}岁)使用${item.medicineName}，暂无儿童剂量数据，请谨慎评估`,
      });
    }
  });

  return warnings;
}

export function calculatePediatricDosage(
  medicineName: string,
  patientAge: number,
  patientWeight: number
): { recommendedDose: number; maxDose: number; unit: string; warning?: string } | null {
  const limit = pediatricDosageLimits[medicineName];
  if (!limit) return null;

  if (patientAge < limit.minAge) {
    return {
      recommendedDose: 0,
      maxDose: 0,
      unit: limit.unit,
      warning: `禁用于${limit.minAge}岁以下儿童`
    };
  }

  if (limit.calculation === 'perKg') {
    const maxDose = limit.maxDose * patientWeight;
    const recommendedDose = maxDose * 0.6;
    return {
      recommendedDose: Math.round(recommendedDose * 100) / 100,
      maxDose: Math.round(maxDose * 100) / 100,
      unit: limit.unit,
    };
  } else {
    const maxDose = limit.maxDose;
    const recommendedDose = maxDose * 0.6;
    return {
      recommendedDose: Math.round(recommendedDose * 100) / 100,
      maxDose: Math.round(maxDose * 100) / 100,
      unit: limit.unit,
    };
  }
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
  inventoryBatches: InventoryBatch[],
  monthlyUsage: number[],
  turnoverRate: number
): PurchasePlanItem {
  const avgUsage = monthlyUsage.reduce((a, b) => a + b, 0) / monthlyUsage.length;
  const trendFactor = monthlyUsage.length >= 2 
    ? monthlyUsage[monthlyUsage.length - 1] / monthlyUsage[0]
    : 1;
  const adjustedAvgUsage = avgUsage * trendFactor;

  const safetyStock = adjustedAvgUsage * 0.3;

  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const medicineBatches = inventoryBatches.filter(b => b.medicineId === medicine.id);
  
  let nearExpiryStock = 0;
  let warningExpiryStock = 0;

  medicineBatches.forEach(batch => {
    const expiry = new Date(batch.expiryDate);
    if (expiry <= ninetyDaysLater) {
      if (expiry <= thirtyDaysLater) {
        nearExpiryStock += batch.quantity;
      } else {
        warningExpiryStock += batch.quantity;
      }
    }
  });

  const availableStock = currentStock - nearExpiryStock - warningExpiryStock * 0.5;

  const targetStock = adjustedAvgUsage * 3 + safetyStock;

  let suggestedQuantity = Math.ceil(targetStock - availableStock);

  if (turnoverRate < 3) {
    suggestedQuantity = Math.ceil(suggestedQuantity * 0.7);
  } else if (turnoverRate > 8) {
    suggestedQuantity = Math.ceil(suggestedQuantity * 1.3);
  }

  if (nearExpiryStock > 0) {
    suggestedQuantity = Math.ceil(suggestedQuantity * 0.9);
  }

  suggestedQuantity = Math.max(0, suggestedQuantity);
  suggestedQuantity = Math.min(suggestedQuantity, medicine.maxStock - currentStock);

  const reasonParts = [];
  reasonParts.push(`月均用量${avgUsage.toFixed(0)}${medicine.unit}`);
  if (trendFactor !== 1) {
    const trendPercent = (trendFactor - 1) * 100;
    reasonParts.push(`趋势${trendPercent > 0 ? '+' : ''}${trendPercent.toFixed(0)}%`);
  }
  reasonParts.push(`安全库存${safetyStock.toFixed(0)}${medicine.unit}`);
  reasonParts.push(`周转率${turnoverRate.toFixed(1)}`);
  if (nearExpiryStock > 0 || warningExpiryStock > 0) {
    reasonParts.push(`近效期${(nearExpiryStock + warningExpiryStock).toFixed(0)}${medicine.unit}`);
  }

  const reason = `基于${reasonParts.join('、')}`;

  return {
    medicineId: medicine.id,
    medicineName: medicine.genericName,
    currentStock,
    avgMonthlyUsage: Math.round(adjustedAvgUsage * 100) / 100,
    safetyStock: Math.round(safetyStock * 100) / 100,
    nearExpiryStock,
    turnoverRate,
    suggestedQuantity,
    unitPrice: medicine.price,
    subtotal: suggestedQuantity * medicine.price,
    reason,
  };
}

export function generateMonthlyPurchasePlan(
  medicines: Medicine[],
  inventoryBatches: InventoryBatch[]
): PurchasePlanItem[] {
  const planItems: PurchasePlanItem[] = [];

  medicines.forEach(medicine => {
    const currentStock = inventoryBatches
      .filter(b => b.medicineId === medicine.id)
      .reduce((sum, b) => sum + b.quantity, 0);

    if (medicine.monthlyUsage && medicine.monthlyUsage.length > 0) {
      const planItem = generatePurchasePlan(
        medicine,
        currentStock,
        inventoryBatches,
        medicine.monthlyUsage,
        medicine.turnoverRate || 5
      );
      
      if (planItem.suggestedQuantity > 0) {
        planItems.push(planItem);
      }
    }
  });

  return planItems.sort((a, b) => b.suggestedQuantity - a.suggestedQuantity);
}
