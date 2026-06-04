import { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  X,
  Pill,
  AlertTriangle,
  Check,
  Snowflake,
  Sun,
  ThermometerSun,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { Medicine } from '../types';
import { storageConditionLabels } from '../config/navConfig';
import { checkStockStatus } from '../utils/validation';

export const Medicines = () => {
  const { medicines, inventoryBatches, addMedicine, updateMedicine, deleteMedicine } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [viewingMedicine, setViewingMedicine] = useState<Medicine | null>(null);

  const categories = [...new Set(medicines.map(m => m.category))];

  const filteredMedicines = medicines.filter(m => {
    const matchesSearch =
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.approvalNumber.includes(searchQuery);
    const matchesCategory = !categoryFilter || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStockInfo = (medicineId: string) => {
    const batches = inventoryBatches.filter(b => b.medicineId === medicineId);
    const total = batches.reduce((sum, b) => sum + b.quantity, 0);
    return { total, batches };
  };

  const [formData, setFormData] = useState<Omit<Medicine, 'id' | 'createdAt'>>({
    genericName: '',
    tradeName: '',
    dosageForm: '片剂',
    specification: '',
    manufacturer: '',
    approvalNumber: '',
    storageCondition: 'normal' as Medicine['storageCondition'],
    isHighRisk: false,
    category: '',
    minStock: 50,
    maxStock: 500,
    unit: '盒',
    price: 0,
    monthlyUsage: [0, 0, 0, 0, 0, 0],
    turnoverRate: 5.0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMedicine) {
      updateMedicine(editingMedicine.id, formData);
    } else {
      addMedicine(formData);
    }
    setShowModal(false);
    setEditingMedicine(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      genericName: '',
      tradeName: '',
      dosageForm: '片剂',
      specification: '',
      manufacturer: '',
      approvalNumber: '',
      storageCondition: 'normal',
      isHighRisk: false,
      category: '',
      minStock: 50,
      maxStock: 500,
      unit: '盒',
      price: 0,
      monthlyUsage: [0, 0, 0, 0, 0, 0],
      turnoverRate: 5.0,
    });
  };

  const openEditModal = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      genericName: medicine.genericName,
      tradeName: medicine.tradeName,
      dosageForm: medicine.dosageForm,
      specification: medicine.specification,
      manufacturer: medicine.manufacturer,
      approvalNumber: medicine.approvalNumber,
      storageCondition: medicine.storageCondition,
      isHighRisk: medicine.isHighRisk,
      category: medicine.category,
      minStock: medicine.minStock,
      maxStock: medicine.maxStock,
      unit: medicine.unit,
      price: medicine.price,
      monthlyUsage: medicine.monthlyUsage || [0, 0, 0, 0, 0, 0],
      turnoverRate: medicine.turnoverRate || 5.0,
    });
    setShowModal(true);
  };

  const StorageIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'cold':
        return <Snowflake className="w-4 h-4 text-blue-500" />;
      case 'cool':
        return <ThermometerSun className="w-4 h-4 text-cyan-500" />;
      default:
        return <Sun className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">药品信息管理</h1>
          <p className="text-gray-500 mt-1">管理药品基础信息、分类和储存要求</p>
        </div>
        <button
          onClick={() => {
            setEditingMedicine(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          新增药品
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索通用名、商品名或批准文号..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部类别</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          {categoryFilter && (
            <button
              onClick={() => setCategoryFilter('')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                药品信息
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                剂型规格
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                生产厂家
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                库存
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                储存条件
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredMedicines.map(medicine => {
              const stockInfo = getStockInfo(medicine.id);
              const stockStatus = checkStockStatus(stockInfo.total, medicine.minStock, medicine.maxStock);

              return (
                <tr key={medicine.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          medicine.isHighRisk ? 'bg-red-100' : 'bg-blue-100'
                        }`}
                      >
                        <Pill
                          className={`w-5 h-5 ${medicine.isHighRisk ? 'text-red-600' : 'text-blue-600'}`}
                        />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">{medicine.genericName}</p>
                        <p className="text-sm text-gray-500">{medicine.tradeName}</p>
                      </div>
                      {medicine.isHighRisk && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          高警示
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{medicine.dosageForm}</p>
                    <p className="text-sm text-gray-500">{medicine.specification}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{medicine.manufacturer}</p>
                    <p className="text-sm text-gray-500">{medicine.approvalNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span
                        className={`font-semibold ${
                          stockStatus === 'low' || stockStatus === 'empty'
                            ? 'text-red-600'
                            : stockStatus === 'high'
                            ? 'text-amber-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {stockInfo.total}
                      </span>
                      <span className="text-gray-500 ml-1">{medicine.unit}</span>
                      {(stockStatus === 'low' || stockStatus === 'empty') && (
                        <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <StorageIcon type={medicine.storageCondition} />
                      <span className="ml-2 text-gray-700">
                        {storageConditionLabels[medicine.storageCondition]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        stockStatus === 'normal'
                          ? 'bg-green-100 text-green-700'
                          : stockStatus === 'low'
                          ? 'bg-amber-100 text-amber-700'
                          : stockStatus === 'high'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {stockStatus === 'normal'
                        ? '正常'
                        : stockStatus === 'low'
                        ? '库存不足'
                        : stockStatus === 'high'
                        ? '库存过高'
                        : '缺货'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingMedicine(medicine)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(medicine)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('确定删除该药品信息吗？')) {
                            deleteMedicine(medicine.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredMedicines.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>未找到匹配的药品</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingMedicine ? '编辑药品' : '新增药品'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingMedicine(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    通用名称 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.genericName}
                    onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入通用名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名称
                  </label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={e => setFormData({ ...formData, tradeName: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入商品名称"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">剂型 *</label>
                  <select
                    required
                    value={formData.dosageForm}
                    onChange={e => setFormData({ ...formData, dosageForm: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="片剂">片剂</option>
                    <option value="胶囊剂">胶囊剂</option>
                    <option value="注射剂">注射剂</option>
                    <option value="口服液">口服液</option>
                    <option value="颗粒剂">颗粒剂</option>
                    <option value="软膏剂">软膏剂</option>
                    <option value="吸入剂">吸入剂</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">规格 *</label>
                  <input
                    type="text"
                    required
                    value={formData.specification}
                    onChange={e => setFormData({ ...formData, specification: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：10mg*20片"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生产厂家 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.manufacturer}
                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入生产厂家"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    批准文号 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.approvalNumber}
                    onChange={e => setFormData({ ...formData, approvalNumber: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="国药准字HXXXXXXXX"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    储存条件 *
                  </label>
                  <select
                    required
                    value={formData.storageCondition}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        storageCondition: e.target.value as Medicine['storageCondition'],
                      })
                    }
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">常温储存</option>
                    <option value="cool">阴凉储存</option>
                    <option value="cold">冷藏储存 (2-8°C)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类 *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：抗生素、心血管、消化系统"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最低库存 *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minStock}
                    onChange={e =>
                      setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最高库存 *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.maxStock}
                    onChange={e =>
                      setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">单价 (元)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={e =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isHighRisk"
                  checked={formData.isHighRisk}
                  onChange={e => setFormData({ ...formData, isHighRisk: e.target.checked })}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="isHighRisk" className="ml-2 text-sm text-gray-700">
                  标记为高警示药品（需双人复核）
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMedicine(null);
                  }}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {editingMedicine ? '保存修改' : '添加药品'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">药品详情</h2>
              <button
                onClick={() => setViewingMedicine(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                    viewingMedicine.isHighRisk ? 'bg-red-100' : 'bg-blue-100'
                  }`}
                >
                  <Pill
                    className={`w-8 h-8 ${viewingMedicine.isHighRisk ? 'text-red-600' : 'text-blue-600'}`}
                  />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">{viewingMedicine.genericName}</h3>
                  <p className="text-gray-500">{viewingMedicine.tradeName}</p>
                  {viewingMedicine.isHighRisk && (
                    <span className="inline-flex items-center mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      高警示药品
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">剂型</p>
                  <p className="font-medium text-gray-900">{viewingMedicine.dosageForm}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">规格</p>
                  <p className="font-medium text-gray-900">{viewingMedicine.specification}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">生产厂家</p>
                  <p className="font-medium text-gray-900">{viewingMedicine.manufacturer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">批准文号</p>
                  <p className="font-medium text-gray-900">{viewingMedicine.approvalNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">分类</p>
                  <p className="font-medium text-gray-900">{viewingMedicine.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">储存条件</p>
                  <p className="font-medium text-gray-900">
                    {storageConditionLabels[viewingMedicine.storageCondition]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">库存范围</p>
                  <p className="font-medium text-gray-900">
                    {viewingMedicine.minStock} - {viewingMedicine.maxStock} {viewingMedicine.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">单价</p>
                  <p className="font-medium text-gray-900">¥{viewingMedicine.price.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
