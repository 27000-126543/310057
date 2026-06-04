import { NavItem } from '../types';

export const navConfig: NavItem[] = [
  {
    key: 'dashboard',
    label: '仪表板',
    icon: 'LayoutDashboard',
    path: '/dashboard',
  },
  {
    key: 'medicines',
    label: '药品管理',
    icon: 'Pill',
    path: '/medicines',
  },
  {
    key: 'suppliers',
    label: '供应商管理',
    icon: 'Building2',
    path: '/suppliers',
  },
  {
    key: 'purchase',
    label: '采购管理',
    icon: 'ShoppingCart',
    path: '/purchase/plans',
    children: [
      { key: 'purchase-plans', label: '采购计划', icon: 'FileSpreadsheet', path: '/purchase/plans' },
      { key: 'purchase-approvals', label: '采购审批', icon: 'CheckSquare', path: '/purchase/approvals' },
      { key: 'purchase-orders', label: '订单跟踪', icon: 'Truck', path: '/purchase/orders' },
    ],
  },
  {
    key: 'warehouse',
    label: '入库管理',
    icon: 'Package',
    path: '/warehouse/receipt',
  },
  {
    key: 'inventory',
    label: '库存管理',
    icon: 'Warehouse',
    path: '/inventory/list',
    children: [
      { key: 'inventory-list', label: '库存查询', icon: 'Search', path: '/inventory/list' },
      { key: 'inventory-expiry', label: '效期预警', icon: 'AlertTriangle', path: '/inventory/expiry' },
    ],
  },
  {
    key: 'prescriptions',
    label: '处方管理',
    icon: 'ClipboardList',
    path: '/prescriptions/review',
    children: [
      { key: 'prescriptions-review', label: '处方审核', icon: 'FileCheck', path: '/prescriptions/review' },
      { key: 'prescriptions-dispense', label: '处方调剂', icon: 'Scan', path: '/prescriptions/dispense' },
    ],
  },
  {
    key: 'monitor',
    label: '温湿度监控',
    icon: 'Thermometer',
    path: '/monitor/realtime',
    children: [
      { key: 'monitor-realtime', label: '实时监控', icon: 'Activity', path: '/monitor/realtime' },
      { key: 'monitor-history', label: '历史数据', icon: 'History', path: '/monitor/history' },
    ],
  },
  {
    key: 'returns',
    label: '退药管理',
    icon: 'RotateCcw',
    path: '/returns/process',
  },
  {
    key: 'statistics',
    label: '统计分析',
    icon: 'BarChart3',
    path: '/statistics/reports',
    children: [
      { key: 'statistics-reports', label: '数据报表', icon: 'FileBarChart', path: '/statistics/reports' },
      { key: 'statistics-visual', label: '可视化大屏', icon: 'Monitor', path: '/statistics/visual' },
    ],
  },
];

export const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_dept: 'bg-blue-100 text-blue-600',
  pending_hospital: 'bg-purple-100 text-purple-600',
  approved: 'bg-green-100 text-green-600',
  rejected: 'bg-red-100 text-red-600',
  in_transit: 'bg-orange-100 text-orange-600',
  completed: 'bg-emerald-100 text-emerald-600',
  pending: 'bg-yellow-100 text-yellow-600',
  reviewed: 'bg-blue-100 text-blue-600',
  dispensing: 'bg-cyan-100 text-cyan-600',
  returned: 'bg-gray-100 text-gray-600',
};

export const statusLabels: Record<string, string> = {
  draft: '草稿',
  pending_dept: '待科室审批',
  pending_hospital: '待院部审批',
  approved: '已批准',
  rejected: '已拒绝',
  in_transit: '在途',
  completed: '已完成',
  pending: '待审核',
  reviewed: '已审核',
  dispensing: '调剂中',
  returned: '已退药',
};

export const storageConditionLabels: Record<string, string> = {
  cold: '冷藏',
  cool: '阴凉',
  normal: '常温',
};
