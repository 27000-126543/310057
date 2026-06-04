import { Router, type Request, type Response } from 'express';
import { db } from '../db/index.js';

const router = Router();

function getDateRange(period: string) {
  const now = new Date();
  let startDate: Date;
  switch (period) {
    case 'quarter':
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return startDate;
}

router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { period = 'month' } = req.query;
  const startDate = getDateRange(period as string);
  
  const filteredOrders = db.data.purchaseOrders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate;
  });
  
  const filteredPrescriptions = db.data.prescriptions.filter((p) => {
    const prescDate = new Date(p.createdAt);
    return prescDate >= startDate;
  });
  
  const totalPurchaseAmount = filteredOrders
    .filter((o) => o.status === 'completed' || o.status === 'approved' || o.status === 'in_transit')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  
  let totalStockValue = 0;
  let expiringValue = 0;
  let warningValue = 0;
  
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const ninetyDaysLater = new Date();
  ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);
  
  db.data.inventoryBatches.forEach((batch) => {
    const medicine = db.data.medicines.find((m) => m.id === batch.medicineId);
    const price = medicine?.price || 0;
    const value = price * batch.quantity;
    totalStockValue += value;
    
    const expiry = new Date(batch.expiryDate);
    if (expiry <= thirtyDaysLater) {
      expiringValue += value;
    } else if (expiry <= ninetyDaysLater) {
      warningValue += value;
    }
  });
  
  let avgTurnoverDays = 0;
  const medsWithTurnover = db.data.medicines.filter((m) => m.monthlyUsage && m.monthlyUsage.length > 0);
  if (medsWithTurnover.length > 0) {
    avgTurnoverDays = Math.round(
      medsWithTurnover.reduce((sum, m) => sum + (m.turnoverRate || 5), 0) / medsWithTurnover.length * 6
    );
  }
  
  res.json({
    success: true,
    data: {
      totalPurchaseAmount: Math.round(totalPurchaseAmount),
      avgTurnoverDays,
      expiringRate: totalStockValue > 0 ? ((expiringValue / totalStockValue) * 100).toFixed(2) : '0.00',
      warningRate: totalStockValue > 0 ? ((warningValue / totalStockValue) * 100).toFixed(2) : '0.00',
      totalStockValue: Math.round(totalStockValue),
      expiringValue: Math.round(expiringValue),
      warningValue: Math.round(warningValue),
      prescriptionCount: filteredPrescriptions.length,
      completedPrescriptionCount: filteredPrescriptions.filter((p) => p.status === 'completed').length,
      purchaseOrderCount: filteredOrders.length,
      supplierCount: db.data.suppliers.length,
      medicineCount: db.data.medicines.length,
      batchCount: db.data.inventoryBatches.length,
    },
  });
});

router.get('/purchase/monthly', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { year = new Date().getFullYear() } = req.query;
  
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const purchaseByMonth = new Array(12).fill(0);
  const prescriptionByMonth = new Array(12).fill(0);
  
  db.data.purchaseOrders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    if (orderDate.getFullYear() === Number(year) && 
        (order.status === 'completed' || order.status === 'approved' || order.status === 'in_transit')) {
      purchaseByMonth[orderDate.getMonth()] += order.totalAmount;
    }
  });
  
  db.data.prescriptions.forEach((p) => {
    const prescDate = new Date(p.createdAt);
    if (prescDate.getFullYear() === Number(year) && p.status === 'completed') {
      prescriptionByMonth[prescDate.getMonth()] += 1;
    }
  });
  
  res.json({
    success: true,
    data: {
      months,
      purchaseAmounts: purchaseByMonth.map((v) => Math.round(v / 10000)),
      prescriptionCounts: prescriptionByMonth,
    },
  });
});

router.get('/purchase/by-category', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { period = 'month' } = req.query;
  const startDate = getDateRange(period as string);
  
  const categoryData = new Map<string, number>();
  
  const filteredOrders = db.data.purchaseOrders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate && 
           (order.status === 'completed' || order.status === 'approved' || order.status === 'in_transit');
  });
  
  filteredOrders.forEach((order) => {
    const items = db.data.purchaseOrderItems.filter((i) => i.orderId === order.id);
    items.forEach((item) => {
      const medicine = db.data.medicines.find((m) => m.id === item.medicineId);
      if (medicine) {
        const existing = categoryData.get(medicine.category) || 0;
        categoryData.set(medicine.category, existing + item.subtotal);
      }
    });
  });
  
  const result = Array.from(categoryData.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);
  
  res.json({
    success: true,
    data: result,
  });
});

router.get('/purchase/by-supplier', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { period = 'month', limit = 10 } = req.query;
  const startDate = getDateRange(period as string);
  
  const supplierData = new Map<string, { name: string; amount: number; count: number }>();
  
  const filteredOrders = db.data.purchaseOrders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate && 
           (order.status === 'completed' || order.status === 'approved' || order.status === 'in_transit');
  });
  
  filteredOrders.forEach((order) => {
    const existing = supplierData.get(order.supplierId) || {
      name: order.supplierName,
      amount: 0,
      count: 0,
    };
    supplierData.set(order.supplierId, {
      ...existing,
      amount: existing.amount + order.totalAmount,
      count: existing.count + 1,
    });
  });
  
  const result = Array.from(supplierData.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, Number(limit));
  
  res.json({
    success: true,
    data: result,
  });
});

