import { useMemo } from 'react';
import { Plus, Download } from 'lucide-react';
import { StatBar } from '../components/StatBar';
import { CategoryTree } from '../components/CategoryTree';
import { CategoryModal } from '../components/CategoryModal';
import { CategoryDeleteModal } from '../components/CategoryDeleteModal';
import { Toast } from '../components/Toast';
import { useCategories } from '../hooks/useCategories';

export default function CategoriesPage() {
  const hook = useCategories();

  // Stats tính từ flatList (CategoryDto[]) — dùng sortOrder thay vì order
  const categoryStats = useMemo(() => {
    const total    = hook.flatList.length;
    const roots    = hook.flatList.filter(c => c.parentId === null).length;
    const children = total - roots;
    const active   = hook.flatList.filter(c => c.visible).length;
    return [
      { label: 'Tổng danh mục',    value: total,    colorClass: 'text-gray-900'   },
      { label: 'Danh mục cha',     value: roots,    colorClass: 'text-blue-600'   },
      { label: 'Danh mục con',     value: children, colorClass: 'text-green-600'  },
      { label: 'Đang hoạt động',   value: active,   colorClass: 'text-purple-600' },
    ];
  }, [hook.flatList]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-black text-gray-900">Quản Lý Danh Mục</h1>
          <p className="text-gray-600">Cây danh mục sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={hook.handleExport}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Xuất XLSX
          </button>
          <button
            onClick={hook.openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm Danh Mục
          </button>
        </div>
      </div>

      <StatBar stats={categoryStats} />

      {/* CategoryTree nhận tree từ API (CategoryTreeDto[]) */}
      <CategoryTree
        tree={hook.tree}
        loading={hook.treeLoading}
        onEdit={hook.openEdit}
        onDelete={hook.openDelete}
        onToggleVisibility={hook.handleToggleVisibility}
      />

      {/* Create/Edit modal */}
      {hook.modalOpen && (
        <CategoryModal
          isOpen={hook.modalOpen}
          editingCategory={hook.editingCategory}
          flatList={hook.flatList}
          loading={hook.actionLoading}
          error={hook.actionError}
          onSave={hook.handleSave}
          onClose={hook.closeModal}
        />
      )}

      {/* Delete confirmation modal */}
      {hook.deleteModalOpen && (
        <CategoryDeleteModal
          isOpen={hook.deleteModalOpen}
          categoryName={hook.deletingName}
          childrenCount={hook.deletingChildCount}
          loading={hook.actionLoading}
          onConfirm={() => hook.handleDelete(hook.deletingChildCount > 0)}
          onCancel={hook.closeDeleteModal}
        />
      )}

      <Toast
        message={hook.toast}
        isVisible={hook.toastVisible}
        onHide={() => {/* managed by hook */}}
      />
    </div>
  );
}