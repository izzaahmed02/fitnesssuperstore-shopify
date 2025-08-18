// function paginateManuals(containerSelector, paginationSelector, itemsPerPage = 15) {
//     const container = document.querySelector(containerSelector);
//     const pagination = document.querySelector(paginationSelector);
//     if (!container || !pagination) return;

//     const items = Array.from(container.querySelectorAll("li"));
//     const totalPages = Math.ceil(items.length / itemsPerPage);
//     let currentPage = 1;

//     function scrollToHeading() {
//         const paginationBox = document.querySelector(paginationSelector);
//         const heading = paginationBox?.closest(".manuals-content__col")?.querySelector("h2");

//         if (heading) {
//             const offset = 220; 
//             const top = heading.getBoundingClientRect().top + window.scrollY - offset;
//             window.scrollTo({ top, behavior: "smooth" });
//         }
//     }

    
//     function showPage(page, shouldScroll = false) {
//         currentPage = page;
//         const start = (page - 1) * itemsPerPage;
//         const end = start + itemsPerPage;

//         items.forEach((item, i) => {
//             item.style.display = i >= start && i < end ? "list-item" : "none";
//         });

//         renderPagination();

//         if (shouldScroll) scrollToHeading();
//     }

//     function renderPagination() {
//         pagination.innerHTML = "";

//         if (totalPages <= 1) return;

//         for (let i = 1; i <= totalPages; i++) {
//             const btn = document.createElement("button");
//             btn.textContent = i;
//             btn.className = "pagination-btn" + (i === currentPage ? " active" : "");
//             // 👇 Pass shouldScroll = true on click
//             btn.addEventListener("click", () => showPage(i, true));
//             pagination.appendChild(btn);
//         }
//     }

//     showPage(1); 
// }


// // Run for each list
// document.addEventListener("DOMContentLoaded", function () {
//     paginateManuals(".assembly-manuals", ".assembly-pagination");
//     paginateManuals(".owners-manuals", ".owners-pagination");
// });


$(function(){
  const itemsPerPage = 15;

  $(".manuals-content__col").each(function(){
    const $wrapper = $(this);
    const $items = $wrapper.find(".manuals-list-inner li");
    const $pagination = $wrapper.find(".pagination");
    const totalItems = $items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    let currentPage = 1;

    function showPage(page) {
      currentPage = page;
      $items.hide();
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      $items.slice(start, end).show();

      renderPagination();
    }

    function renderPagination() {
      let html = "";

      // Prev button
      if (currentPage > 1) {
        html += `<span class="pagination-btn prev" data-page="${currentPage-1}"></span>`;
      }

      // Always show first page
      html += `<span class="pagination-btn ${currentPage === 1 ? 'active' : ''}" data-page="1">1</span>`;

      // Window logic
      if (totalPages > 1) {
        if (currentPage <= 3) {
          // Early pages
          for (let i = 2; i <= Math.min(4, totalPages - 1); i++) {
            html += `<span class="pagination-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</span>`;
          }
          if (totalPages > 5) html += `<span class="dots">...</span>`;
        } 
        else if (currentPage >= totalPages - 2) {
          // Last few pages
          if (totalPages > 5) html += `<span class="dots">...</span>`;
          for (let i = totalPages - 3; i < totalPages; i++) {
            if (i > 1) {
              html += `<span class="pagination-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</span>`;
            }
          }
        } 
        else {
          // Middle pages
          html += `<span class="dots">...</span>`;
          for (let i = currentPage - 2; i <= currentPage + 2; i++) {
            if (i > 1 && i < totalPages) {
              html += `<span class="pagination-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</span>`;
            }
          }
          html += `<span class="dots">...</span>`;
        }

        // Always show last page
        html += `<span class="pagination-btn ${currentPage === totalPages ? 'active' : ''}" data-page="${totalPages}">${totalPages}</span>`;
      }

      // Next button
      if (currentPage < totalPages) {
        html += `<span class="pagination-btn next" data-page="${currentPage+1}">&gt;</span>`;
      }

      $pagination.html(html);
    }

    // Handle click
    $pagination.on("click", ".pagination-btn", function(){
      const page = $(this).data("page");
      if (page) showPage(page);
    });

    // Init
    showPage(1);
  });
});







$(".manuals__content").each(function() {
  var $p = $(this).find("p");

  // Clone p to measure real height without clamp
  var $clone = $p.clone().css({
    display: "block",
    '-webkit-line-clamp': 'unset',
    overflow: 'visible',
    position: 'absolute',
    visibility: 'hidden',
    height: 'auto'
  }).appendTo("body");

  var fullHeight = $clone.height();
  var lineHeight = parseFloat($p.css("line-height"));
  var twoLineHeight = lineHeight * 2;
// var twoLineHeight = 40;

  $clone.remove();

  // Only inject "Read more" if text exceeds 2 lines
  if (fullHeight > twoLineHeight) {
    $p.after('<a href="#" class="read-more">Read more</a>');
  }
});

// Toggle
$(document).on("click", ".manuals__content .read-more", function(e) {
  e.preventDefault();
  var $container = $(this).closest(".manuals__content");
  $container.toggleClass("expanded");
  $(this).text($container.hasClass("expanded") ? "Read less" : "Read more");
});
