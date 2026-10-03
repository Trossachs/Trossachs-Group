// Runs before first paint so a visitor's saved theme never flashes.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    var saved = localStorage.getItem('tg-theme');
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) {}
})();
