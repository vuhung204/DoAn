import { useState, useEffect } from 'react';
import { ArrowLeft, Save, CloudUpload, X, Tag, Loader2 } from 'lucide-react';
import {
  fetchProduct, createProduct, updateProduct, uploadImage,
  type ProductFiltersMetaDto, type ProductSpecsDto,
  normalizeImageUrl,
} from '../api/productApi';

interface ProductFormProps {
  productId: number | null;
  meta: ProductFiltersMetaDto | null;
  onSaved: (name: string, isEdit: boolean) => void;
  onCancel: () => void;
}

interface FormData {
  name: string; sku: string;
  brandId: string; categoryId: string;
  description: string;
  basePrice: string;
  salePrice: string;
  stock: string; minStock: string;
  cpu: string; ram: string; storage: string;
  screen: string;
  gpu: string; os: string;
  weight: string; battery: string;
  visible: boolean;
}

const EMPTY: FormData = {
  name: '', sku: '', brandId: '', categoryId: '',
  description: '', basePrice: '', salePrice: '',
  stock: '0', minStock: '5',
  cpu: '', ram: '', storage: '', screen: '',
  gpu: '', os: '', weight: '', battery: '',
  visible: true,
};

export function ProductForm({ productId, meta, onSaved, onCancel }: ProductFormProps) {
  const isEditing = productId !== null;
  const [formData,       setFormData]       = useState<FormData>(EMPTY);
  const [errors,         setErrors]         = useState<Record<string, string>>({});
  const [images,         setImages]         = useState<string[]>([]);
  const [loading,        setLoading]        = useState(isEditing);
  const [saving,         setSaving]         = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!productId) { setFormData(EMPTY); setImages([]); return; }
    setLoading(true);
    fetchProduct(productId).then(p => {
      setFormData({
        name:        p.name ?? '',
        sku:         p.sku ?? '',
        brandId:     String(p.brandId ?? ''),
        categoryId:  String(p.categoryId ?? ''),
        description: p.description ?? '',
        basePrice:   p.basePrice != null ? String(p.basePrice) : '',
        salePrice:   p.salePrice != null && p.salePrice !== p.basePrice ? String(p.salePrice) : '',
        stock:       String(p.stock ?? 0),
        minStock:    String(p.minStock ?? 5),
        cpu:         p.specs?.cpu       ?? '',
        ram:         p.specs?.ram       ?? '',
        storage:     p.specs?.storage   ?? '',
        screen:      p.specs?.display   ?? '',
        gpu:         p.specs?.gpu       ?? '',
        os:          p.specs?.os        ?? '',
        weight:      p.specs?.weightKg  != null ? String(p.specs.weightKg)  : '',
        battery:     p.specs?.batteryWh != null ? String(p.specs.batteryWh) : '',
        visible:     p.visible !== false,
      });
      setImages(p.images?.map(i => normalizeImageUrl(i.imageUrl)) ?? []);
    }).catch(console.error).finally(() => setLoading(false));
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim())     errs.name       = 'Vui lòng nhập tên sản phẩm.';
    if (!formData.sku.trim())      errs.sku        = 'Vui lòng nhập mã SKU.';
    if (!formData.brandId)         errs.brandId    = 'Vui lòng chọn thương hiệu.';
    if (!formData.categoryId)      errs.categoryId = 'Vui lòng chọn danh mục.';
    if (!formData.basePrice || Number(formData.basePrice) <= 0)
      errs.basePrice = 'Vui lòng nhập giá niêm yết.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    const specs: ProductSpecsDto = {
      cpu:       formData.cpu     || undefined,
      ram:       formData.ram     || undefined,
      storage:   formData.storage || undefined,
      display:   formData.screen  || undefined,
      gpu:       formData.gpu     || undefined,
      os:        formData.os      || undefined,
      weightKg:  formData.weight  ? Number(formData.weight)  : undefined,
      batteryWh: formData.battery ? Number(formData.battery) : undefined,
    };
    try {
      if (isEditing) {
        await updateProduct(productId!, {
          name:        formData.name.trim(),
          brandId:     Number(formData.brandId),
          categoryId:  Number(formData.categoryId),
          description: formData.description.trim() || undefined,
          basePrice:   Number(formData.basePrice),
          salePrice:   formData.salePrice ? Number(formData.salePrice) : undefined,
          stock:       Number(formData.stock),
          minStock:    Number(formData.minStock),
          visible:     formData.visible,
          specs,
          imageUrls:   images.length > 0 ? images : undefined,
        });
      } else {
        await createProduct({
          name:        formData.name.trim(),
          sku:         formData.sku.trim(),
          brandId:     Number(formData.brandId),
          categoryId:  Number(formData.categoryId),
          description: formData.description.trim() || undefined,
          basePrice:   Number(formData.basePrice),
          salePrice:   formData.salePrice ? Number(formData.salePrice) : undefined,
          stock:       Number(formData.stock),
          minStock:    Number(formData.minStock),
          visible:     formData.visible,
          specs,
          imageUrls:   images.length > 0 ? images : undefined,
        });
      }
      onSaved(formData.name, isEditing);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Lưu thất bại';
      setErrors(prev => ({ ...prev, _global: msg }));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploadingImage(true);
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const url = await uploadImage(file);
        setImages(prev => [...prev, url]);
      }
    } catch {
      setErrors(prev => ({ ...prev, _global: 'Upload ảnh thất bại' }));
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const base          = Number(formData.basePrice) || 0;
  const sale          = Number(formData.salePrice) || 0;
  const hasDiscount   = base > 0 && sale > 0 && sale < base;
  const discountPct   = hasDiscount ? Math.round((1 - sale / base) * 100) : 0;
  const discountAmt   = hasDiscount ? (base - sale) : 0;
  const formatPreview = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Đang tải sản phẩm...</span>
      </div>
    );
  }

  const brands     = meta?.brands     ?? [];
  const categories = meta?.categories ?? [];

  return (
    <div>
      <button onClick={onCancel} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors mb-3">
        <ArrowLeft className="w-4 h-4" />Quay lại danh sách
      </button>

      <h1 className="font-black text-gray-900">{isEditing ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h1>
      <p className="text-gray-600 mb-5">{isEditing ? 'Cập nhật thông tin sản phẩm' : 'Điền đầy đủ thông tin sản phẩm'}</p>

      {errors._global && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{errors._global}</div>
      )}

      <div className="grid grid-cols-[1fr_300px] gap-5 items-start mt-5">

        {/* ── Left ── */}
        <div className="flex flex-col gap-4.5">

          {/* Basic Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-5.5 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 mb-4 pb-2.5 border-b border-gray-200">Thông Tin Cơ Bản</h3>
            <div className="space-y-3.5">
              <FormField label="Tên sản phẩm" required error={errors.name}>
                <input type="text" name="name" value={formData.name} onChange={handleChange}
                  placeholder="VD: Asus ROG Strix G16 G614JV" className={inputClass(errors.name)} />
              </FormField>
              <div className="grid grid-cols-2 gap-3.5">
                <FormField label="SKU" required error={errors.sku}>
                  <input type="text" name="sku" value={formData.sku} onChange={handleChange}
                    disabled={isEditing} placeholder="VD: AS-ROG-G16-G614JV"
                    className={inputClass(errors.sku) + (isEditing ? ' opacity-60 cursor-not-allowed' : '')} />
                </FormField>
                <FormField label="Thương hiệu" required error={errors.brandId}>
                  <select name="brandId" value={formData.brandId} onChange={handleChange} className={inputClass(errors.brandId)}>
                    <option value="">-- Chọn thương hiệu --</option>
                    {brands.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
                  </select>
                </FormField>
              </div>
              <FormField label="Danh mục" required error={errors.categoryId}>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} className={inputClass(errors.categoryId)}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="Mô tả sản phẩm">
                <textarea name="description" value={formData.description} onChange={handleChange}
                  rows={4} placeholder="Mô tả chi tiết..." className={inputClass()} />
              </FormField>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-gray-200 rounded-xl p-5.5 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 mb-4 pb-2.5 border-b border-gray-200">Giá Bán</h3>
            <div className="grid grid-cols-2 gap-3.5 mb-3.5">
              <FormField label="Giá niêm yết (VNĐ)" required error={errors.basePrice} hint="Nhập giá đầy đủ VD: 32990000">
                <div className="relative">
                  <input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange}
                    placeholder="VD: 32990000" min="0" className={inputClass(errors.basePrice) + ' pr-8'} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">₫</span>
                </div>
              </FormField>
              <FormField label="Giá bán (VNĐ)" hint="Để trống nếu không giảm giá">
                <div className="relative">
                  <input type="number" name="salePrice" value={formData.salePrice} onChange={handleChange}
                    placeholder="Để trống nếu bằng giá niêm" min="0" className={inputClass() + ' pr-8'} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">₫</span>
                </div>
              </FormField>
            </div>
            {hasDiscount && (
              <div className="flex items-center gap-2 bg-green-100 rounded-lg px-3.5 py-2 text-sm text-green-700 font-semibold mt-2.5">
                <Tag className="w-4 h-4" />
                Giảm {discountPct}% — Tiết kiệm {formatPreview(discountAmt)}
              </div>
            )}
          </div>

          {/* Inventory */}
          <div className="bg-white border border-gray-200 rounded-xl p-5.5 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 mb-4 pb-2.5 border-b border-gray-200">Tồn Kho</h3>
            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Số lượng" required error={errors.stock}>
                <input type="number" name="stock" value={formData.stock} onChange={handleChange} min="0" className={inputClass(errors.stock)} />
              </FormField>
              <FormField label="Tồn kho tối thiểu" hint="Cảnh báo khi dưới mức này">
                <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} min="0" className={inputClass()} />
              </FormField>
            </div>
          </div>

          {/* Specs */}
          <div className="bg-white border border-gray-200 rounded-xl p-5.5 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 mb-4 pb-2.5 border-b border-gray-200">Thông Số Kỹ Thuật</h3>
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { name: 'cpu',     label: 'CPU',              ph: 'Intel Core i7-13650HX' },
                { name: 'ram',     label: 'RAM',              ph: '16GB DDR5 4800MHz' },
                { name: 'storage', label: 'Ổ cứng',           ph: '1TB NVMe PCIe 4.0' },
                { name: 'screen',  label: 'Màn hình',         ph: '16" QHD+ IPS 240Hz' },
                { name: 'gpu',     label: 'Card đồ họa',      ph: 'NVIDIA RTX 4060 8GB' },
                { name: 'os',      label: 'Hệ điều hành',     ph: 'Windows 11 Home' },
                { name: 'weight',  label: 'Trọng lượng (kg)', ph: '2.3' },
                { name: 'battery', label: 'Pin (Wh)',          ph: '90' },
              ].map(f => (
                <FormField key={f.name} label={f.label}>
                  <input type="text" name={f.name}
                    value={(formData as any)[f.name]} onChange={handleChange}
                    placeholder={f.ph} className={inputClass()} />
                </FormField>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right ── */}
        <div className="flex flex-col gap-4.5">

          {/* Images */}
          <div className="bg-white border border-gray-200 rounded-xl p-5.5 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 mb-4 pb-2.5 border-b border-gray-200">Hình Ảnh Sản Phẩm</h3>
            <label className={`block border-2 border-dashed rounded-lg p-7 text-center transition-colors
              ${uploadingImage
                ? 'border-blue-400 bg-blue-50 cursor-not-allowed'
                : 'border-gray-300 bg-gray-50 cursor-pointer hover:border-blue-600 hover:bg-blue-50'}`}>
              <input type="file" accept="image/*" multiple
                onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
              {uploadingImage ? (
                <>
                  <Loader2 className="w-7 h-7 text-blue-500 mx-auto mb-2 animate-spin" />
                  <p className="text-sm font-semibold text-blue-600">Đang tải ảnh lên...</p>
                </>
              ) : (
                <>
                  <CloudUpload className="w-7 h-7 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700 mb-1">Nhấp để tải lên ảnh</p>
                  <span className="text-xs text-gray-500">PNG, JPG (Max 10MB)</span>
                </>
              )}
            </label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2.5">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-18 h-18 group">
                    <img src={img} alt="preview"
                      className="w-18 h-18 rounded-lg object-cover border-2 border-gray-200" />
                    {idx === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-bold bg-blue-600 text-white rounded-b-lg py-0.5">
                        Chính
                      </span>
                    )}
                    <button onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-red-600 text-white rounded-full items-center justify-center hidden group-hover:flex">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="bg-white border border-gray-200 rounded-xl p-5.5 shadow-sm">
            <h3 className="text-sm font-black text-gray-900 mb-4 pb-2.5 border-b border-gray-200">Trạng Thái</h3>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={formData.visible}
                onChange={e => setFormData(prev => ({ ...prev, visible: e.target.checked }))}
                className="hidden" />
              <div className={`w-10.5 h-6 rounded-full relative transition-colors ${formData.visible ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.75 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform
                  ${formData.visible ? 'translate-x-4.5' : 'translate-x-0.75'}`} />
              </div>
              <span className="text-sm font-semibold text-gray-900">Hiển thị sản phẩm trên website</span>
            </label>
          </div>

          {/* Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5.5 shadow-sm flex flex-col gap-2.5">
            <button onClick={handleSubmit} disabled={saving || uploadingImage}
              className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Đang lưu...' : 'Lưu Sản Phẩm'}
            </button>
            <button onClick={onCancel}
              className="w-full px-3 py-2.5 border border-gray-300 bg-white rounded-lg font-semibold text-gray-700 hover:border-red-600 hover:text-red-600 transition-colors">
              Huỷ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────

interface FormFieldProps {
  label: string; required?: boolean;
  error?: string; hint?: string;
  children: React.ReactNode;
}

function FormField({ label, required, error, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.25">
      <label className="text-sm font-bold text-gray-900">
        {label}{required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      {children}
      {hint  && !error && <span className="text-xs text-gray-500">{hint}</span>}
      {error && <span className="text-xs text-red-600 min-h-4">{error}</span>}
    </div>
  );
}

function inputClass(hasError?: string) {
  return `w-full px-3.25 py-2.5 border ${hasError ? 'border-red-600' : 'border-gray-300'} rounded-lg text-sm text-gray-900 bg-gray-50 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all`;
}