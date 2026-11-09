import { MenuItem, Vendor } from '../types/database';

export interface ItemPricing {
  regularPrice: number;     // Original / pre-discount regular price (e.g. 60)
  discountedPrice: number;  // Active price after vendor discount if any (e.g. 45 or 40.5)
  discountPercent: number;  // Store-wide vendor discount percentage (e.g. 10 for 10% OFF), 0 if none
  hasDiscount: boolean;     // Whether vendor store-wide discount is active
  hasOriginalPrice: boolean;// Whether dish has an original_price > selling price (original_price > price)
  discountAmount: number;   // Amount discounted by vendor discount
}

/**
 * Calculates effective price, original regular price, and discount percentage for a menu item.
 * Supports store-wide vendor discount (vendor.discount_percentage, e.g. 15%), 
 * as well as item-level original price (dish.original_price vs dish.price).
 */
export function getItemPricing(
  dish: MenuItem,
  vendor?: Vendor | null,
  extrasPrice: number = 0,
  selectedVariationPrice?: number
): ItemPricing {
  const rawPrice = Number(dish.price) || 0;
  let baseCatalogPrice: number;

  if (selectedVariationPrice !== undefined && selectedVariationPrice !== null && Number(selectedVariationPrice) > 0) {
    baseCatalogPrice = rawPrice > 0 ? rawPrice + Number(selectedVariationPrice) : Number(selectedVariationPrice);
  } else if (rawPrice > 0) {
    baseCatalogPrice = rawPrice;
  } else {
    // If dish price was omitted because variations exist, extract lowest/first variation price
    const varPrices: number[] = [];
    if (dish.variations && Array.isArray(dish.variations)) {
      dish.variations.forEach(g => {
        (g.options || []).forEach(o => {
          const p = Number(o.price);
          if (p > 0) varPrices.push(p);
        });
      });
    }
    if (dish.portion_options && Array.isArray(dish.portion_options)) {
      dish.portion_options.forEach(po => {
        const p = Number(po.price);
        if (p > 0) varPrices.push(p);
      });
    }

    baseCatalogPrice = varPrices.length > 0 ? Math.min(...varPrices) : 0;
  }

  // Check item-level original price (e.g. original_price = 60, price = 45)
  const itemOriginal = Number(dish.original_price) || 0;
  const hasOriginalPrice = itemOriginal > baseCatalogPrice && baseCatalogPrice > 0;

  // Store-wide vendor discount percentage
  const effectiveDiscountPct = (vendor && vendor.discount_percentage && Number(vendor.discount_percentage) > 0)
    ? Number(vendor.discount_percentage)
    : 0;

  const hasDiscount = effectiveDiscountPct > 0;

  const regularPrice = (hasOriginalPrice ? itemOriginal : baseCatalogPrice) + extrasPrice;
  const sellingBasePrice = baseCatalogPrice + extrasPrice;

  let discountedPrice = sellingBasePrice;
  let discountAmount = 0;

  if (hasDiscount) {
    discountAmount = Math.round((sellingBasePrice * effectiveDiscountPct) / 100);
    discountedPrice = Math.max(0, sellingBasePrice - discountAmount);
  }

  return {
    regularPrice,
    discountedPrice,
    discountPercent: hasDiscount ? effectiveDiscountPct : 0,
    hasDiscount,
    hasOriginalPrice,
    discountAmount,
  };
}
