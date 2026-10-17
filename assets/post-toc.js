// Collapse the post "Contents" list on narrow screens. It is open in the HTML,
// so it stays open without JavaScript.
(function () {
  var toc = document.querySelector('.post-toc');
  if (toc && window.matchMedia('(max-width: 40rem)').matches) toc.open = false;
})();
