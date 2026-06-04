import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Medicine,
  Supplier,
  PurchaseOrder,
  InventoryBatch,
  Prescription,
  WarehouseZone,
  MonitorRecord,
  ReturnRecord,
  User,
} from '../types';
import {
  generateMedicines,
  generateSuppliers,
  generatePurchaseOrders,
  generateInventoryBatches,
  generatePrescriptions,
  generateWarehouseZones,
  generateMonitorRecords,
  generateReturnRecords,
  getDemoUsers,
} from '../utils/mockData';

interface AppState {
  user: User | null;
  medicines: Medicine[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  inventoryBatches: InventoryBatch[];
  prescriptions: Prescription[];
  warehouseZones: WarehouseZone[];
  monitorRecords: MonitorRecord[];
  returnRecords: ReturnRecord[];
  users: User[];
  sidebarCollapsed: boolean;
  isInitialized: boolean;

  login: (username: string, password: string) => boolean;
  logout: () => void;
  setUser: (user: User) => void;
  toggleSidebar: () => void;

  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt'>) => void;
  updateMedicine: (id: string, medicine: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'createdAt'>) => void;
  updatePurchaseOrder: (id: string, order: Partial<PurchaseOrder>) => void;
  approvePurchaseOrder: (orderId: string, level: 1 | 2, approver: string, opinion: string, status: 'approved' | 'rejected') => void;

  addInventoryBatch: (batch: Omit<InventoryBatch, 'id' | 'receivedAt'>) => void;
  updateInventoryBatch: (id: string, batch: Partial<InventoryBatch>) => void;
  deductInventory: (batchId: string, quantity: number) => void;

  addPrescription: (prescription: Omit<Prescription, 'id' | 'createdAt'>) => void;
  updatePrescription: (id: string, prescription: Partial<Prescription>) => void;
  reviewPrescription: (id: string, reviewer: string, status: 'reviewed' | 'rejected') => void;
  dispensePrescription: (id: string, dispatcher: string, batchAssignments: { itemId: string; batchId: string; batchNumber: string }[]) => void;

  updateMonitorData: (zoneId: string, temperature: number, humidity: number) => void;
  addMonitorRecord: (record: Omit<MonitorRecord, 'id'>) => void;
  handleAlert: (recordId: string, handler: string) => void;

  addReturnRecord: (record: Omit<ReturnRecord, 'id' | 'createdAt'>) => void;
  updateReturnRecord: (id: string, record: Partial<ReturnRecord>) => void;
  approveReturn: (id: string, operator: string) => void;

  initializeData: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const formatDateTime = (date: Date) => date.toISOString();

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      medicines: [],
      suppliers: [],
      purchaseOrders: [],
      inventoryBatches: [],
      prescriptions: [],
      warehouseZones: [],
      monitorRecords: [],
      returnRecords: [],
      users: [],
      sidebarCollapsed: false,
      isInitialized: false,

      login: (username: string, password: string) => {
        const users = getDemoUsers();
        const user = users.find(u => u.username === username);
        if (user && password === '123456') {
          set({ user });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ user: null });
      },

      setUser: (user: User) => set({ user }),

      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      addMedicine: (medicine) => {
        const newMedicine: Medicine = {
          ...medicine,
          id: generateId(),
          createdAt: formatDate(new Date()),
        };
        set(state => ({ medicines: [...state.medicines, newMedicine] }));
      },

      updateMedicine: (id, medicine) => {
        set(state => ({
          medicines: state.medicines.map(m => (m.id === id ? { ...m, ...medicine } : m)),
        }));
      },

      deleteMedicine: (id) => {
        set(state => ({
          medicines: state.medicines.filter(m => m.id !== id),
        }));
      },

      addSupplier: (supplier) => {
        const newSupplier: Supplier = {
          ...supplier,
          id: generateId(),
          createdAt: formatDate(new Date()),
        };
        set(state => ({ suppliers: [...state.suppliers, newSupplier] }));
      },

      updateSupplier: (id, supplier) => {
        set(state => ({
          suppliers: state.suppliers.map(s => (s.id === id ? { ...s, ...supplier } : s)),
        }));
      },

      deleteSupplier: (id) => {
        set(state => ({
          suppliers: state.suppliers.filter(s => s.id !== id),
        }));
      },

      addPurchaseOrder: (order) => {
        const newOrder: PurchaseOrder = {
          ...order,
          id: generateId(),
          createdAt: formatDate(new Date()),
        };
        set(state => ({ purchaseOrders: [...state.purchaseOrders, newOrder] }));
      },

      updatePurchaseOrder: (id, order) => {
        set(state => ({
          purchaseOrders: state.purchaseOrders.map(o => (o.id === id ? { ...o, ...order } : o)),
        }));
      },

      approvePurchaseOrder: (orderId, level, approver, opinion, status) => {
        set(state => {
          const order = state.purchaseOrders.find(o => o.id === orderId);
          if (!order) return state;

          const newApproval = {
            id: generateId(),
            level,
            approver,
            approverRole: level === 1 ? '药学部主任' : '分管院长',
            opinion,
            status,
            approvedAt: formatDateTime(new Date()),
          };

          let newStatus = order.status;
          if (status === 'rejected') {
            newStatus = 'rejected';
          } else if (level === 1) {
            newStatus = 'pending_hospital';
          } else if (level === 2) {
            newStatus = 'approved';
          }

          return {
            purchaseOrders: state.purchaseOrders.map(o =>
              o.id === orderId
                ? { ...o, approvals: [...o.approvals, newApproval], status: newStatus }
                : o
            ),
          };
        });
      },

