import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

export function FilterSidebar() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    brand: true,
    price: true,
    cpu: true,
    ram: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside className="w-64 bg-white border-r p-6 h-[calc(100vh-140px)] overflow-y-auto">
      <h2 className="font-bold text-lg mb-4">Bộ lọc</h2>

      {/* Brand Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('brand')}
          className="flex items-center justify-between w-full mb-3"
        >
          <span className="font-medium">Thương hiệu</span>
          {openSections.brand ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>
        {openSections.brand && (
          <div className="space-y-2">
            {['Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Apple'].map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox id={`brand-${brand}`} />
                <Label
                  htmlFor={`brand-${brand}`}
                  className="text-sm cursor-pointer"
                >
                  {brand}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full mb-3"
        >
          <span className="font-medium">Giá</span>
          {openSections.price ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>
        {openSections.price && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="price-1" />
                <Label htmlFor="price-1" className="text-sm cursor-pointer">
                  Dưới 10 triệu
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="price-2" />
                <Label htmlFor="price-2" className="text-sm cursor-pointer">
                  10 - 20 triệu
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="price-3" />
                <Label htmlFor="price-3" className="text-sm cursor-pointer">
                  20 - 30 triệu
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="price-4" />
                <Label htmlFor="price-4" className="text-sm cursor-pointer">
                  Trên 30 triệu
                </Label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CPU Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('cpu')}
          className="flex items-center justify-between w-full mb-3"
        >
          <span className="font-medium">Bộ vi xử lý</span>
          {openSections.cpu ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>
        {openSections.cpu && (
          <div className="space-y-2">
            {['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9'].map(
              (cpu) => (
                <div key={cpu} className="flex items-center space-x-2">
                  <Checkbox id={`cpu-${cpu}`} />
                  <Label htmlFor={`cpu-${cpu}`} className="text-sm cursor-pointer">
                    {cpu}
                  </Label>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* RAM Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('ram')}
          className="flex items-center justify-between w-full mb-3"
        >
          <span className="font-medium">RAM</span>
          {openSections.ram ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </button>
        {openSections.ram && (
          <div className="space-y-2">
            {['4GB', '8GB', '16GB', '32GB', '64GB'].map((ram) => (
              <div key={ram} className="flex items-center space-x-2">
                <Checkbox id={`ram-${ram}`} />
                <Label htmlFor={`ram-${ram}`} className="text-sm cursor-pointer">
                  {ram}
                </Label>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
