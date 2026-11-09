import { MenuItem, Vendor } from '../types/database';

export interface ItemPricing {
  regularPrice: number;     // Original / pre-discount price (e.g. 200)
  discountedPrice: number;  // Price after discount applied (e.g. 170)
  discountPercent: number;  // Discount percentage (e.g. 15)
  hasDiscount: boolean;     // Whether discount is active
  discountAmount: number;   // Amount discounted (e.g. 30)
}

/**
 * Calculates effective price, original regular price, and discount percentage for a menu item.
 * Supports store-wide vendor discount (vendor.discount_percentage, e.g. 15%), 
 * as well as item-level discounts (dish.original_price or dish.discount_percent).
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

  // Check item-level original price (e.g. original_price = 50, price = 40)
  const itemOriginal = Number(dish.original_price) || 0;
  const hasItemOriginal = itemOriginal > baseCatalogPrice && baseCatalogPrice > 0;

  // Store-wide vendor discount percentage
  const effectiveDiscountPct = (vendor && vendor.discount_percentage && Number(vendor.discount_percentage) > 0)
    ? Number(vendor.discount_percentage)
    : 0;

  if (hasItemOriginal) {
    const regularPrice = itemOriginal + extrasPrice;
    let discountedPrice = baseCatalogPrice + extrasPrice;

    if (effectiveDiscountPct > 0) {
      const vDiscountAmt = Math.round((discountedPrice * effectiveDiscountPct) / 100);
      discountedPrice = Math.max(0, discountedPrice - vDiscountAmt);
    }

    const discountAmount = Math.max(0, regularPrice - discountedPrice);
    const discountPercent = regularPrice > 0 ? Math.round((discountAmount / regularPrice) * 100) : 0;

    return {
      regularPrice,
      discountedPrice,
      discountPercent,
      hasDiscount: discountAmount > 0,
      discountAmount,
    };
  }

  const totalRegular = baseCatalogPrice + extrasPrice;

  if (effectiveDiscountPct > 0) {
    const discountAmount = Math.round((totalRegular * effectiveDiscountPct) / 100);
    const discountedPrice = Math.max(0, totalRegular - discountAmount);
    return {
      regularPrice: totalRegular,
      discountedPrice,
      discountPercent: effectiveDiscountPct,
      hasDiscount: true,
      discountAmount,
    };
  }

  return {
    regularPrice: totalRegular,
    discountedPrice: totalRegular,
    discountPercent: 0,
    hasDiscount: false,
    discountAmount: 0,
  };
}
