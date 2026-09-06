import { useMemo, useState } from 'react';

export function useVariationSelection(product) {
  const [selectedOptions, setSelectedOptions] = useState({});

  const attributeGroups = useMemo(() => {
    if (!product?.variations?.length) return {};
    const groups = {};
    product.variations.forEach((variation) => {
      variation.options.forEach((opt) => {
        groups[opt.attribute_name] = groups[opt.attribute_name] || new Set();
        groups[opt.attribute_name].add(opt.attribute_value);
      });
    });
    return Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, [...v]]));
  }, [product]);

  const selectedVariation = useMemo(() => {
    if (!product?.has_variations) return null;
    return product.variations.find((variation) =>
      variation.options.every((opt) => selectedOptions[opt.attribute_name] === opt.attribute_value)
    );
  }, [product, selectedOptions]);

  return { selectedOptions, setSelectedOptions, attributeGroups, selectedVariation };
}

export default function VariationPicker({ attributeGroups, selectedOptions, onSelect }) {
  return (
    <>
      {Object.entries(attributeGroups).map(([attributeName, values]) => (
        <div key={attributeName} className="mt-4">
          <p className="mb-2 text-sm font-semibold text-slate-700">{attributeName}</p>
          <div className="flex flex-wrap gap-2">
            {values.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onSelect(attributeName, value)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                  selectedOptions[attributeName] === value
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 text-slate-600 hover:border-slate-400'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
