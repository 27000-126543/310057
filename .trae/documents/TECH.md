# 医院智慧药房与药品供应链管理系统 技术架构

## 1. 架构设计

```mermaid
graph TB
    subgraph "前端应用 (React + TypeScript)"
        A[仪表板]
        B[药品管理]
        C[供应商管理]
        D[采购管理]
        E[入库管理]
        F[库存管理]
        G[处方管理]
        H[温湿度监控]
        I[退药管理]
        J[统计分析]
    end
    
    subgraph "状态管理 (Zustand)"
        K[药品Store]
        L[供应商Store]
        M[采购Store]
        N[库存Store]
        O[处方Store]
        P[监控Store]
    end
    
    subgraph "数据层 (Mock Data + LocalStorage)"
        Q[药品数据]
        R[供应商数据]
        S[采购订单]
        T[库存数据]
        U[处方数据]
        V[监控数据]
    end
    
    subgraph "UI组件库"
        W[ECharts图表]
        X[Lucide图标]
        Y[自定义组件]
    end
    
    A --> K & O & P
    B --> K
    C --> L
    D --> M
    E --> N & K
    F --> N
    G --> O
    H --> P
    I --> N & O
    J --> W
    
    K --> Q
    L --> R
    M --> S
    N --> T
    O --> U
    P --> V
```

## 2. 技术选型

- **前端框架**: React@18 + TypeScript
- **构建工具**: Vite@5
- **样式方案**: TailwindCSS@3
- **状态管理**: Zustand@4
- **路由管理**: React Router@6
- **图表库**: ECharts@5
- **图标库**: lucide-react@0.294
- **UI组件**: 自定义组件库 (基于TailwindCSS)
- **数据持久化**: LocalStorage (Mock数据)
- **代码规范**: ESLint + Prettier

## 3. 路由定义

| 路由 | 页面 | 说明 |
|------|------|------|
| / | 登录页 | 系统登录入口 |
| /dashboard | 仪表板 | 数据概览与实时监控 |
| /medicines | 药品列表 | 药品信息管理 |
| /medicines/:id | 药品详情 | 药品详情与编辑 |
| /suppliers | 供应商列表 | 供应商管理 |
| /suppliers/:id | 供应商详情 | 供应商资质管理 |
| /purchase/plans | 采购计划 | 智能采购计划生成 |
| /purchase/approvals | 采购审批 | 多级审批流程 |
| /purchase/orders | 订单跟踪 | 供应商订单管理 |
| /warehouse/receipt | 到货验收 | 入库验收与储位分配 |
| /inventory/list | 库存查询 | 库存列表与查询 |
| /inventory/expiry | 效期预警 | 近效期药品预警 |
| /prescriptions/review | 处方审核 | 处方审核与校验 |
| /prescriptions/dispense | 处方调剂 | 调剂台发药 |
| /monitor/realtime | 实时监控 | 温湿度实时监控 |
| /monitor/history | 历史数据 | 监控历史记录 |
| /returns/process | 退药处理 | 患者退药管理 |
| /statistics/reports | 统计报表 | 多维度数据统计 |
| /statistics/visual | 可视化大屏 | 药房平面图与热力图 |

## 4. 数据模型

### 4.1 ER图

