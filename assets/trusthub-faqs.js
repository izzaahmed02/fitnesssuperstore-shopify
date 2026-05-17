document.addEventListener("DOMContentLoaded", function () {
  var containers = document.querySelectorAll(".trusthub-faqs");
  if (!containers.length) return;

  containers.forEach(function (container) {
    var tabs = container.querySelectorAll(".trusthub-faqs__tab");
    var panels = container.querySelectorAll(".trusthub-faqs__panel");
    if (!tabs.length || !panels.length) return;

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

    // Initial pass: accordion.js initialises max-height based on scrollHeight,
    // but panels that start hidden report scrollHeight = 0. Re-measure the
    // currently-active panel after accordion.js has finished its setup.
    requestAnimationFrame(function () {
      panels.forEach(function (panel) {
        if (panel.classList.contains("active")) refreshAccordionHeights(panel);
      });
    });

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
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
  });
});
