(function () {
    'use strict';
    document.addEventListener('DOMContentLoaded', function () {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        if (!accordionHeaders.length) return;
        
        let currentlyOpenAccordion = null;

        accordionHeaders.forEach((header) => {
            const content = header.nextElementSibling;
            if (!content) return;
            
            content.style.transition = 'max-height 0.3s ease, opacity 0.2s ease';
            content.style.overflow = 'hidden';
            content.style.opacity = header.getAttribute('aria-expanded') === 'true' ? '1' : '0';

            const initiallyExpanded = header.getAttribute('aria-expanded') === 'true';
            const links = content.querySelectorAll('a');
            
            links.forEach(link => {
                link.setAttribute('tabindex', initiallyExpanded ? '0' : '-1');
            });

            if (initiallyExpanded) {
                currentlyOpenAccordion = { header, content, links };
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '0';
            }

            header.addEventListener('click', function () {
                const isExpanded = this.getAttribute('aria-expanded') === 'true';
                
                if (currentlyOpenAccordion && 
                    currentlyOpenAccordion.header !== this && 
                    currentlyOpenAccordion.header.getAttribute('aria-expanded') === 'true') {
                    
                    const prevContent = currentlyOpenAccordion.content;
                    currentlyOpenAccordion.header.setAttribute('aria-expanded', 'false');
                    
                    prevContent.style.maxHeight = '0';
                    prevContent.style.opacity = '0';
                    
                    setTimeout(() => {
                        prevContent.setAttribute('aria-hidden', 'true');
                    }, 300);
                    
                    currentlyOpenAccordion.links.forEach(link => {
                        link.setAttribute('tabindex', '-1');
                    });
                }

                this.setAttribute('aria-expanded', String(!isExpanded));
                if (!isExpanded) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    content.style.opacity = '1';
                    content.setAttribute('aria-hidden', 'false');
                    
                    links.forEach(link => {
                        link.setAttribute('tabindex', '0');
                    });
                    currentlyOpenAccordion = { header: this, content, links };
                } else {
                    content.style.maxHeight = '0';
                    content.style.opacity = '0';
                    
                    setTimeout(() => {
                        content.setAttribute('aria-hidden', 'true');
                    }, 300);
                    
                    links.forEach(link => {
                        link.setAttribute('tabindex', '-1');
                    });
                    currentlyOpenAccordion = null;
                }
            });

            window.addEventListener('resize', function() {
                if (header.getAttribute('aria-expanded') === 'true') {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });
   });
})();