router.get('/inventory/turnover', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { category = 'all', limit = 15 } = req.query;
  
  const result = db.data.medicines
    .filter((med) => category === 'all' || med.category === category)
    .map((medicine) => {
      const totalStock = db.data.inventoryBatches
        .filter((b) => b.medicineId === medicine.id)
        .reduce((sum, b) => sum + b.quantity, 0);
      
      const avgMonthlyUsage = medicine.monthlyUsage?.length
        ? medicine.monthlyUsage.reduce((a: number, b: number) => a + b, 0) / medicine.monthlyUsage.length
        : 0;
      
      const dispensed = db.data.prescriptions
        .filter((p) => p.status === 'completed' || p.status === 'dispensing')
        .flatMap((p) => db.data.prescriptionItems.filter((i) => i.prescriptionId === p.id))
        .filter((i) => i.medicineName === medicine.genericName)
        .reduce((sum, i) => sum + i.quantity, 0);
      
      const turnoverDays = avgMonthlyUsage > 0 
        ? Math.round((totalStock / avgMonthlyUsage) * 30)
        : 0;
      
      return {
        name: medicine.genericName,
        category: medicine.category,
        totalStock,
        dispensed,
        avgMonthlyUsage: Math.round(avgMonthlyUsage),
        turnoverDays,
      };
    })
    .filter((m) => m.totalStock > 0 || m.dispensed > 0)
    .sort((a, b) => b.turnoverDays - a.turnoverDays)
    .slice(0, Number(limit));
  
  res.json({
    success: true,
    data: result,
  });
});

router.get('/inventory/expiry', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const ninetyDaysLater = new Date();
  ninetyDaysLater.setDate(ninetyDaysLater.getDate() + 90);
  
  let expiringValue = 0;
  let warningValue = 0;
  let totalValue = 0;
  
  db.data.inventoryBatches.forEach((batch) => {
    const medicine = db.data.medicines.find((m) => m.id === batch.medicineId);
    const price = medicine?.price || 0;
    const value = price * batch.quantity;
    totalValue += value;
    
    const expiry = new Date(batch.expiryDate);
    if (expiry <= thirtyDaysLater) {
      expiringValue += value;
    } else if (expiry <= ninetyDaysLater) {
      warningValue += value;
    }
  });
  
  res.json({
    success: true,
    data: {
      expiringRate: totalValue > 0 ? ((expiringValue / totalValue) * 100).toFixed(2) : '0.00',
      warningRate: totalValue > 0 ? ((warningValue / totalValue) * 100).toFixed(2) : '0.00',
      totalValue: Math.round(totalValue),
      expiringValue: Math.round(expiringValue),
      warningValue: Math.round(warningValue),
    },
  });
});

router.get('/categories', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const categories = Array.from(new Set(db.data.medicines.map((m) => m.category)));
  
  res.json({
    success: true,
    data: categories,
  });
});

router.get('/export/purchase', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { period = 'month' } = req.query;
  const startDate = getDateRange(period as string);
  
  const filteredOrders = db.data.purchaseOrders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate;
  });
  
  const ordersWithItems = filteredOrders.map((order) => ({
    ...order,
    items: db.data.purchaseOrderItems.filter((item) => item.orderId === order.id),
  }));
  
  res.json({
    success: true,
    data: ordersWithItems,
  });
});

router.get('/export/suppliers', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { period = 'month' } = req.query;
  const startDate = getDateRange(period as string);
  
  const supplierData = new Map<string, { name: string; amount: number; count: number }>();
  
  const filteredOrders = db.data.purchaseOrders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startDate && 
           (order.status === 'completed' || order.status === 'approved' || order.status === 'in_transit');
  });
  
  filteredOrders.forEach((order) => {
    const existing = supplierData.get(order.supplierId) || {
      name: order.supplierName,
      amount: 0,
      count: 0,
    };
    supplierData.set(order.supplierId, {
      ...existing,
      amount: existing.amount + order.totalAmount,
      count: existing.count + 1,
    });
  });
  
  const result = Array.from(supplierData.values()).sort((a, b) => b.amount - a.amount);
  
  res.json({
    success: true,
    data: result,
  });
});

router.get('/export/inventory', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { limit = 50 } = req.query;
  
  const result = db.data.medicines
    .map((medicine) => {
      const totalStock = db.data.inventoryBatches
        .filter((b) => b.medicineId === medicine.id)
        .reduce((sum, b) => sum + b.quantity, 0);
      
      const avgMonthlyUsage = medicine.monthlyUsage?.length
        ? medicine.monthlyUsage.reduce((a: number, b: number) => a + b, 0) / medicine.monthlyUsage.length
        : 0;
      
      const turnoverDays = avgMonthlyUsage > 0 
        ? Math.round((totalStock / avgMonthlyUsage) * 30)
        : 0;
      
      return {
        name: medicine.genericName,
        category: medicine.category,
        totalStock,
        avgMonthlyUsage: Math.round(avgMonthlyUsage),
        turnoverDays,
        status: turnoverDays > 60 ? '周转过慢' : turnoverDays > 30 ? '周转正常' : '周转良好',
      };
    })
    .filter((m) => m.totalStock > 0)
    .sort((a, b) => b.turnoverDays - a.turnoverDays)
    .slice(0, Number(limit));
  
  res.json({
    success: true,
    data: result,
  });
});

export default router;