```mermaid
erDiagram
    MEDICINE ||--o{ INVENTORY_BATCH : has
    MEDICINE ||--o{ PRESCRIPTION_ITEM : includes
    MEDICINE ||--o{ PURCHASE_ITEM : ordered
    SUPPLIER ||--o{ PURCHASE_ORDER : supplies
    SUPPLIER ||--o{ INVENTORY_BATCH : delivers
    PURCHASE_ORDER ||--o{ PURCHASE_ITEM : contains
    PURCHASE_ORDER ||--o{ APPROVAL_RECORD : has
    INVENTORY_BATCH ||--o{ PRESCRIPTION_ITEM : dispensed_from
    PRESCRIPTION ||--o{ PRESCRIPTION_ITEM : contains
    PATIENT ||--o{ PRESCRIPTION : has
    PATIENT ||--o{ RETURN_RECORD : makes
    INVENTORY_BATCH ||--o{ RETURN_RECORD : returned_to
    WAREHOUSE_ZONE ||--o{ INVENTORY_BATCH : stored_in
    WAREHOUSE_ZONE ||--o{ MONITOR_RECORD : monitored
    
    MEDICINE {
        string id PK
        string generic_name
        string trade_name
        string dosage_form
        string specification
        string manufacturer
        string approval_number
        string storage_condition
        boolean is_high_risk
        string category
        decimal min_stock
        decimal max_stock
    }
    
    SUPPLIER {
        string id PK
        string name
        string business_license
        string gsp_certificate
        string supply_scope
        int rating
        date gsp_expiry_date
        string contact
        string phone
    }
    
    PURCHASE_ORDER {
        string id PK
        string supplier_id FK
        string status
        date plan_date
        decimal total_amount
        string created_by
        date created_at
    }
    
    PURCHASE_ITEM {
        string id PK
        string order_id FK
        string medicine_id FK
        int quantity
        decimal unit_price
        decimal subtotal
    }
    
    APPROVAL_RECORD {
        string id PK
        string order_id FK
        int level
        string approver
        string opinion
        string status
        date approved_at
    }
    
    INVENTORY_BATCH {
        string id PK
        string medicine_id FK
        string supplier_id FK
        string batch_number
        date production_date
        date expiry_date
        int quantity
        string zone_id FK
        string location
        date received_at
    }
    
    PRESCRIPTION {
        string id PK
        string patient_id FK
        string patient_name
        int patient_age
        string department
        string doctor
        string status
        date created_at
    }
    
    PRESCRIPTION_ITEM {
        string id PK
        string prescription_id FK
        string medicine_id FK
        string batch_id FK
        int quantity
        string dosage
        string frequency
    }
    
    RETURN_RECORD {
        string id PK
        string patient_id FK
        string batch_id FK
        int quantity
        string reason
        boolean package_intact
        date returned_at
    }
    
    WAREHOUSE_ZONE {
        string id PK
        string name
        string type
        decimal min_temp
        decimal max_temp
        decimal min_humidity
        decimal max_humidity
    }
    
    MONITOR_RECORD {
        string id PK
        string zone_id FK
        decimal temperature
        decimal humidity
        boolean is_alert
        datetime recorded_at
    }
```

### 4.2 类型定义

```typescript
// 药品类型
interface Medicine {
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
}

// 供应商类型
interface Supplier {
  id: string;
  name: string;
  businessLicense: string;
  gspCertificate: string;
  supplyScope: string[];
  rating: number;
  gspExpiryDate: string;
  contact: string;
  phone: string;
}

// 采购订单类型
interface PurchaseOrder {
  id: string;
  supplierId: string;
  status: 'draft' | 'pending_dept' | 'pending_hospital' | 'approved' | 'rejected' | 'in_transit' | 'completed';
  planDate: string;
  totalAmount: number;
  items: PurchaseItem[];
  approvals: ApprovalRecord[];
  createdBy: string;
  createdAt: string;
}

// 库存批次类型
interface InventoryBatch {
  id: string;
  medicineId: string;
  supplierId: string;
  batchNumber: string;
  productionDate: string;
  expiryDate: string;
  quantity: number;
  zoneId: string;
  location: string;
  receivedAt: string;
}

// 处方类型
interface Prescription {
  id: string;
  patientName: string;
  patientAge: number;
  department: string;
  doctor: string;
  items: PrescriptionItem[];
  status: 'pending' | 'reviewed' | 'dispensing' | 'completed' | 'returned';
  warnings: PrescriptionWarning[];
  createdAt: string;
}

// 库区类型
interface WarehouseZone {
  id: string;
  name: string;
  type: 'cold' | 'cool' | 'normal' | 'high_risk';
  minTemp: number;
  maxTemp: number;
  minHumidity: number;
  maxHumidity: number;
  currentTemp: number;
  currentHumidity: number;
}
```

