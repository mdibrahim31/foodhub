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
  extrasPrice: number = 0
): ItemPricing {
  const baseCatalogPrice = Number(dish.price) || 0;
  
  // If dish explicitly specifies an original_price > price, that's its regular pre-discount base
  const regularBase = (dish.original_price && Number(dish.original_price) > baseCatalogPrice)
    ? Number(dish.original_price)
    : baseCatalogPrice;
  
  const totalRegular = regularBase + extrasPrice;

  // Check vendor discount percentage (e.g. 15%)
  const vendorDiscountPct = (vendor && vendor.discount_percentage && Number(vendor.discount_percentage) > 0)
    ? Number(vendor.discount_percentage)
    : 0;

  // Check dish-level discount
  let itemDiscountPct = 0;
  if (dish.discount_percent && Number(dish.discount_percent) > 0) {
    itemDiscountPct = Number(dish.discount_percent);
  } else if (dish.original_price && Number(dish.original_price) > baseCatalogPrice) {
    itemDiscountPct = Math.round(((Number(dish.original_price) - baseCatalogPrice) / Number(dish.original_price)) * 100);
  }

  const effectiveDiscountPct = Math.max(vendorDiscountPct, itemDiscountPct);

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
