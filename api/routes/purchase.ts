import { Router, type Request, type Response } from 'express';
import { db, generateId } from '../db/index.js';

const router = Router();

function calculatePurchasePlan(medicine: any, inventoryBatches: any[]) {
  const monthlyUsage = medicine.monthlyUsage || [100, 100, 100, 100, 100, 100];
  const avgUsage = monthlyUsage.reduce((a: number, b: number) => a + b, 0) / monthlyUsage.length;
  const trendFactor = monthlyUsage.length >= 2 
    ? monthlyUsage[monthlyUsage.length - 1] / monthlyUsage[0] 
    : 1;
  const adjustedAvgUsage = avgUsage * trendFactor;
  const safetyStock = adjustedAvgUsage * 0.3;
  
  const currentStock = inventoryBatches
    .filter((b) => b.medicineId === medicine.id)
    .reduce((sum: number, b) => sum + b.quantity, 0);
  
  const now = new Date();
  const ninetyDaysLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const nearExpiryStock = inventoryBatches
    .filter((b) => b.medicineId === medicine.id && new Date(b.expiryDate) <= ninetyDaysLater)
    .reduce((sum: number, b) => sum + b.quantity, 0);
  
  const criticalExpiryStock = inventoryBatches
    .filter((b) => b.medicineId === medicine.id && new Date(b.expiryDate) <= thirtyDaysLater)
    .reduce((sum: number, b) => sum + b.quantity, 0);
  
  const availableStock = Math.max(0, currentStock - criticalExpiryStock - nearExpiryStock * 0.5);
  
  let suggestedQuantity = Math.ceil(adjustedAvgUsage * 1.5 + safetyStock - availableStock);
  
  const turnoverRate = medicine.turnoverRate || 5;
  if (turnoverRate < 3) suggestedQuantity = Math.ceil(suggestedQuantity * 0.7);
  else if (turnoverRate > 8) suggestedQuantity = Math.ceil(suggestedQuantity * 1.3);
  
  suggestedQuantity = Math.max(0, suggestedQuantity);
  
  const reasons: string[] = [];
  reasons.push(`月均用量: ${Math.round(avgUsage)}`);
  reasons.push(`趋势因子: ${trendFactor.toFixed(2)}x`);
  reasons.push(`安全库存: ${Math.round(safetyStock)}`);
  reasons.push(`当前库存: ${currentStock}`);
  reasons.push(`近效期库存: ${nearExpiryStock}(90天内)`);
  reasons.push(`周转率: ${turnoverRate.toFixed(1)}`);
  if (turnoverRate < 3) reasons.push('周转率<3，采购量×0.7');
  if (turnoverRate > 8) reasons.push('周转率>8，采购量×1.3');
  
  return {
    medicineId: medicine.id,
    medicineName: medicine.genericName,
    currentStock,
    avgMonthlyUsage: Math.round(avgUsage),
    safetyStock: Math.round(safetyStock),
    nearExpiryStock,
    turnoverRate: turnoverRate.toFixed(1),
    suggestedQuantity,
    unitPrice: medicine.price || 0,
    subtotal: Math.round(suggestedQuantity * (medicine.price || 0)),
    reason: reasons.join(' | '),
  };
}

router.get('/plan/generate', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { medicines, inventoryBatches } = db.data;
  
  const plan = medicines
    .map((med) => calculatePurchasePlan(med, inventoryBatches))
    .filter((item) => item.suggestedQuantity > 0)
    .sort((a, b) => b.subtotal - a.subtotal);
  
  res.json({
    success: true,
    data: plan,
    totalAmount: plan.reduce((sum, item) => sum + item.subtotal, 0),
  });
});

router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { status } = req.query;
  
  let orders = db.data.purchaseOrders;
  if (status) {
    orders = orders.filter((o) => o.status === status);
  }
  
  const ordersWithItems = orders.map((order) => ({
    ...order,
    items: db.data.purchaseOrderItems.filter((item) => item.orderId === order.id),
  }));
  
  res.json({
    success: true,
    data: ordersWithItems,
  });
});

router.get('/orders/:id', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { id } = req.params;
  
  const order = db.data.purchaseOrders.find((o) => o.id === id);
  if (!order) {
    res.status(404).json({ success: false, error: '采购单不存在' });
    return;
  }
  
  const items = db.data.purchaseOrderItems.filter((item) => item.orderId === id);
  
  res.json({
    success: true,
    data: { ...order, items },
  });
});

