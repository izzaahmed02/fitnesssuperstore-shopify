window.addEventListener('DOMContentLoaded', () => {
    // FAQ
    
    let faqItems = document.querySelectorAll('.faq__item');

    if(faqItems.length){
        faqItems.forEach((item)=>{
            let contentELem = item.querySelector('.faq__item-content'); 
            let btn = item.querySelector('.faq__item-btn'); 

            btn.addEventListener('click',()=>{
                if(!btn.classList.contains('opened')){
                  setTimeout(() => {  
                  btn.classList.add('opened');
                    let height = contentELem.scrollHeight;
                    contentELem.style.height = `${height}px`;
                  }, 50);
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

    if (window.innerWidth <= 749) {
      let dropdownButtons = document.querySelectorAll('.dropdown-btn');
  
      if (dropdownButtons.length) {
          dropdownButtons.forEach((btn) => {
              let section = btn.nextElementSibling;
              
              btn.addEventListener('click', () => {
                  if (section) {
                      const isVisible = section.classList.contains('visible');
                      const arrow = btn.querySelector('.dropdown-btn svg');
                      
                      if (!isVisible) {
                          section.classList.add('visible');
                          let height = section.scrollHeight;
                          section.style.height = `${height}px`;
                          arrow.style.transform = 'rotate(180deg)';
                      } else {
                        section.classList.remove('visible');
                          section.style.height = "0";
                          arrow.style.transform = 'rotate(0deg)';
                      }
                  }
              });
          });
      }
    }

    // IMAGE WITH TEXT DROPDOWNS

    let imageWithTextDropdownButtons = document.querySelectorAll('.image-with-text__dropdown-button');
  
    if (imageWithTextDropdownButtons.length) {
      imageWithTextDropdownButtons.forEach((btn) => {
            let section = btn.nextElementSibling;
            
            btn.addEventListener('click', () => {
                if (section) {
                    const isVisible = section.classList.contains('visible');
                    const arrow = btn.querySelector('svg');
                    
                    if (!isVisible) {
                        section.classList.add('visible');
                        let height = section.scrollHeight;
                        section.style.height = `${height}px`;
                        arrow.style.transform = 'rotate(180deg)';
                    } else {
                      section.classList.remove('visible');
                        section.style.height = "0";
                        arrow.style.transform = 'rotate(0deg)';
                    }
                }
            });
        });
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
                    
                    if (!isVisible) {
                        section.classList.add('visible');
                        let height = section.scrollHeight;
                        section.style.height = `${height}px`;
                        arrow.style.transform = 'rotate(180deg)';

                        // section.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
                    } else {
                      section.classList.remove('visible');
                      section.style.height = '0';
                      arrow.style.transform = 'rotate(0deg)';
                    }
                }
            });
        });
    }
  }

  // Calculate order form (body scrolling prevent)
  const calculateButtons = document.querySelectorAll('.button.globo-formbuilder-open');
  calculateButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('body').style.overflow = 'hidden';

      setTimeout(() => {
        const closeCalculateFormBtn = document.querySelector('.header.dismiss');
      closeCalculateFormBtn.addEventListener('click', () => {
        document.querySelector('body').style.overflow = 'auto';
      })
      }, 500)
    })
  });

  const link = document.getElementById('paytomorrow-link');
  if (link) {
      link.addEventListener('click', (event) => {
          event.preventDefault(); 
          window.open(
              'https://api.paytomorrow.com/api/ecommerce/public/pre-approval/a4f00e481c4f3e28756375f86d272b22',
              '_blank',
              'location=yes,height=670,width=500,scrollbars=yes,status=yes'
          );
      });
  }

  // MENU MOBILE ACCORDION

  const menuAccordionButtons = document.querySelectorAll('.accordion-item');

if (menuAccordionButtons.length) {
    menuAccordionButtons.forEach((btn) => {
        const content = btn.nextElementSibling;

        btn.addEventListener('click', () => {
            if (content) {
                const isVisible = content.classList.contains('visible');
                const plus = btn.querySelector('.icon-plus');
                const minus = btn.querySelector('.icon-minus');
                const arrow = btn.querySelector('.arrow');

                if (!isVisible) {
                    content.classList.add('visible');
                    let height = content.scrollHeight;
                    content.style.height = `${height}px`;

                    if (plus && minus) {
                      plus.style.display = 'none';
                      minus.style.display = 'block';
                    } else if (arrow) {
                      arrow.style.transform = 'rotate(180deg)';
                    }
                } else {
                    content.classList.remove('visible');
                    content.style.height = '0';

                    if (plus && minus) {
                      plus.style.display = 'block';
                      minus.style.display = 'none';
                    } else if (arrow) {
                      arrow.style.transform = 'rotate(0deg)';
                    }
                }
            }
        });
    });
}

