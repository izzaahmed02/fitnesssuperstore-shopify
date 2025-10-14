if (!customElements.get('product-form-with-options')) {
  customElements.define(
    'product-form-with-options',
    class ProductFormWithOptions extends HTMLElement {
      constructor() {
        super();
      }
    }
  );
}