      addInventoryBatch: (batch) => {
        const newBatch: InventoryBatch = {
          ...batch,
          id: generateId(),
          receivedAt: formatDateTime(new Date()),
        };
        set(state => ({ inventoryBatches: [...state.inventoryBatches, newBatch] }));
      },

      updateInventoryBatch: (id, batch) => {
        set(state => ({
          inventoryBatches: state.inventoryBatches.map(b => (b.id === id ? { ...b, ...batch } : b)),
        }));
      },

      deductInventory: (batchId, quantity) => {
        set(state => ({
          inventoryBatches: state.inventoryBatches.map(b =>
            b.id === batchId ? { ...b, quantity: Math.max(0, b.quantity - quantity) } : b
          ),
        }));
      },

      addPrescription: (prescription) => {
        const newPrescription: Prescription = {
          ...prescription,
          id: generateId(),
          createdAt: formatDateTime(new Date()),
        };
        set(state => ({ prescriptions: [...state.prescriptions, newPrescription] }));
      },

      updatePrescription: (id, prescription) => {
        set(state => ({
          prescriptions: state.prescriptions.map(p => (p.id === id ? { ...p, ...prescription } : p)),
        }));
      },

      reviewPrescription: (id, reviewer, status) => {
        set(state => ({
          prescriptions: state.prescriptions.map(p =>
            p.id === id ? { ...p, status: status === 'reviewed' ? 'reviewed' : p.status, reviewer } : p
          ),
        }));
      },

      dispensePrescription: (id, dispatcher, batchAssignments) => {
        set(state => {
          const prescription = state.prescriptions.find(p => p.id === id);
          if (!prescription) return state;

          const updatedItems = prescription.items.map(item => {
            const assignment = batchAssignments.find(a => a.itemId === item.id);
            if (assignment) {
              return { ...item, batchId: assignment.batchId, batchNumber: assignment.batchNumber };
            }
            return item;
          });

          batchAssignments.forEach(assignment => {
            const item = prescription.items.find(i => i.id === assignment.itemId);
            if (item) {
              get().deductInventory(assignment.batchId, item.quantity);
            }
          });

          return {
            prescriptions: state.prescriptions.map(p =>
              p.id === id
                ? { ...p, items: updatedItems, status: 'completed', dispatcher, dispensedAt: formatDateTime(new Date()) }
                : p
            ),
          };
        });
      },

      updateMonitorData: (zoneId, temperature, humidity) => {
        set(state => ({
          warehouseZones: state.warehouseZones.map(z =>
            z.id === zoneId ? { ...z, currentTemp: temperature, currentHumidity: humidity } : z
          ),
        }));
      },

      addMonitorRecord: (record) => {
        const newRecord: MonitorRecord = {
          ...record,
          id: generateId(),
        };
        set(state => ({ monitorRecords: [newRecord, ...state.monitorRecords].slice(0, 1000) }));
      },

      handleAlert: (recordId, handler) => {
        set(state => ({
          monitorRecords: state.monitorRecords.map(r =>
            r.id === recordId ? { ...r, handled: true, handledBy: handler, handledAt: formatDateTime(new Date()) } : r
          ),
        }));
      },

      addReturnRecord: (record) => {
        const newRecord: ReturnRecord = {
          ...record,
          id: generateId(),
          createdAt: formatDateTime(new Date()),
        };
        set(state => ({ returnRecords: [...state.returnRecords, newRecord] }));
      },

      updateReturnRecord: (id, record) => {
        set(state => ({
          returnRecords: state.returnRecords.map(r => (r.id === id ? { ...r, ...record } : r)),
        }));
      },

      approveReturn: (id, operator) => {
        set(state => {
          const record = state.returnRecords.find(r => r.id === id);
          if (!record) return state;

          record.items.forEach(item => {
            if (item.packageIntact) {
              const batch = state.inventoryBatches.find(b => b.id === item.batchId);
              if (batch) {
                get().updateInventoryBatch(item.batchId, { quantity: batch.quantity + item.quantity });
              }
            }
          });

          return {
            returnRecords: state.returnRecords.map(r =>
              r.id === id ? { ...r, status: 'completed', operator, completedAt: formatDateTime(new Date()) } : r
            ),
          };
        });
      },

      initializeData: () => {
        if (get().isInitialized) return;

        const medicines = generateMedicines();
        const suppliers = generateSuppliers();
        const warehouseZones = generateWarehouseZones();
        const purchaseOrders = generatePurchaseOrders(medicines, suppliers);
        const inventoryBatches = generateInventoryBatches(medicines, suppliers);
        const prescriptions = generatePrescriptions(medicines);
        const monitorRecords = generateMonitorRecords(warehouseZones);
        const returnRecords = generateReturnRecords(prescriptions, inventoryBatches);
        const users = getDemoUsers();

        set({
          medicines,
          suppliers,
          purchaseOrders,
          inventoryBatches,
          prescriptions,
          warehouseZones,
          monitorRecords,
          returnRecords,
          users,
          isInitialized: true,
        });
      },
    }),
    {
      name: 'pharmacy-storage',
      partialize: state => ({
        user: state.user,
        medicines: state.medicines,
        suppliers: state.suppliers,
        purchaseOrders: state.purchaseOrders,
        inventoryBatches: state.inventoryBatches,
        prescriptions: state.prescriptions,
        warehouseZones: state.warehouseZones,
        monitorRecords: state.monitorRecords.slice(0, 100),
        returnRecords: state.returnRecords,
        isInitialized: state.isInitialized,
      }),
    }
  )
);