router.post('/orders', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { supplierId, supplierName, items, createdBy } = req.body;
  
  const orderId = generateId('PO', 6);
  const totalAmount = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
  
  const newOrder = {
    id: orderId,
    orderNo: `PO${Date.now().toString().slice(-8)}`,
    supplierId,
    supplierName,
    totalAmount,
    status: 'pending_dept',
    createdBy: createdBy || '系统',
    approvedByDept: null,
    approvedByHospital: null,
    approvalOpinions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const orderItems = items.map((item: any, index: number) => ({
    id: generateId('POI', 4),
    orderId,
    sortOrder: index,
    ...item,
  }));
  
  db.data.purchaseOrders.push(newOrder);
  db.data.purchaseOrderItems.push(...orderItems);
  await db.write();
  
  res.json({
    success: true,
    data: { ...newOrder, items: orderItems },
  });
});

router.post('/orders/:id/approve', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { id } = req.params;
  const { level, approvedBy, opinion, approved } = req.body;
  
  const orderIndex = db.data.purchaseOrders.findIndex((o) => o.id === id);
  if (orderIndex === -1) {
    res.status(404).json({ success: false, error: '采购单不存在' });
    return;
  }
  
  const order = db.data.purchaseOrders[orderIndex];
  
  if (!approved) {
    order.status = 'rejected';
    order.updatedAt = new Date().toISOString();
    order.approvalOpinions = [
      ...(order.approvalOpinions || []),
      {
        level,
        approvedBy,
        opinion,
        approved: false,
        timestamp: new Date().toISOString(),
      },
    ];
    await db.write();
    
    res.json({
      success: true,
      data: { ...order, items: db.data.purchaseOrderItems.filter((i) => i.orderId === id) },
    });
    return;
  }
  
  if (level === 1) {
    if (order.status !== 'pending_dept') {
      res.status(400).json({ success: false, error: '当前状态不允许审批' });
      return;
    }
    order.status = 'pending_hospital';
    order.approvedByDept = approvedBy;
  } else if (level === 2) {
    if (order.status !== 'pending_hospital') {
      res.status(400).json({ success: false, error: '当前状态不允许审批' });
      return;
    }
    order.status = 'approved';
    order.approvedByHospital = approvedBy;
  }
  
  order.approvalOpinions = [
    ...(order.approvalOpinions || []),
    {
      level,
      approvedBy,
      opinion,
      approved: true,
      timestamp: new Date().toISOString(),
    },
  ];
  order.updatedAt = new Date().toISOString();
  
  await db.write();
  
  res.json({
    success: true,
    data: { ...order, items: db.data.purchaseOrderItems.filter((i) => i.orderId === id) },
  });
});

router.post('/orders/:id/send', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { id } = req.params;
  
  const orderIndex = db.data.purchaseOrders.findIndex((o) => o.id === id);
  if (orderIndex === -1) {
    res.status(404).json({ success: false, error: '采购单不存在' });
    return;
  }
  
  const order = db.data.purchaseOrders[orderIndex];
  if (order.status !== 'approved') {
    res.status(400).json({ success: false, error: '只有已批准的采购单才能发送' });
    return;
  }
  
  order.status = 'in_transit';
  order.updatedAt = new Date().toISOString();
  
  await db.write();
  
  console.log(`[订单通知] 已向供应商 ${order.supplierName} 发送订货通知`);
  
  res.json({
    success: true,
    data: { ...order, items: db.data.purchaseOrderItems.filter((i) => i.orderId === id) },
    message: `已向供应商 ${order.supplierName} 发送订货通知`,
  });
});

router.post('/orders/:id/receive', async (req: Request, res: Response): Promise<void> => {
  await db.read();
  const { id } = req.params;
  const { receivedBy } = req.body;
  
  const orderIndex = db.data.purchaseOrders.findIndex((o) => o.id === id);
  if (orderIndex === -1) {
    res.status(404).json({ success: false, error: '采购单不存在' });
    return;
  }
  
  const order = db.data.purchaseOrders[orderIndex];
  if (order.status !== 'in_transit') {
    res.status(400).json({ success: false, error: '只有在途的采购单才能确认收货' });
    return;
  }
  
  order.status = 'completed';
  order.updatedAt = new Date().toISOString();
  
  const items = db.data.purchaseOrderItems.filter((i) => i.orderId === id);
  items.forEach((item) => {
    const existingBatch = db.data.inventoryBatches.find(
      (b) => b.medicineId === item.medicineId && b.status === 'normal'
    );
    if (existingBatch) {
      existingBatch.quantity += item.quantity;
    } else {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 12);
      db.data.inventoryBatches.push({
        id: generateId('BATCH', 6),
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        batchNo: `B${Date.now().toString().slice(-8)}`,
        manufactureDate: new Date().toISOString().split('T')[0],
        expiryDate: expiryDate.toISOString().split('T')[0],
        quantity: item.quantity,
        location: 'ZONE0004',
        receivedBy: receivedBy || '系统',
        status: 'normal',
        createdAt: new Date().toISOString(),
      });
    }
  });
  
  await db.write();
  
  res.json({
    success: true,
    data: { ...order, items },
    message: '收货确认完成，库存已更新',
  });
});

export default router;