const thirdLevelButtons = document.querySelectorAll('.accordion-item--second-level');

if (thirdLevelButtons.length) {
    thirdLevelButtons.forEach((btn) => {
        const thirdLevelContent = btn.nextElementSibling;
        const parentContainer = thirdLevelContent.closest('.menu--second-level').parentElement;
        const plusIcon = btn.querySelector('.icon-plus');
        const minusIcon = btn.querySelector('.icon-minus');
        const arrowIcon = btn.querySelector('.arrow');

        btn.addEventListener('click', () => {
            if (thirdLevelContent) {
                const isVisible = thirdLevelContent.classList.contains('visible');

                if (!isVisible) {
                    thirdLevelContent.classList.add('visible');
                    thirdLevelContent.style.maxHeight = `${thirdLevelContent.scrollHeight}px`;
                    parentContainer.style.height = 'auto';
                    if (plusIcon && minusIcon) {
                      plusIcon.style.display = 'none';
                      minusIcon.style.display = 'block';
                    } else if (arrowIcon) {
                      arrowIcon.style.transform = 'rotate(180deg)';
                    }
                    
                } else {
                    thirdLevelContent.classList.remove('visible');
                    thirdLevelContent.style.maxHeight = '0';
                    if (plusIcon && minusIcon) {
                      plusIcon.style.display = 'block';
                      minusIcon.style.display = 'none';
                    } else if (arrowIcon) {
                      arrowIcon.style.transform = 'rotate(0deg)';
                    }
                }
            }
        });

        thirdLevelContent.addEventListener('transitionend', () => {
            if (!thirdLevelContent.classList.contains('visible')) {
                thirdLevelContent.style.maxHeight = null;
            }
        });
    });
}

});


// GRID INFO BLOCKS SCROLLING LOGIC

const mainBlocks = document.querySelectorAll('.info-grid__item.grid__item .link-style');
const contentSections = document.querySelectorAll('.feature-block-container.content-section');

const isMobile = () => window.innerWidth <= 750;

const moveSectionsToMain = () => {
  if (mainBlocks.length && contentSections.length) {
    mainBlocks.forEach((block) => {
      const targetId = block.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);

      if (isMobile() && targetSection) {
        block.before(targetSection);
      } else {
        const originalContainer = document.querySelector(`.container-${targetId}`);
        if (originalContainer && !originalContainer.contains(targetSection)) {
          originalContainer.appendChild(targetSection);
        }
      }
    });
  }
};

const toggleSectionVisibility = (targetId) => {
  const targetSection = document.getElementById(targetId);

  if (targetSection) {
    const button = document.querySelector(`[data-target="${targetId}"]`);
    const isOpened = targetSection.classList.contains('active');

    if (!isOpened) {
      targetSection.classList.add('active');
      targetSection.style.maxHeight = '2500px';
      button?.classList.add('active');
      button.querySelector('span').textContent = "Show less";
    } else {
      targetSection.style.maxHeight = '0px';
      targetSection.classList.remove('active');
      button?.classList.remove('active');
      button.querySelector('span').textContent = "Learn more";
    }
  }
};

const enableDesktopScrolling = () => {
  if (mainBlocks.length) {
    mainBlocks.forEach((btn) => {
      const id = btn.getAttribute('data-target');
      const section = document.querySelector(`#${id}`);

      btn.addEventListener('click', (event) => {
        event.preventDefault();
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
        }
      });
    });
  }
};

const initializeScrolling = () => {
  if (mainBlocks.length && contentSections.length) {
    if (isMobile()) {
      // Mobile logic
      mainBlocks.forEach((block) => {
        block.addEventListener('click', (event) => {
          event.preventDefault();
          const targetId = block.getAttribute('data-target');
          toggleSectionVisibility(targetId);
        });
      });
      moveSectionsToMain();
      window.addEventListener('resize', moveSectionsToMain);
    } else {
      // Desktop logic
      enableDesktopScrolling();
    }
  }
};

initializeScrolling();
window.addEventListener('resize', initializeScrolling);
