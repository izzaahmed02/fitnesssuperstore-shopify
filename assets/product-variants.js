
if(!window.__pmMin){window.__pmMin=1;(function(){
  const e=".product__prices",
        t={
          PRICE:".price-item--sale.price-item--last, .price-item-fixed",
          CMP:".pr_custom_compare_price s",
          SAVE:".you-save",
          VID:".product-variant-id",
          PRODUCT_JSON:'script[type="application/json"][data-product],script[type="application/json"][data-product-json]'
        };

  const o=[];

  // Convert price from cents to Shopify-style formatted price with commas
  function r(e){
    if(!Number.isFinite(+e)) return "$0.00";
    // Using Intl.NumberFormat for commas
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(e/100);
  }

  function n(e){return Number.isFinite(+e)?Math.round(+e):null;}

  function a(e){
    const t=e.closest("[data-product-handle]")?.getAttribute("data-product-handle");
    if(t) return t.replace(/^\/products\//,"").replace(/\/+$/,"");
    const n=e.closest("[data-product-id], .product, section, .card, .grid__item")?.querySelector('a[href*="/products/"]');
    if(n) try{
      const e=new URL(n.href,location.origin),
            t=e.pathname.split("/").filter(Boolean),
            r=t.indexOf("products");
      if(r>=0&&t[r+1]) return t[r+1].replace(/\/+$/,"")
    }catch(e){}
    if(/\/products\//.test(location.pathname)){
      const e=location.pathname.split("/").filter(Boolean),
            t=e.indexOf("products");
      if(t>=0&&e[t+1]) return e[t+1].replace(/\/+$/,"")
    }
    return null
  }

  class i{
    constructor(e){
      this.root=e;
      this.$=(e,t=this.root)=>t.querySelector(e);
      this.$$=(e,t=this.root)=>Array.from(t.querySelectorAll(e));
      this.byId=new Map;
      this.variants=[];
      this.form=null;
      this.boundFormChange=this.onFormChange.bind(this);
    }

    clear(){
      this.$$(t.PRICE).forEach(e=>{e.textContent=e.textContent||"",e.classList.add("pm-empty")});
      const e=this.$(t.CMP); e&&(e.textContent="",e.classList.add("pm-empty"));
      const n=this.$(t.SAVE); n&&(n.textContent="",n.classList.add("pm-empty"))
    }

    paint(e){
      if(!e) return void this.clear();
      this.$$(t.PRICE).forEach(t=>{
        t.textContent=r(n(e.price));
        t.classList.remove("pm-empty")
      });
      const o=e.compare_at_price && n(e.compare_at_price)>n(e.price),
            a=this.$(t.CMP);
      a&&(a.textContent=o?r(n(e.compare_at_price)):"",a.classList.toggle("pm-empty",!o));
      const i=this.$(t.SAVE);
      if(i) if(o){const t=n(e.compare_at_price)-n(e.price); i.textContent="You save "+r(t), i.classList.remove("pm-empty")} else i.textContent="",i.classList.add("pm-empty")
    }

    currentVariantFromId(){
      const e=this.findVariantIdEl(), t=e?.value||e?.getAttribute("value");
      return t?this.byId.get(String(t)):null
    }

    findVariantIdEl(){
      let e=this.$(t.VID);
      if(e) return e;
      if(this.form&&(e=this.form.querySelector(t.VID))) return e;
      return(this.root.closest("[data-product-id], section, .product, .card, .grid__item")||document).querySelector(t.VID)
    }

    currentVariantFromOptions(){
      if(!this.form||!this.variants.length) return null;
      const e=e=>{
        const t=this.form.querySelector(`[name="${e}"]`);
        if(t){if("SELECT"===t.tagName)return t.value;if("hidden"===t.type||"text"===t.type)return t.value}
        const n=this.form.querySelectorAll(`input[name="${e}"]`);
        for(const e of n) if(e.checked) return e.value;
        return null
      }
      const t=e("option1"), n=e("option2"), r=e("option3"), o=[t,n,r].filter(e=>null!=e);
      if(!o.length) return 1===this.variants.length?this.variants[0]:null;
      return this.variants.find(e=>(!o[0]||e.option1===o[0])&&(!o[1]||e.option2===o[1])&&(!o[2]||e.option3===o[2]))||null
    }

    resolveCurrentVariant(){return this.currentVariantFromId()||this.currentVariantFromOptions()||this.variants[0]||null}

    async loadProductData(){
      let e=this.$(t.PRODUCT_JSON);
      if(!e){
        const n=this.root.closest("[data-product-id], section, .product, .card, .grid__item");
        n&&(e=n.querySelector(t.PRODUCT_JSON))
      }
      let n=null;
      if(e) try{n=JSON.parse(e.textContent||"{}")}catch(e){}
      if((!n||!Array.isArray(n.variants)||!n.variants.length)&&(e=a(this.root))) try{const t=await fetch(`/products/${e}.js`); t.ok&&(n=await t.json())}catch(e){}
      if((!n||!Array.isArray(n.variants)||!n.variants.length)&&/\/products\//.test(location.pathname)) try{const e=await fetch(location.pathname.replace(/\/+$/,"")+".js"); e.ok&&(n=await e.json())}catch(e){}
      n&&Array.isArray(n.variants)?(this.variants=n.variants,this.byId=new Map(this.variants.map(e=>[String(e.id),e]))):(this.variants=[],this.byId.clear())
    }

    attachForm(){
      this.form=this.root.closest('form[action*="/cart/add"]')||this.root.parentElement?.querySelector('form[action*="/cart/add"]')||this.root.querySelector('form[action*="/cart/add"]');
      this.form&&!this.form.__pmFormListenerAttached&&(this.form.__pmFormListenerAttached=!0,this.form.addEventListener("change",this.boundFormChange))
    }

    onFormChange(e){
      const t=e.target?.name||"";
      (t.includes("option")||t.includes("id"))&&setTimeout(()=>{o.forEach(e=>(e.form===this.form||a(e.root)===a(this.root))&&e.paint(e.resolveCurrentVariant()))},100)
    }

    async init(){await this.loadProductData(),this.attachForm(),this.paint(this.resolveCurrentVariant())}
  }

  function s(){document.querySelectorAll(e).forEach(e=>{if(e.__pmPricesInit)return;e.__pmPricesInit=!0;const t=new i(e);o.push(t),t.init().catch(()=>{})})}
  document.addEventListener("DOMContentLoaded",s),"loading"!==document.readyState&&s();
  window.MutationObserver&&document.addEventListener("DOMContentLoaded",()=>{new MutationObserver(()=>{s()}).observe(document.body,{childList:!0,subtree:!0})})
})()}



(function(){function getMediaManifest(r){const e=(r||document).querySelector('script[data-product-media]');if(!e)return[];try{return JSON.parse(e.textContent||"[]")}catch(_){return[]}}function safePath(u){try{return new URL(u,location.origin).pathname}catch(_){return String(u||"")}}
const galleryRoot=document.querySelector('product-gallery')||document,mediaList=getMediaManifest(galleryRoot),mediaById=new Map(mediaList.map(m=>[String(m.id),m])),mediaBySrcImg=new Map(mediaList.filter(m=>m.media_type==="image"&&m.preview_image?.src).map(m=>[safePath(m.preview_image.src),m])),variantImageMediaId=new Map();if(window.product&&Array.isArray(window.product.variants)){for(const v of window.product.variants){let imgId=null;if(v.featured_image?.src){const match=mediaBySrcImg.get(safePath(v.featured_image.src));if(match)imgId=String(match.id)}if(!imgId){const firstImg=mediaList.find(m=>m.media_type==="image");if(firstImg)imgId=String(firstImg.id)}if(imgId)variantImageMediaId.set(String(v.id),imgId)}}
let suppressPopupUntil=0;function suppressPopupFor(ms){suppressPopupUntil=Date.now()+(ms||400)}
document.addEventListener("click",function(e){if(Date.now()<suppressPopupUntil){const btn=e.target&&e.target.closest&&e.target.closest("[data-popup-open]");if(btn){e.stopImmediatePropagation();e.preventDefault();return!1}}},!0);
const popupEl=document.getElementById("product-gallery-popup");if(popupEl){const obs=new MutationObserver(()=>{if(Date.now()<suppressPopupUntil&&!popupEl.hasAttribute("hidden"))popupEl.setAttribute("hidden","")});obs.observe(popupEl,{attributes:!0,attributeFilter:["hidden"]})}
function renderMainFromManifest(media){const c=galleryRoot.querySelector(".custom-gallery-main")||galleryRoot.querySelector("[data-main-media-wrapper]");if(!c||!media)return;c.innerHTML="";const wrap=document.createElement("div");wrap.className="main-image-container";wrap.setAttribute("data-media-id",media.id);if(media.media_type==="image"){const w=document.createElement("div");w.className="image-skeleton-wrapper loaded";const img=document.createElement("img");img.className="main-product-image";img.loading="eager";img.alt=media.alt||"";img.src=media.preview_image?.src||"";img.width=media.preview_image?.width||"";img.height=media.preview_image?.height||"";w.appendChild(img);wrap.appendChild(w)}else if(media.media_type==="video"&&Array.isArray(media.sources)&&media.sources.length){const v=document.createElement("video");v.controls=!0;v.muted=!0;v.playsInline=!0;v.preload="metadata";v.poster=media.preview_image?.src||"";const s=document.createElement("source");s.src=media.sources[0].url;s.type=media.sources[0].mime_type||"video/mp4";v.appendChild(s);wrap.appendChild(v)}else if(media.media_type==="external_video"&&media.host&&media.external_id){const f=document.createElement("iframe");f.width="100%";f.height="480";f.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";f.allowFullscreen=!0;if(media.host==="youtube")f.src="https://www.youtube.com/embed/"+media.external_id+"?rel=0&modestbranding=1";else if(media.host==="vimeo")f.src="https://player.vimeo.com/video/"+media.external_id;wrap.appendChild(f)}else if(media.media_type==="model"&&media.url){const mv=document.createElement("model-viewer");mv.setAttribute("src",media.url);mv.setAttribute("camera-controls","true");mv.setAttribute("camera-orbit","0deg 75deg 4m");mv.alt=media.alt||"";wrap.appendChild(mv)}else{const ph=document.createElement("div");ph.className="media-placeholder";ph.textContent="Preview available in popup only.";wrap.appendChild(ph)}c.appendChild(wrap)}
function activateMobileById(id){const slider=document.querySelector(".mobile-gallery-slider");if(!slider)return;const slide=slider.querySelector('.mobile-gallery-slide[data-media-id="'+id+'"]');if(!slide)return;const wrap=slide.closest(".mobile-gallery-slide-wrap")||slide,left=(wrap.offsetLeft||0)-(slider.offsetLeft||0);if(slider.scrollTo){try{slider.scrollTo({left,behavior:"instant"})}catch(_){slider.scrollLeft=left}}else slider.scrollLeft=left;slider.querySelectorAll(".mobile-gallery-slide-wrap, .mobile-gallery-slide").forEach(el=>{el.classList.remove("is-active","active","current")});wrap.classList.add("is-active");const dots=document.querySelector(".mobile-gallery-dots");if(dots){const all=Array.from(slider.querySelectorAll(".mobile-gallery-slide-wrap")),idx=Math.max(0,all.indexOf(wrap)),dotEls=Array.from(dots.children);dotEls.forEach(d=>d.classList.remove("is-active","active","current"));if(dotEls[idx])dotEls[idx].classList.add("is-active")}slider.dispatchEvent(new CustomEvent("mobile-gallery:go-to",{bubbles:!0,detail:{mediaId:String(id)}}))}
function resolveMediaIdFromVariant(variant){if(!variant)return null;const hit=variantImageMediaId.get(String(variant.id));if(hit)return hit;if(variant.featured_image?.src){const match=mediaBySrcImg.get(safePath(variant.featured_image.src));if(match)return String(match.id)}const first=mediaList.find(m=>m.media_type==="image");return first?String(first.id):null}
function activateMediaById(id){if(!id)return;const media=mediaById.get(String(id));renderMainFromManifest(media);activateMobileById(id)}
function onVariantChange(e){suppressPopupFor(600);const variant=e?.detail?.variant||e?.detail?.dataset?.variant||e?.detail,mid=resolveMediaIdFromVariant(variant);if(mid)activateMediaById(mid)}
document.addEventListener("variant:change",onVariantChange);document.addEventListener("variant-change",onVariantChange);
const productForm=document.querySelector('form[action*="/cart/add"]');if(productForm&&!productForm.__variantSyncBound){productForm.__variantSyncBound=!0;productForm.addEventListener("change",function(){setTimeout(()=>{suppressPopupFor(600);try{const idEl=productForm.querySelector(".product-variant-id");if(idEl&&window.product&&Array.isArray(window.product.variants)){const cur=window.product.variants.find(v=>String(v.id)===String(idEl.value)),mid=resolveMediaIdFromVariant(cur);if(mid)activateMediaById(mid)}}catch(_){ }},50)})}
})();




document.addEventListener("DOMContentLoaded", function () {
  let scrollAttached = false;

  function checkScroll() {
    const header = document.querySelector(".header-wrapper");
    const product = document.querySelector(".product");
    const info = document.querySelector(".product__info-wrapper");
    const extra = document.querySelector(".product__extra_info");
    const fixedContainer = document.querySelector(".page-width-desktop.page-width-index");
    if (!header || !product || !info || !extra) return;

    const infoH = info.offsetHeight;
    product.style.minHeight = `${infoH}px`;
    const headerH = header.offsetHeight || 0;
    const scrollY = window.scrollY;
    const winH = window.innerHeight;
    const extraTopDoc = extra.getBoundingClientRect().top + scrollY;
    const extraBottomDoc = extra.getBoundingClientRect().bottom + scrollY;

    // Decide state
    if (scrollY <= headerH) info.classList.remove("fixed","absolute");
    else if (scrollY + winH >= extraBottomDoc) { 
      info.classList.remove("fixed"); info.classList.add("absolute"); info.style.top = `${extra.offsetHeight+headerH}px`;
    }
    else if (scrollY + winH >= extraTopDoc + infoH || (extraTopDoc <= scrollY + winH && extraBottomDoc > scrollY + winH)) {
      info.classList.add("fixed"); info.classList.remove("absolute"); info.style.top="";
    } else {
      info.classList.remove("fixed","absolute"); info.style.top="";
    }

    if (info.classList.contains("fixed") && fixedContainer){
      const cRect = fixedContainer.getBoundingClientRect();
      info.style.left = `${cRect.right - info.offsetWidth -1}px`;
      info.style.right="auto";
    } else { info.style.left=info.style.right=""; }
  }

  function attachScroll() { if(!scrollAttached){ window.addEventListener("scroll", checkScroll, {passive:true}); scrollAttached=true; } }

  // Detect variant changes or other product JS updates
  function hookProductEvents() {
    // Shopify 2.0 style: variant change triggers
    document.querySelectorAll('.product-form input, .product-form select, .product-form .swatch input').forEach(el=>{
      el.addEventListener('change', checkScroll);
      el.addEventListener('click', checkScroll);
    });

    // Also hook any custom event your theme might dispatch (some themes do "variant:change")
    document.addEventListener('variantChange', checkScroll);
  }

  // Run initial setup
  const mm = window.matchMedia("screen and (min-width: 990px)");
  if(mm.matches) attachScroll();

  // Initial check after DOM ready
  requestAnimationFrame(checkScroll);

  // Hook variant/change events
  hookProductEvents();

  // Observe layout changes dynamically
  try {
    const ro = new ResizeObserver(checkScroll);
    ['.product__info-wrapper','.product__extra_info','.product','.header-wrapper'].forEach(sel=>{
      const n=document.querySelector(sel); if(n) ro.observe(n);
    });
  } catch(e){ window.addEventListener("resize", checkScroll); }

  const mo = new MutationObserver(()=>{ if(window.__deb) clearTimeout(window.__deb); window.__deb=setTimeout(checkScroll,80); });
  mo.observe(document.body,{childList:true,subtree:true,attributes:true,characterData:true});
});