## 5. 项目结构

```
/
├── src/
│   ├── components/          # 通用组件
│   │   ├── layout/         # 布局组件
│   │   ├── form/           # 表单组件
│   │   ├── table/          # 表格组件
│   │   └── charts/         # 图表组件
│   ├── pages/              # 页面组件
│   │   ├── dashboard/
│   │   ├── medicines/
│   │   ├── suppliers/
│   │   ├── purchase/
│   │   ├── warehouse/
│   │   ├── inventory/
│   │   ├── prescriptions/
│   │   ├── monitor/
│   │   ├── returns/
│   │   └── statistics/
│   ├── stores/             # Zustand状态管理
│   │   ├── medicineStore.ts
│   │   ├── supplierStore.ts
│   │   ├── purchaseStore.ts
│   │   ├── inventoryStore.ts
│   │   ├── prescriptionStore.ts
│   │   └── monitorStore.ts
│   ├── utils/              # 工具函数
│   │   ├── validation.ts   # 校验逻辑（配伍禁忌等）
│   │   ├── storage.ts      # 本地存储
│   │   └── mock.ts         # Mock数据生成
│   ├── types/              # TypeScript类型定义
│   ├── assets/             # 静态资源
│   ├── App.tsx             # 应用入口
│   ├── main.tsx            # 渲染入口
│   └── index.css           # 全局样式
├── api/                    # 后端API（预留）
├── shared/                 # 共享类型
├── public/                 # 公共资源
├── .trae/
│   └── documents/         # 项目文档
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 6. 核心算法

### 6.1 智能采购计划生成算法
```typescript
// 基于历史用量预测 + 库存周转率 + 效期预警
function generatePurchasePlan(medicine: Medicine, history: UsageHistory[], inventory: InventoryBatch[]): PurchaseItem {
  // 1. 用量预测（移动加权平均）
  const predictedUsage = calculateWeightedAverage(history);
  
  // 2. 库存周转率分析
  const turnoverRate = calculateTurnoverRate(inventory, history);
  
  // 3. 效期预警（近效期库存不计入可用库存）
  const validStock = calculateValidStock(inventory);
  
  // 4. 计算建议采购量
  const suggestedQuantity = Math.max(
    0,
    predictedUsage * (1 + SAFETY_STOCK_RATIO) - validStock
  );
  
  return { medicineId: medicine.id, quantity: suggestedQuantity };
}
```

### 6.2 配伍禁忌校验算法
```typescript
function checkCompatibility(items: PrescriptionItem[], medicines: Medicine[]): CompatibilityWarning[] {
  const warnings: CompatibilityWarning[] = [];
  
  // 检查药物相互作用
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const conflict = findConflict(items[i].medicineId, items[j].medicineId);
      if (conflict) {
        warnings.push({
          type: 'conflict',
          medicines: [items[i].medicineName, items[j].medicineName],
          severity: conflict.severity,
          description: conflict.description
        });
      }
    }
  }
  
  // 检查重复用药（同一药理分类）
  const duplicates = findDuplicateCategories(items, medicines);
  warnings.push(...duplicates);
  
  return warnings;
}
```

### 6.3 智能储位分配算法
```typescript
function allocateStorage(medicine: Medicine, batch: InventoryBatch): StorageLocation {
  // 1. 高警示药品优先分配到单独货位
  if (medicine.isHighRisk) {
    return findHighRiskLocation();
  }
  
  // 2. 根据储存条件分配库区
  const zoneType = medicine.storageCondition;
  
  // 3. 先进先出（FIFO）原则分配货位
  return findFIFOLocation(zoneType, batch.productionDate);
}
```
