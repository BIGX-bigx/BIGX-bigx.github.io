(function () {
  "use strict";
  var archive = document.querySelector("[data-category-archive]");
  if (!archive) return;
  var search = archive.querySelector("[data-archive-search]");
  var count = archive.querySelector("[data-archive-count]");
  var empty = archive.querySelector("[data-archive-empty]");
  var entries = Array.prototype.slice.call(archive.querySelectorAll("[data-archive-entry]"));
  var groups = Array.prototype.slice.call(archive.querySelectorAll("[data-archive-month]"));
  var indexes = Array.prototype.slice.call(archive.querySelectorAll("[data-archive-index]"));
  if (!search || !count || !empty) return;

  function filterArchive() {
    var query = search.value.trim().toLowerCase();
    var visibleCount = 0;
    entries.forEach(function (entry) {
      entry.hidden = !!query && entry.getAttribute("data-search").indexOf(query) === -1;
      if (!entry.hidden) visibleCount += 1;
    });
    groups.forEach(function (group) {
      var visible = group.querySelectorAll("[data-archive-entry]:not([hidden])").length;
      group.hidden = visible === 0;
      group.querySelector("[data-month-count]").textContent = visible + " 篇";
      indexes.forEach(function (index) {
        if (index.getAttribute("data-archive-index") !== group.id) return;
        index.hidden = group.hidden;
        index.querySelector("[data-month-index-count]").textContent = visible;
      });
    });
    count.textContent = (query ? "找到 " : "") + visibleCount + " 篇文章";
    empty.hidden = visibleCount !== 0;
    empty.textContent = entries.length === 0 ? "这个分类下面还没有文章。" : "没有匹配的文章，试试其他关键词。";
    var layout = archive.querySelector(".category-monthly-layout");
    if (layout) layout.hidden = visibleCount === 0;
  }

  search.addEventListener("input", filterArchive);
  search.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    search.value = "";
    filterArchive();
  });
  filterArchive();
})();
