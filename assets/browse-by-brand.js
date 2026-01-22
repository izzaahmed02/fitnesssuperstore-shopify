// Solution using MutationObserver to continuously monitor and remove invalid ARIA roles
(function() {
  'use strict';
  
  // Function to clean ARIA attributes
  function cleanAriaAttributes() {
    // Remove role="tabpanel" and aria-describedby from all anchor slides
    document.querySelectorAll('.browse-brand .category-tab-content a.slick-slide').forEach(function(slide) {
      if (slide.getAttribute('role') === 'tabpanel') {
        slide.removeAttribute('role');
      }
      if (slide.hasAttribute('aria-describedby')) {
        slide.removeAttribute('aria-describedby');
      }
    });
    
    // Clean dots navigation
    document.querySelectorAll('.browse-brand .slick-dots').forEach(function(dots) {
      // Remove role="tablist" from dots container
      if (dots.getAttribute('role') === 'tablist') {
        dots.removeAttribute('role');
      }
      
      // Remove role from li elements
      dots.querySelectorAll('li').forEach(function(li) {
        if (li.hasAttribute('role')) {
          li.removeAttribute('role');
        }
      });
      
      // Remove tab-related attributes from buttons
      dots.querySelectorAll('button').forEach(function(btn) {
        if (btn.getAttribute('role') === 'tab') {
          btn.removeAttribute('role');
        }
        if (btn.hasAttribute('aria-controls')) {
          btn.removeAttribute('aria-controls');
        }
        if (btn.hasAttribute('aria-selected')) {
          btn.removeAttribute('aria-selected');
        }
      });
    });
  }
  
  // Run immediately when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  function init() {
    // Clean attributes immediately
    cleanAriaAttributes();
    
    // Set up MutationObserver to watch for Slick adding attributes back
    var targetNode = document.querySelector('.browse-brand');
    if (targetNode) {
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'attributes') {
            var attrName = mutation.attributeName;
            if (attrName === 'role' || attrName === 'aria-describedby' || 
                attrName === 'aria-controls' || attrName === 'aria-selected') {
              cleanAriaAttributes();
            }
          }
        });
      });
      
      // Start observing
      observer.observe(targetNode, {
        attributes: true,
        attributeFilter: ['role', 'aria-describedby', 'aria-controls', 'aria-selected'],
        subtree: true
      });
    }
    
    // Also clean on a regular interval as backup
    setInterval(cleanAriaAttributes, 500);
  }
  
  // Also bind to jQuery if available (for Slick events)
  if (window.jQuery) {
    jQuery(document).ready(function($) {
      var $carousel = $('.browse-brand .category-tab-content');
      
      // Clean after Slick events
      $carousel.on('init reInit afterChange breakpoint', function() {
        setTimeout(cleanAriaAttributes, 50);
      });
      
      // If Slick is already initialized, clean now
      if ($carousel.hasClass('slick-initialized')) {
        cleanAriaAttributes();
      }
    });
  }
  
})();