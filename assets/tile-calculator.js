class TileCalculator extends HTMLElement {
  constructor() {
    super();

    // Parse embedded variant data from JSON <script> tag
    const variantsScript = document.getElementById("tile-variants-json");
    this.variants = variantsScript
      ? JSON.parse(variantsScript.textContent)
      : {};

    // Get tile size from data attribute or fallback to 24 inches
    this.tileSizeIn = parseFloat(this.dataset.tileSizeIn || 24);

    // Unit conversion factors to cm
    this.unitFactors = {
      feet: 30.48,
      inches: 2.54,
      centimeters: 1,
      meters: 100,
    };

    // Cache references to form, cart, quantity input, and add to cart button
    this.form = document.querySelector('form[data-type="add-to-cart-form"]');
    this.cart =
      document.querySelector("cart-notification") ||
      document.querySelector("cart-drawer");
    this.quantityInput = document.querySelector('input[name="quantity"]');
    this.quantityInput.readOnly = true;
    this.btn = document.querySelector(
      'form[data-type="add-to-cart-form"] [type="submit"]'
    );

    // Attach main calculate handler
    this.querySelector("#calc-button")?.addEventListener("click", () =>
      this.calculate()
    );

    // Initialize the custom dropdown for unit selection
    this.setupCustomSelect();
  }

  connectedCallback() {
    // Delay initial setup to ensure DOM is stable
    requestAnimationFrame(() => {
      this.updateQuantity(0);
      this.updateCustomPrice({});
      this.disableAddToCartButton();

      // Add additional setup after slight delay
      setTimeout(() => {
        this.updateQuantity(0);
        this.updateCustomPrice({});

        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.disableAddToCartButton();

        this.enableBreakdownInputsRealtimeSync();
      }, 2000);

      this.updateQuantity(0);
      this.updateCustomPrice({});
      this.disableAddToCartButton();
    });
  }

  // Convert a value from selected unit to centimeters
  convertToCm(value, unit) {
    return value * (this.unitFactors[unit] || 1);
  }

  // Calculate required tile counts based on length and width in cm
  calculateTiles(lengthCm, widthCm) {
    const tileCm = this.tileSizeIn * 2.54; // convert tile size to cm
    const tilesPerRow = Math.max(Math.ceil(lengthCm / tileCm), 1);
    const tilesPerCol = Math.max(Math.ceil(widthCm / tileCm), 1);

    const totalTiles = tilesPerRow * tilesPerCol;
    const tileTypes = Object.keys(this.variants);

    let result = {};

    if (
      tileTypes.includes("middle") &&
      tileTypes.includes("edge") &&
      tileTypes.includes("corner")
    ) {
      // Standard layout with corners and edges
      const corner = Math.min(tilesPerRow, tilesPerCol) >= 2 ? 4 : 0;
      const edge = Math.max((tilesPerRow - 2) * 2 + (tilesPerCol - 2) * 2, 0);
      const middle = Math.max(totalTiles - edge - corner, 0);

      result = { middle, edge, corner };
    } else {
      // Fallback logic for other combinations
      if (tileTypes.length === 1 && tileTypes.includes("square")) {
        result["square"] = totalTiles;
      } else if (
        tileTypes.length === 2 &&
        tileTypes.includes("square") &&
        tileTypes.includes("border")
      ) {
        result["square"] = totalTiles;
        result["border"] = tilesPerRow * 2 + tilesPerCol * 2;
      } else {
        tileTypes.forEach((type) => {
          result[type] = 0;
        });
      }
    }

    result.total = Object.values(result).reduce((sum, val) => sum + val, 0);
    return result;
  }

  // Main calculate action triggered by "Calculate" button
  async calculate() {
    const spinner = this.querySelector("#calc-spinner");
    spinner.style.display = "block";
    await new Promise((r) => setTimeout(r, 300)); // simulate loading

    const unit = this.querySelector("#calc-units").value;
    const length = parseFloat(this.querySelector("#calc-length").value);
    const width = parseFloat(this.querySelector("#calc-width").value);

    const lengthCm = this.convertToCm(length, unit);
    const widthCm = this.convertToCm(width, unit);
    const result = this.calculateTiles(lengthCm, widthCm);

    // Update UI with results
    this.renderResult(result);
    this.updateBreakdown(result);
    // this.enableBreakdownInputsRealtimeSync();
    this.updateQuantity(result.total);
    this.updateCustomPrice(result);

    // Disable button if any required variant is out of stock
    const unavailable = Object.entries(result).some(([type, qty]) => {
      if (type === "total") return false;
      const variant = this.variants[type];
      return qty > 0 && (!variant || !variant.available);
    });

    spinner.style.display = "none";

    if (unavailable) {
      this.disableAddToCartButton();
    } else {
      this.enableAddToCartButton();
    }
  }

  // Render tile breakdown message below the inputs
  renderResult(result) {
    const lines = Object.entries(result)
      .filter(([key]) => key !== "total")
      .map(
        ([key, val]) =>
          `<span>${
            key.charAt(0).toUpperCase() + key.slice(1)
          } Mats: <strong>${val}pcs</strong></span>`
      )
      .join(" ");
    this.querySelector("#calc-result").innerHTML = lines;
  }

  // Fill and activate breakdown inputs for quantity adjustment
  updateBreakdown(result) {
    Object.entries(result).forEach(([type, qty]) => {
      if (type === "total") return;
      const input = this.querySelector(`#${type}-tiles`);
      if (input) {
        input.value = qty;
        input.readOnly = false;
      }
    });
  }

  // Add real-time sync for quantity edits
  enableBreakdownInputsRealtimeSync() {
    const inputs = this.querySelectorAll('.tile-calculator__breakdown input[type="number"]');
  
    inputs.forEach((input) => {
      input.addEventListener("input", () => {
        let newVal = parseInt(input.value || 0);
        if (newVal < 0 || isNaN(newVal)) {
          newVal = 0;
          input.value = 0;
        }
  
        const updatedResult = {};
        let updatedTotal = 0;
  
        inputs.forEach((inp) => {
          const type = inp.id.replace("-tiles", "");
          let val = parseInt(inp.value || 0);
          if (val < 0 || isNaN(val)) {
            val = 0;
            inp.value = 0;
          }
          updatedResult[type] = val;
          updatedTotal += val;
        });
  
        updatedResult.total = updatedTotal;
        this.updateQuantity(updatedTotal);
        this.updateCustomPrice(updatedResult);
      });
    });
  }
  

  // Sync total quantity with hidden quantity input
  updateQuantity(total) {
    this.quantityInput.value = total;
    this.quantityInput.dataset.cartQuantity = total;
  }

  // Update dynamic price block based on total tile count
  updateCustomPrice(result) {
    this.btn.disabled = false;

    const priceDisplay = document.querySelector(
      ".pr_custom_price-container.apo-variant-price .pr_custom_price"
    );
    if (!priceDisplay) return;

    let total = 0;
    Object.entries(result).forEach(([type, qty]) => {
      if (type === "total") return;
      const variant = this.variants[type];
      if (variant && variant.price) {
        total += qty * variant.price;
      }
    });

    const moneyFormat = (amount) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: Shopify.currency.active || "USD",
      }).format(amount / 100);

    priceDisplay.textContent = moneyFormat(total);
  }

  // Initialize custom dropdown select for units
  setupCustomSelect() {
    const wrapper = this.querySelector("#calc-units-wrapper");
    const button = wrapper?.querySelector("#calc-units-button");
    const label = wrapper?.querySelector(".tile-calculator__select-label");
    const list = wrapper?.querySelector("#calc-units-options");
    const hiddenInput = wrapper?.querySelector("#calc-units");

    const closeList = () => {
      button.setAttribute("aria-expanded", "false");
      list.classList.remove("is-open");
    };

    button?.addEventListener("click", () => {
      const isOpen = list.classList.contains("is-open");
      button.setAttribute("aria-expanded", String(!isOpen));
      list.classList.toggle("is-open");
    });

    list?.querySelectorAll("li").forEach((option) => {
      option.addEventListener("click", () => {
        list
          .querySelectorAll("li")
          .forEach((li) => li.classList.remove("is-selected"));
        option.classList.add("is-selected");
        const oldUnit = hiddenInput.value;
        const newUnit = option.dataset.value;

        if (oldUnit !== newUnit)
          this.convertLengthOnUnitChange(oldUnit, newUnit);

        label.textContent = option.textContent;
        hiddenInput.value = newUnit;
        closeList();
      });
    });

    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) closeList();
    });
  }

  // Convert inputs when user switches units
  convertLengthOnUnitChange(oldUnit, newUnit) {
    const lengthInput = this.querySelector("#calc-length");
    const widthInput = this.querySelector("#calc-width");

    const length = parseFloat(lengthInput.value || 0);
    const width = parseFloat(widthInput.value || 0);
    if (isNaN(length) || isNaN(width)) return;

    const lengthCm = length * this.unitFactors[oldUnit];
    const widthCm = width * this.unitFactors[oldUnit];

    const newLength = lengthCm / this.unitFactors[newUnit];
    const newWidth = widthCm / this.unitFactors[newUnit];

    lengthInput.value = parseFloat(newLength.toFixed(2));
    widthInput.value = parseFloat(newWidth.toFixed(2));
  }

  // Optional: helper to wait for form to appear before attaching logic
  observeFormReady(callback) {
    const tryAttach = () => {
      const form = document.querySelector('form[data-type="add-to-cart-form"]');
      if (form) {
        callback(form);
        return true;
      }
      return false;
    };

    if (!tryAttach()) {
      const observer = new MutationObserver(() => {
        if (tryAttach()) observer.disconnect();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  disableAddToCartButton() {
    this.btn.disabled = true;
  }

  enableAddToCartButton() {
    this.btn.disabled = false;
  }

  // Submit form manually with all calculated tile variant quantities
  async onSubmitHandler(e) {
    e.preventDefault();

    this.btn.setAttribute("aria-disabled", true);
    this.btn.classList.add("loading");
    this.btn.querySelector(".loading__spinner").classList.remove("hidden");

    // Wait for extra property fields from external apps
    const items = [];
    const avisEl = await new Promise((resolve) => {
      const existing = document.querySelector(
        '.avis-input-hiddens[data-productid="default"]'
      );
      if (existing) return resolve(existing);

      const observer = new MutationObserver(() => {
        const found = document.querySelector(
          '.avis-input-hiddens[data-productid="default"]'
        );
        if (found) {
          observer.disconnect();
          resolve(found);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });

    // Extract product properties (e.g. warranty, installation)
    const props = {};
    avisEl
      .querySelectorAll('input[type="hidden"][name^="properties["]')
      .forEach((input) => {
        const name = input.name.match(/properties\[(.+?)\]/)?.[1];
        if (name) props[name] = input.value;
      });

    // Collect selected variants with their calculated quantity
    Object.entries(this.variants).forEach(([type, variant]) => {
      const input = this.querySelector(`#${type}-tiles`);
      const quantity = parseInt(input?.value || 0);
      if (quantity > 0 && variant.available) {
        const itemProps = { ...props, _tile_type: type };
        items.push({ id: variant.id, quantity, properties: itemProps });
      }
    });

    if (!items.length) return;

    // Submit all items to Shopify cart API
    const config = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ items }),
    };

    const response = await fetch(`${routes.cart_add_url}`, config);

    if (response.ok) {
      // Update cart drawer using cart.js and published events
      const finalCartData = await fetch("/cart.js").then((res) => res.json());
      publish(PUB_SUB_EVENTS.cartUpdate, {
        source: "tile-calculator",
        cartData: finalCartData,
      });

      const sectionsResponse = await fetch(
        window.routes.root + "?sections=cart-drawer,cart-icon-bubble"
      );
      const sectionsJson = await sectionsResponse.json();

      const parsedState = {
        id: (await fetch("/cart.js").then((r) => r.json())).id,
        sections: sectionsJson,
      };
      if (this.cart?.renderContents) {
        this.cart.renderContents(parsedState);
      }

      // Reset loading states
      this.btn.classList.remove("loading");
      if (this.cart && this.cart.classList.contains("is-empty"))
        this.cart.classList.remove("is-empty");
      if (!this.error) this.btn.removeAttribute("aria-disabled");
      this.btn.querySelector(".loading__spinner").classList.add("hidden");
    } else {
      // Handle error
      console.warn("❌ Add to cart failed.");
      this.btn.classList.remove("loading");
      if (this.cart && this.cart.classList.contains("is-empty"))
        this.cart.classList.remove("is-empty");
      if (!this.error) this.btn.removeAttribute("aria-disabled");
      this.btn.querySelector(".loading__spinner").classList.add("hidden");
    }
  }
}

customElements.define("tile-calculator", TileCalculator);
