window.addEventListener('DOMContentLoaded', () => {
    // FAQ
    
    let faqItems = document.querySelectorAll('.faq__item');

    if(faqItems.length){
        faqItems.forEach((item)=>{
            let contentELem = item.querySelector('.faq__item-content'); 
            let btn = item.querySelector('.faq__item-btn'); 

            btn.addEventListener('click',()=>{
                if(!btn.classList.contains('opened')){
                    btn.classList.add('opened');
                    let height = contentELem.scrollHeight;
                    contentELem.style.height = `${height}px`;
                }else{
                    btn.classList.remove('opened');
                    contentELem.style.height = '0px';
                }

                if( !item.classList.contains('opened') ){
                  item.classList.add('opened');
                } else {
                  item.classList.remove('opened');
                }
            })
        })
    }

    

    // TABS SECTION
    let tabsSections = document.querySelectorAll('[data-tabs-section');
    
    if(tabsSections.length){
        tabsSections.forEach((section)=>{
            const btns = section.querySelectorAll('.tab-btn');
            const tabs = section.querySelectorAll('.tabs__item');

            btns.forEach((btn)=>{
                btn.addEventListener('click',()=>{
                    let index = btn.getAttribute('data-index');
                    let activeTab = section.querySelector(`.tabs__item[data-index="${index}"]`);

                    if(activeTab){
                        btns.forEach(button => button.classList.remove('active'));
                        btn.classList.add('active');

                        tabs.forEach(tab => tab.classList.remove('active'));
                        activeTab.classList.add('active');

                        setTimeout(()=>{
                            tabs.forEach(tab => tab.classList.remove('visible'));
                            activeTab.classList.add('visible');
                        },100)
                    }
                })
            })
        })
    }


    // SCROLL TO SECTION

    let scrollToSectionBtns = document.querySelectorAll('[data-scroll-to-section]');

    if(scrollToSectionBtns.length){
        scrollToSectionBtns.forEach((btn)=>{
            let id = btn.getAttribute('data-scroll-to-section');
            let section = document.querySelector(`#${id}`);

            btn.addEventListener('click',()=>{
               if(section){
                section.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
               }
            })
        })
    }

    class ScrollableFaq extends HTMLElement {  
      constructor() {
        super();
        this.buttons = this.querySelectorAll('.scrollable-faq__nav button');
        this.contentBlocks = this.querySelectorAll('.scrollable-faq__item');
        this.activeClass = 'active';
        this.offset = -10;
        this.init();
      }
  
      init(){
          this.buttons.forEach((btn)=>{
              let id = btn.getAttribute('data-scroll-to');
              btn.addEventListener('click',()=>{this.scrollToElement(id)});
          })
  
          window.addEventListener('scroll', () => this.handleScroll());
      }
  
      scrollToElement(id){
          const element = document.querySelector(`#${id}`);
          if (element) {
              const elementTop = element.getBoundingClientRect().top + window.scrollY;
  
              window.scrollTo({
                  top: elementTop - this.offset,
                  behavior: 'smooth'
              });
          }
      }
  
      handleScroll() {
         const scrollPosition = window.scrollY + this.offset;
  
         this.contentBlocks.forEach((block, index) => {
             const blockTop = block.offsetTop;
             const blockBottom = blockTop + block.offsetHeight;
  
             if (scrollPosition >= (blockTop - 50 ) && scrollPosition < blockBottom) {
                 
                 this.setActiveButton(index);
             }
         });
      }
  
      setActiveButton(activeIndex) {
          this.buttons.forEach((btn) => btn.classList.remove(this.activeClass));
  
          this.buttons[activeIndex].classList.add(this.activeClass);
      }
    
    }

    if (window.innerWidth > 749) {
      customElements.define("scrollable-faq", ScrollableFaq);
    }


  if (window.innerWidth <= 749) {
    let scrollToSectionButtons = document.querySelectorAll('[data-scroll-to-mobile]');

    if (scrollToSectionButtons.length) {
        scrollToSectionButtons.forEach((btn) => {

            let id = btn.getAttribute('data-scroll-to-mobile');
            let section = document.querySelector(`#${id}`);
            
            btn.addEventListener('click', () => {
                if (section) {
                    const isVisible = section.classList.contains('visible');
                    const arrow = btn.querySelector('.scrollable-faq__arrow');
                    document.querySelectorAll('.scrollable-faq__item--mob').forEach(item => {
                        item.classList.remove('visible');
                        item.style.height = "0";
                    });
                    document.querySelectorAll('.scrollable-faq__arrow').forEach((arrow) => {
                      arrow.style.transform = 'rotate(0deg)';
                    })
                    
                    if (!isVisible) {
                        section.classList.add('visible');
                        let height = section.scrollHeight;
                        section.style.height = `${height}px`;

                        arrow.style.transform = 'rotate(180deg)';

                        // section.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
                    }
                }
            });
        });
    }
  }

});