import { useState } from 'react';
import { ChevronDown, Folder, FolderOpen, Edit, Trash2, EyeOff, Eye, RefreshCw } from 'lucide-react';
import type { CategoryTreeDto } from '../api/categoryApi';

// ─────────────────────────────────────────────────────────────────────────────
// Props — THAY ĐỔI so với version cũ:
//   CŨ:  categories: Category[]  (flat array, có hàm getChildren)
//   MỚI: tree: CategoryTreeDto[] (nested, BE đã build sẵn)
// ─────────────────────────────────────────────────────────────────────────────
interface CategoryTreeProps {
  tree: CategoryTreeDto[];
  loading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  onToggleVisibility: (id: number, visible: boolean) => void;
}

export function CategoryTree({ tree, loading, onEdit, onDelete, onToggleVisibility }: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Guard: tree có thể undefined trong lần render đầu khi API chưa trả về
  const safeTree: CategoryTreeDto[] = Array.isArray(tree) ? tree : [];

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const collectIds = (items: CategoryTreeDto[]): number[] =>
      items.flatMap(c => [c.id, ...collectIds(c.children ?? [])]);
    setExpandedIds(new Set(collectIds(safeTree)));
  };

  const collapseAll = () => setExpandedIds(new Set());

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading && safeTree.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-400 shadow-sm">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
        Đang tải cây danh mục...
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!loading && safeTree.length === 0) {
    return (
      <div className="text-center py-15 px-5 bg-white border border-gray-200 rounded-xl shadow-sm">
        <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3.5" />
        <p className="text-gray-500">Chưa có danh mục nào. Hãy thêm danh mục đầu tiên!</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-sm font-black text-gray-900">
          Cây Danh Mục
          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin inline ml-2 text-gray-400" />}
        </h3>
        <div className="flex gap-3">
          <button onClick={expandAll}   className="text-sm font-semibold text-blue-600 hover:opacity-70 transition-opacity">Mở rộng tất cả</button>
          <button onClick={collapseAll} className="text-sm font-semibold text-blue-600 hover:opacity-70 transition-opacity">Thu gọn tất cả</button>
        </div>
      </div>

      {/* Tree — BE đã build sẵn nested, không cần getChildren */}
      <div className="flex flex-col">
        {safeTree.map(node => (
          <CategoryNode
            key={node.id}
            node={node}
            depth={0}
            expandedIds={expandedIds}
            onToggle={toggleExpand}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleVisibility={onToggleVisibility}
          />
        ))}
      </div>
    </div>
  );
}

// ── CategoryNode ──────────────────────────────────────────────────────────────

interface NodeProps {
  node: CategoryTreeDto;
  depth: number;
  expandedIds: Set<number>;
  onToggle: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  onToggleVisibility: (id: number, visible: boolean) => void;
}

function CategoryNode({ node, depth, expandedIds, onToggle, onEdit, onDelete, onToggleVisibility }: NodeProps) {
  // Guard: children có thể null/undefined nếu BE trả thiếu field
  const children   = Array.isArray(node.children) ? node.children : [];
  const hasChildren = children.length > 0;
  const isExpanded  = expandedIds.has(node.id);

  const paddingLeft =
    depth === 0 ? 'pl-2.5' :
    depth === 1 ? 'pl-8'   :
    depth === 2 ? 'pl-14'  : 'pl-20';

  return (
    <>
      <div
        className={`flex items-center ${paddingLeft} pr-2.5 py-2.5 rounded-lg border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-default`}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        {/* Chevron toggle */}
        <button
          onClick={e => { e.stopPropagation(); hasChildren && onToggle(node.id); }}
          className={`w-5 h-5 flex items-center justify-center flex-shrink-0 mr-1 rounded hover:bg-gray-200 text-gray-500 transition-all
            ${!hasChildren ? 'invisible' : ''}
            ${!isExpanded  ? '-rotate-90' : ''}`}
        >
          <ChevronDown className="w-3 h-3" />
        </button>

        {/* Folder icon */}
        {hasChildren && isExpanded
          ? <FolderOpen className={`w-4 h-4 mr-2.5 flex-shrink-0 ${depth === 0 ? 'text-blue-600' : 'text-gray-500'}`} />
          : <Folder     className={`w-4 h-4 mr-2.5 flex-shrink-0 ${depth === 0 ? 'text-blue-600' : 'text-gray-500'}`} />
        }

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900">{node.name}</span>
            <span className="bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5 text-xs font-semibold text-gray-600">
              {node.productCount ?? 0} SP
            </span>
            {!node.visible && (
              <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                <EyeOff className="w-3 h-3" /> Ẩn
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 font-mono">/{node.slug}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 items-center flex-shrink-0 ml-auto pl-3" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onToggleVisibility(node.id, !node.visible)}
            title={node.visible ? 'Ẩn danh mục' : 'Hiện danh mục'}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              node.visible
                ? 'bg-gray-50 text-gray-400 hover:bg-gray-200'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
            }`}
          >
            {node.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onEdit(node.id)}
            title="Sửa"
            className="w-7 h-7 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(node.id, node.name)}
            title="Xoá"
            className="w-7 h-7 bg-red-50 text-red-600 rounded-md flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children — BE sort sẵn theo sortOrder, không cần client-side sort */}
      {hasChildren && isExpanded && (
        <div>
          {children.map(child => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </div>
      )}
    </>
  );
}