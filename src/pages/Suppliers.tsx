import { useState } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  Building2,
  FileText,
  Award,
  Phone,
  MapPin,
  Check,
  AlertCircle,
  Star,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { Supplier } from '../types';

export const Suppliers = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contact.includes(searchQuery) ||
    s.phone.includes(searchQuery)
  );

  const [formData, setFormData] = useState({
    name: '',
    businessLicense: '',
    gspCertificate: '',
    supplyScope: ['西药'] as string[],
    rating: 3,
    gspExpiryDate: '',
    contact: '',
    phone: '',
    address: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, formData);
    } else {
      addSupplier(formData);
    }
    setShowModal(false);
    setEditingSupplier(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      businessLicense: '',
      gspCertificate: '',
      supplyScope: ['西药'],
      rating: 3,
      gspExpiryDate: '',
      contact: '',
      phone: '',
      address: '',
    });
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      businessLicense: supplier.businessLicense,
      gspCertificate: supplier.gspCertificate,
      supplyScope: supplier.supplyScope,
      rating: supplier.rating,
      gspExpiryDate: supplier.gspExpiryDate,
      contact: supplier.contact,
      phone: supplier.phone,
      address: supplier.address,
    });
    setShowModal(true);
  };

  const isGspExpiringSoon = (date: string) => {
    const expiry = new Date(date);
    const now = new Date();
    const daysToExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysToExpiry <= 90;
  };

  const supplyScopes = ['西药', '中成药', '中药饮片', '生物制品', '医疗器械'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">供应商管理</h1>
          <p className="text-gray-500 mt-1">管理供应商资质、GSP证书和供货评级</p>
        </div>
        <button
          onClick={() => {
            setEditingSupplier(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          新增供应商
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索供应商名称、联系人或电话..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <div
            key={supplier.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                  <div className="flex items-center mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < supplier.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {isGspExpiringSoon(supplier.gspExpiryDate) && (
                <span className="px-2 py-1 bg-amber-100 text-amber-600 text-xs rounded-full flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  GSP即将到期
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-600">
                <FileText className="w-4 h-4 mr-2 text-gray-400" />
                <span>营业执照：{supplier.businessLicense}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Award className="w-4 h-4 mr-2 text-gray-400" />
                <span>GSP证书：{supplier.gspCertificate}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <span>{supplier.contact} - {supplier.phone}</span>
              </div>
              <div className="flex items-start text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{supplier.address}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-4">
              {supplier.supplyScope.map(scope => (
                <span
                  key={scope}
                  className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  {scope}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setViewingSupplier(supplier)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => openEditModal(supplier)}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (confirm('确定删除该供应商吗？')) {
                    deleteSupplier(supplier.id);
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSupplier ? '编辑供应商' : '新增供应商'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSupplier(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">供应商名称 *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入供应商名称"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">营业执照号 *</label>
                  <input
                    type="text"
                    required
                    value={formData.businessLicense}
                    onChange={e => setFormData({ ...formData, businessLicense: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GSP证书号 *</label>
                  <input
                    type="text"
                    required
                    value={formData.gspCertificate}
                    onChange={e => setFormData({ ...formData, gspCertificate: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GSP有效期 *</label>
                  <input
                    type="date"
                    required
                    value={formData.gspExpiryDate}
                    onChange={e => setFormData({ ...formData, gspExpiryDate: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">信誉评级</label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating: star })}
                        className="p-1"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= formData.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">供货范围</label>
                <div className="flex flex-wrap gap-2">
                  {supplyScopes.map(scope => (
                    <label
                      key={scope}
                      className={`flex items-center px-3 py-2 rounded-lg cursor-pointer border ${
                        formData.supplyScope.includes(scope)
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={formData.supplyScope.includes(scope)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData({ ...formData, supplyScope: [...formData.supplyScope, scope] });
                          } else {
                            setFormData({
                              ...formData,
                              supplyScope: formData.supplyScope.filter(s => s !== scope),
                            });
                          }
                        }}
                      />
                      <span className="text-sm">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">联系人 *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact}
                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">联系电话 *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">公司地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSupplier(null);
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
                  {editingSupplier ? '保存修改' : '添加供应商'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">供应商详情</h2>
              <button
                onClick={() => setViewingSupplier(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">{viewingSupplier.name}</h3>
                  <div className="flex items-center mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < viewingSupplier.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-500">{viewingSupplier.rating} 星</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-sm text-gray-500">营业执照</p>
                  <p className="font-medium text-gray-900">{viewingSupplier.businessLicense}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">GSP证书</p>
                  <p className="font-medium text-gray-900">{viewingSupplier.gspCertificate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">GSP有效期</p>
                  <p className={`font-medium ${isGspExpiringSoon(viewingSupplier.gspExpiryDate) ? 'text-amber-600' : 'text-gray-900'}`}>
                    {viewingSupplier.gspExpiryDate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">供货范围</p>
                  <div className="flex flex-wrap gap-1">
                    {viewingSupplier.supplyScope.map(scope => (
                      <span key={scope} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">联系人</p>
                  <p className="font-medium text-gray-900">{viewingSupplier.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">联系电话</p>
                  <p className="font-medium text-gray-900">{viewingSupplier.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">公司地址</p>
                  <p className="font-medium text-gray-900">{viewingSupplier.address}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
