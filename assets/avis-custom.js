
document.addEventListener("DOMContentLoaded", async function () {

  if (typeof Shopify === "undefined") return;

  try {
    const cart = await fetch('/cart.js').then(res => res.json());

    // 1️⃣ Group addon prices by group_id
    const addonPriceByGroup = {};

    cart.items.forEach(item => {
      const isAddon =
        item.product &&
        item.product.tags &&
        item.product.tags.includes('avisplus-product-options');

      const groupId = item.properties?.group_id;

      if (isAddon && groupId) {
        if (!addonPriceByGroup[groupId]) {
          addonPriceByGroup[groupId] = 0;
        }
        addonPriceByGroup[groupId] += item.line_price; // already qty * price
      }
    });

    // 2️⃣ Loop main products in DOM
    document.querySelectorAll('.cart-item').forEach(cartItemEl => {

      // addon items skip
      if (cartItemEl.classList.contains('avis-option')) return;

      // group_id from properties
      const groupPropEl = cartItemEl.querySelector(
        '.product-option[data-name="group_id"]'
      );

      if (!groupPropEl) return;

      const groupId = groupPropEl.dataset.value;
      const addonTotal = addonPriceByGroup[groupId] || 0;

      if (!addonTotal) return;

      // 3️⃣ Get original price from cart.js
      const index = cartItemEl.id.replace('CartItem-', '') - 1;
      const mainItem = cart.items[index];

      if (!mainItem) return;

      const combinedPrice = mainItem.line_price + addonTotal;

      // 4️⃣ Update UI
      const priceEl = cartItemEl.querySelector('.price.price--end');
      if (priceEl) {
        priceEl.innerHTML = Shopify.formatMoney(
          combinedPrice,
          cart.currency.symbol + '{{amount}}'
        );
      }

    });

  } catch (e) {
    console.error('Addon price merge failed', e);
  }
});
