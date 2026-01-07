const STOREFRONT_API_URL="/api/2023-07/graphql.json",STOREFRONT_ACCESS_TOKEN="c58409094793cba2fc6ce881d45d39f5";function debounce(e,t){let i;return(...s)=>{clearTimeout(i),i=setTimeout(()=>e.apply(this,s),t)}}function escapeRegExp(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}class PredictiveSearch extends SearchForm{constructor(){super(),this.cachedResults={},this.predictiveSearchResults=this.querySelector("[data-predictive-search]"),this.allPredictiveSearchInstances=document.querySelectorAll("predictive-search"),this.isOpen=!1,this.abortController=new AbortController,this.searchTerm="",this.setupEventListeners()}setupEventListeners(){this.input.form.addEventListener("submit",this.onFormSubmit.bind(this)),this.input.addEventListener("focus",this.onFocus.bind(this)),this.addEventListener("focusout",this.onFocusOut.bind(this)),this.addEventListener("keyup",this.onKeyup.bind(this)),this.addEventListener("keydown",this.onKeydown.bind(this)),this.input.addEventListener("input",debounce(this.onChange.bind(this),250)),this.input.addEventListener("paste",()=>{setTimeout(()=>this.onChange(),0)})}getQuery(){return this.input.value.trim()}onChange(){super.onChange();let e=this.getQuery();if(this.searchTerm&&e.startsWith(this.searchTerm)||this.querySelector("#predictive-search-results-groups-wrapper")?.remove(),this.updateSearchForTerm(this.searchTerm,e),this.searchTerm=e,!this.searchTerm.length){this.close(!0);return}this.getSearchResults(this.searchTerm)}onFormSubmit(e){(!this.getQuery().length||this.querySelector('[aria-selected="true"] a'))&&e.preventDefault()}onFormReset(e){super.onFormReset(e),super.shouldResetForm()&&(this.searchTerm="",this.abortController.abort(),this.abortController=new AbortController,this.closeResults(!0))}onFocus(){let e=this.getQuery();e.length&&(this.searchTerm!==e?this.onChange():"true"===this.getAttribute("results")?this.open():this.getSearchResults(this.searchTerm))}onFocusOut(){setTimeout(()=>{this.contains(document.activeElement)||this.close()})}onKeyup(e){switch(this.getQuery().length||this.close(!0),e.preventDefault(),e.code){case"ArrowUp":this.switchOption("up");break;case"ArrowDown":this.switchOption("down");break;case"Enter":this.selectOption()}}onKeydown(e){("ArrowUp"===e.code||"ArrowDown"===e.code)&&e.preventDefault()}updateSearchForTerm(e,t){let i=this.querySelector("[data-predictive-search-search-for-text]"),s=i?.innerText;if(s){let r=escapeRegExp(e),a=s.match(RegExp(r,"gi"));if(a&&a.length>1)return;let n=s.replace(e,t);i.innerText=n}}switchOption(e){if(!this.getAttribute("open"))return;let t="up"===e,i=this.querySelector('[aria-selected="true"]'),s=Array.from(this.querySelectorAll("li, button.predictive-search__item")).filter(e=>null!==e.offsetParent),r=0;if(t&&!i)return;let a=-1,n=0;for(;-1===a&&n<=s.length;)s[n]===i&&(a=n),n++;if(this.statusElement.textContent="",!t&&i?r=a===s.length-1?0:a+1:t&&(r=0===a?s.length-1:a-1),r===a)return;let c=s[r];c.setAttribute("aria-selected",!0),i&&i.setAttribute("aria-selected",!1),this.input.setAttribute("aria-activedescendant",c.id)}selectOption(){let e=this.querySelector('[aria-selected="true"] a, button[aria-selected="true"]');e&&e.click()}getSearchResults(e){let t=e.replace(" ","-").toLowerCase();if(this.setLiveRegionLoadingState(),this.cachedResults[t]){this.renderSearchResults(this.cachedResults[t]);return}let i=fetch(`${routes.predictive_search_url}?q=${encodeURIComponent(e)}&section_id=predictive-search`,{signal:this.abortController.signal}).then(e=>{if(!e.ok)throw Error(e.status);return e.text()}).then(e=>{let t=new DOMParser().parseFromString(e,"text/html").querySelector("#shopify-section-predictive-search");return t?t.innerHTML:""}),s=`
  query($term: String!) {
    products(first: 5, query: $term) {
      edges {
        node {
          id
          title
          handle
          productType
          tags
          variants(first: 1) {
            edges {
              node {
                sku
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
          featuredImage {
            url
            altText
          }
        }
      }
    }
  }
`,r=fetch("/api/2023-07/graphql.json",{method:"POST",headers:{"Content-Type":"application/json","X-Shopify-Storefront-Access-Token":"c58409094793cba2fc6ce881d45d39f5"},body:JSON.stringify({query:s,variables:{term:`sku:${e.toUpperCase()}`}})}).then(e=>e.json()).then(e=>{if(!e.data?.products?.edges.length)return"";let t=["Avis-add-charge","Custom Field More Info","Option Category","Product (Hidden)"],i=["hidden","draft","avisplus-product-options","about_option_categories"],s=e.data.products.edges.filter(({node:e})=>!(t.includes(e.productType)||e.tags.some(e=>i.includes(e.toLowerCase()))));return s.length?this.renderSkuResults(s):""});Promise.all([i,r]).then(([e,i])=>{let s=document.createElement("div");s.innerHTML=e||"";let r=new Set(Array.from(s.querySelectorAll("#predictive-search-results-products-list li a")).map(e=>{let t=e.getAttribute("href")||"";return normalizeHandle(t)}));if(i){let a=document.createElement("div");a.innerHTML=i;let n=Array.from(a.querySelectorAll("li")).filter(e=>{let t=e.querySelector("a");if(!t)return!1;let i=normalizeHandle(t.getAttribute("href"));return!r.has(i)&&(r.add(i),!0)});if(n.length){let c=s.querySelector("#predictive-search-results-products-list");if(c)n.forEach(e=>c.appendChild(e));else{let l=document.createElement("ul");l.id="predictive-search-results-products-list",l.className="predictive-search__list predictive-search__list--products",n.forEach(e=>l.appendChild(e)),s.appendChild(l)}}}let h=s.innerHTML;this.allPredictiveSearchInstances.forEach(e=>{e.cachedResults[t]=h}),this.renderSearchResults(h)}).catch(e=>{if(e?.code!==20)throw this.close(),e})}setLiveRegionLoadingState(){this.statusElement=this.statusElement||this.querySelector(".predictive-search-status"),this.loadingText=this.loadingText||this.getAttribute("data-loading-text"),this.setLiveRegionText(this.loadingText),this.setAttribute("loading",!0)}setLiveRegionText(e){this.statusElement.setAttribute("aria-hidden","false"),this.statusElement.textContent=e,setTimeout(()=>{this.statusElement.setAttribute("aria-hidden","true")},1e3)}renderSearchResults(e){this.predictiveSearchResults.innerHTML=e,this.setAttribute("results",!0),this.setLiveRegionResults(),this.open()}setLiveRegionResults(){this.removeAttribute("loading"),this.setLiveRegionText(this.querySelector("[data-predictive-search-live-region-count-value]").textContent)}getResultsMaxHeight(){return this.resultsMaxHeight=window.innerHeight-document.querySelector(".section-header").getBoundingClientRect().bottom,this.resultsMaxHeight}open(){this.predictiveSearchResults.style.maxHeight=this.resultsMaxHeight||`${this.getResultsMaxHeight()}px`,this.setAttribute("open",!0),this.input.setAttribute("aria-expanded",!0),this.isOpen=!0}close(e=!1){this.closeResults(e),this.isOpen=!1}closeResults(e=!1){e&&(this.input.value="",this.removeAttribute("results"));let t=this.querySelector('[aria-selected="true"]');t&&t.setAttribute("aria-selected",!1),this.input.setAttribute("aria-activedescendant",""),this.removeAttribute("loading"),this.removeAttribute("open"),this.input.setAttribute("aria-expanded",!1),this.resultsMaxHeight=!1,this.predictiveSearchResults.removeAttribute("style")}renderSkuResults(e){let t="";return e.forEach(({node:e},i)=>{let s=e.variants.edges[0]?.node;t+=`
      <li id="predictive-search-option-sku-${i}" 
          class="predictive-search__list-item" 
          role="option" aria-selected="false">
        <a href="/products/${e.handle}" 
           class="predictive-search__item predictive-search__item--link-with-thumbnail link link--text" 
           tabindex="-1">
          ${e.featuredImage?`
            <img class="predictive-search__image" 
                 src="${e.featuredImage.url}&width=150" 
                 alt="${e.featuredImage.altText||e.title}" 
                 width="50" />`:""}

          <div class="predictive-search__item-content">
            <p class="predictive-search__item-heading h5">${e.title}</p>
            <div class="predictive-search__item-vendor">SKU: ${s?.sku||""}</div>
            <div class="price">
              <div class="price__container">
                <div class="price__regular">
                  <span class="visually-hidden visually-hidden--inline">Regular price</span>
                  <span class="price-item-fixed">
                    ${s?.price?.amount?`$${parseFloat(s.price.amount).toLocaleString()} ${s.price.currencyCode}`:""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </a>
      </li>
    `}),t}renderSkuResultsFromVariants(e){let t="";return e.forEach(({node:e},i)=>{let s=e.product;t+=`
      <li id="predictive-search-option-sku-${i}" 
          class="predictive-search__list-item" 
          role="option" aria-selected="false">
        <a href="/products/${s.handle}" 
           class="predictive-search__item predictive-search__item--link-with-thumbnail link link--text" 
           tabindex="-1">
          ${s.featuredImage?`
            <img class="predictive-search__image" 
                 src="${s.featuredImage.url}&width=150" 
                 alt="${s.featuredImage.altText||s.title}" 
                 width="50" />`:""}

          <div class="predictive-search__item-content">
            <p class="predictive-search__item-heading h5">${s.title}</p>
            <div class="predictive-search__item-vendor">SKU: ${e.sku}</div>
            <div class="price">
              <div class="price__container">
                <div class="price__regular">
                  <span class="visually-hidden visually-hidden--inline">Regular price</span>
                  <span class="price-item-fixed">
                    ${e.price?.amount?`$${parseFloat(e.price.amount).toLocaleString()} ${e.price.currencyCode}`:""}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </a>
      </li>
    `}),t}}function normalizeHandle(e){try{let t=new URL(e,window.location.origin);return t.pathname.replace(/^\/products\//,"").replace(/\/$/,"")}catch{return e.replace(/^\/products\//,"").split("?")[0].replace(/\/$/,"")}}customElements.define("predictive-search",PredictiveSearch);