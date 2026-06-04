export interface Medicine {
  id: string;
  genericName: string;
  tradeName: string;
  dosageForm: string;
  specification: string;
  manufacturer: string;
  approvalNumber: string;
  storageCondition: 'cold' | 'cool' | 'normal';
  isHighRisk: boolean;
  category: string;
  minStock: number;
  maxStock: number;
  unit: string;
  price: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  businessLicense: string;
  gspCertificate: string;
  supplyScope: string[];
  rating: number;
  gspExpiryDate: string;
  contact: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ApprovalRecord {
  id: string;
  level: 1 | 2;
  approver: string;
  approverRole: string;
  opinion: string;
  status: 'approved' | 'rejected' | 'pending';
  approvedAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNo: string;
  supplierId: string;
  supplierName: string;
  status: 'draft' | 'pending_dept' | 'pending_hospital' | 'approved' | 'rejected' | 'in_transit' | 'completed';
  planDate: string;
  totalAmount: number;
  items: PurchaseItem[];
  approvals: ApprovalRecord[];
  createdBy: string;
  createdAt: string;
  estimatedDelivery?: string;
}

export interface InventoryBatch {
  id: string;
  medicineId: string;
  medicineName: string;
  supplierId: string;
  supplierName: string;
  batchNumber: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
  initialQuantity: number;
  zoneId: string;
  zoneName: string;
  location: string;
  receivedAt: string;
  receivedBy: string;
}

export interface PrescriptionWarning {
  type: 'conflict' | 'duplicate' | 'dosage' | 'age';
  severity: 'high' | 'medium' | 'low';
  medicines: string[];
  description: string;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineName: string;
  specification: string;
  batchId?: string;
  batchNumber?: string;
  quantity: number;
  dosage: string;
  frequency: string;
  days: number;
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'male' | 'female';
  department: string;
  doctor: string;
  items: PrescriptionItem[];
  status: 'pending' | 'reviewed' | 'dispensing' | 'completed' | 'returned';
  warnings: PrescriptionWarning[];
  dispatcher?: string;
  reviewer?: string;
  floorStation?: string;
  createdAt: string;
  dispensedAt?: string;
}

export interface WarehouseZone {
  id: string;
  name: string;
  type: 'cold' | 'cool' | 'normal' | 'high_risk';
  minTemp: number;
  maxTemp: number;
  minHumidity: number;
  maxHumidity: number;
  currentTemp: number;
  currentHumidity: number;
  capacity: number;
  used: number;
  location: string;
}

export interface MonitorRecord {
  id: string;
  zoneId: string;
  zoneName: string;
  temperature: number;
  humidity: number;
  isAlert: boolean;
  alertType?: 'temp' | 'humidity' | 'both';
  recordedAt: string;
  handledBy?: string;
  handledAt?: string;
  handled?: boolean;
}

export interface ReturnRecord {
  id: string;
  returnNo: string;
  prescriptionId: string;
  prescriptionNo: string;
  patientId: string;
  patientName: string;
  items: {
    batchId: string;
    medicineName: string;
    batchNumber: string;
    quantity: number;
    packageIntact: boolean;
  }[];
  reason: string;
  operator: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  completedAt?: string;
}

export interface StatisticData {
  date: string;
  purchaseAmount: number;
  salesAmount: number;
  inventoryCount: number;
  turnoverDays: number;
  expiryLossRate: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'pharmacy_admin' | 'purchase' | 'dept_director' | 'hospital_director' | 'dispenser' | 'duty_pharmacist';
  roleName: string;
  department: string;
  avatar?: string;
}

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  children?: NavItem[];
  roles?: string[];
}
