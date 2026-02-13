// Basic interactivity for nav toggle and video upload/preview
document.addEventListener('DOMContentLoaded', ()=>{
  // Year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Apply saved site name to brand
  const brand = document.querySelector('.brand');
  try {
    const siteName = localStorage.getItem('labSiteName');
    if (siteName && brand) brand.textContent = siteName;
  } catch (e) {}

  // 5 clicks on brand within 3s → enter edit mode
  var brandClickCount = 0;
  var brandClickTimer = null;
  if (brand) {
    brand.style.cursor = 'pointer';
    brand.setAttribute('title', 'Click 5 times quickly to enter edit mode');
    brand.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      brandClickCount += 1;
      clearTimeout(brandClickTimer);
      if (brandClickCount >= 5) {
        brandClickCount = 0;
        try {
          sessionStorage.setItem('labEditMode', 'true');
          window.location.reload();
        } catch (err) {}
        return;
      }
      var left = 5 - brandClickCount;
      brand.setAttribute('title', left + ' more click' + (left !== 1 ? 's' : '') + ' to enter edit mode');
      brandClickTimer = setTimeout(function () {
        brandClickCount = 0;
        brand.setAttribute('title', 'Click 5 times quickly to enter edit mode');
      }, 3000);
    });
  }

  // Nav toggle for small screens
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) toggle.addEventListener('click', function () {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.style.display = expanded ? 'none' : 'flex';
  });

  // Video upload/drag-drop handling (only on pages that have the drop area)
  var dropArea = document.getElementById('drop-area');
  var input = document.getElementById('video-input');
  var preview = document.getElementById('preview-video');
  var fileInfo = document.getElementById('file-info');
  var playBtn = document.getElementById('play-btn');
  var pauseBtn = document.getElementById('pause-btn');
  var snapBtn = document.getElementById('snap-btn');
  if (dropArea && input) {
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
    ['dragenter','dragover','dragleave','drop'].forEach(function (eventName) {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });
    ['dragenter','dragover'].forEach(function (eventName) {
      dropArea.addEventListener(eventName, function () { dropArea.classList.add('hover'); }, false);
    });
    ['dragleave','drop'].forEach(function (eventName) {
      dropArea.addEventListener(eventName, function () { dropArea.classList.remove('hover'); }, false);
    });
    dropArea.addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      var files = dt && dt.files;
      handleFiles(files);
    });
    input.addEventListener('change', function (e) { handleFiles(e.target.files); });
    function handleFiles(files) {
      if (!files || !files.length) return;
      var file = files[0];
      if (!file.type.startsWith('video/')) {
        if (fileInfo) fileInfo.textContent = 'Please select a video file.';
        return;
      }
      if (fileInfo) fileInfo.textContent = 'File: ' + file.name + ' — ' + (file.size/1024/1024).toFixed(2) + ' MB';
      if (preview) {
        var url = URL.createObjectURL(file);
        preview.src = url;
        preview.load();
        preview.addEventListener('loadeddata', function once() {
          preview.removeEventListener('loadeddata', once);
          try {
            var canvas = document.createElement('canvas');
            canvas.width = preview.videoWidth;
            canvas.height = preview.videoHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
            preview.setAttribute('poster', canvas.toDataURL('image/jpeg'));
          } catch (err) { console.warn('Poster capture failed', err); }
        });
      }
    }
    if (playBtn && preview) playBtn.addEventListener('click', function () { preview.play(); });
    if (pauseBtn && preview) pauseBtn.addEventListener('click', function () { preview.pause(); });
    if (snapBtn && preview) snapBtn.addEventListener('click', function () {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = preview.videoWidth || 640;
        canvas.height = preview.videoHeight || 360;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          var a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'poster.jpg';
          document.body.appendChild(a); a.click(); a.remove();
        }, 'image/jpeg');
      } catch (e) { alert('Could not capture frame. Try playing the video and then click Save Poster.'); }
    });
  }

  // Mark active link
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(a=>{
    if(location.pathname.endsWith(a.getAttribute('href')) || (location.pathname === '/' && a.getAttribute('href') === 'index.html')){
      a.classList.add('active');
    }
  });

  // Edit mode is loaded via script tag on all pages; it applies saved content and shows UI when enabled
});