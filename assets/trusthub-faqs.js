document.addEventListener("DOMContentLoaded", function () {
  var containers = document.querySelectorAll(".trusthub-faqs");
  if (!containers.length) return;

  var mobileQuery = window.matchMedia("(max-width: 749px)");

  containers.forEach(function (container) {
    var tabs = container.querySelectorAll(".trusthub-faqs__tab");
    var panels = container.querySelectorAll(".trusthub-faqs__panel");
    if (!panels.length) return;

    function refreshAccordionHeights(panel) {
      panel.querySelectorAll(".accordion-header").forEach(function (header) {
        var content = header.nextElementSibling;
        if (!content) return;
        if (header.getAttribute("aria-expanded") === "true") {
          content.style.maxHeight = content.scrollHeight + "px";
          content.style.opacity = "1";
          content.setAttribute("aria-hidden", "false");
        } else {
          content.style.maxHeight = "0";
          content.style.opacity = "0";
          content.setAttribute("aria-hidden", "true");
        }
      });
    }

    // accordion.js sets max-height from scrollHeight, which is 0 while a
    // panel is hidden. Re-measure once everything has rendered.
    requestAnimationFrame(function () {
      panels.forEach(function (panel) {
        // On mobile all panels are visible, so measure all. On desktop
        // only the active one is visible.
        if (mobileQuery.matches || panel.classList.contains("active")) {
          refreshAccordionHeights(panel);
        }
      });
    });

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        if (mobileQuery.matches) return; // tabs are hidden on mobile

        var targetId = this.getAttribute("data-tab");
        if (!targetId) return;

        tabs.forEach(function (t) {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        this.classList.add("active");
        this.setAttribute("aria-selected", "true");

        panels.forEach(function (panel) {
          if (panel.id === targetId) {
            panel.classList.add("active");
            panel.removeAttribute("hidden");
            refreshAccordionHeights(panel);
          } else {
            panel.classList.remove("active");
            panel.setAttribute("hidden", "");
          }
        });
      });
    });

    // Mobile collapsible group titles
    container.querySelectorAll(".trusthub-faqs__group-title").forEach(function (title) {
      title.addEventListener("click", function () {
        if (!mobileQuery.matches) return; // headers only act on mobile
        var panel = this.closest(".trusthub-faqs__panel");
        if (!panel) return;
        var collapsed = panel.classList.toggle("collapsed");
        this.setAttribute("aria-expanded", collapsed ? "false" : "true");
        if (!collapsed) refreshAccordionHeights(panel);
      });
    });

    // When crossing the desktop/mobile breakpoint, re-measure visible panels
    var onChange = function () {
      panels.forEach(function (panel) {
        if (mobileQuery.matches) {
          panel.removeAttribute("hidden");
        } else if (!panel.classList.contains("active")) {
          panel.setAttribute("hidden", "");
        }
        if (mobileQuery.matches || panel.classList.contains("active")) {
          refreshAccordionHeights(panel);
        }
      });
    };
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener("change", onChange);
    } else if (mobileQuery.addListener) {
      mobileQuery.addListener(onChange);
    }
  });
});
