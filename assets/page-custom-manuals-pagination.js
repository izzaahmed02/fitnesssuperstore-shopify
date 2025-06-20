function paginateManuals(containerSelector, paginationSelector, itemsPerPage = 15) {
    const container = document.querySelector(containerSelector);
    const pagination = document.querySelector(paginationSelector);
    if (!container || !pagination) return;

    const items = Array.from(container.querySelectorAll("li"));
    const totalPages = Math.ceil(items.length / itemsPerPage);
    let currentPage = 1;

    function scrollToHeading() {
        const paginationBox = document.querySelector(paginationSelector);
        const heading = paginationBox?.closest(".manuals-content__col")?.querySelector("h2");

        if (heading) {
            const offset = 220; 
            const top = heading.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: "smooth" });
        }
    }

    
    function showPage(page, shouldScroll = false) {
        currentPage = page;
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;

        items.forEach((item, i) => {
            item.style.display = i >= start && i < end ? "list-item" : "none";
        });

        renderPagination();

        if (shouldScroll) scrollToHeading();
    }

    function renderPagination() {
        pagination.innerHTML = "";

        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            btn.className = "pagination-btn" + (i === currentPage ? " active" : "");
            // 👇 Pass shouldScroll = true on click
            btn.addEventListener("click", () => showPage(i, true));
            pagination.appendChild(btn);
        }
    }

    showPage(1); 
}


// Run for each list
document.addEventListener("DOMContentLoaded", function () {
    paginateManuals(".assembly-manuals", ".assembly-pagination");
    paginateManuals(".owners-manuals", ".owners-pagination");
});