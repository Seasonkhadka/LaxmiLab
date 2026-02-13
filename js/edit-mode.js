(function () {
  'use strict';

  var storage = {
    get: function (key) {
      try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    set: function (key, val) {
      try {
        localStorage.setItem(key, JSON.stringify(val));
      } catch (e) {}
    }
  };

  // ---------- Apply saved data to DOM ----------
  function applyMediaFromStorage() {
    var main = storage.get('labMediaMain');
    var gallery = storage.get('labMediaGallery');
    var videos = storage.get('labMediaVideos');
    var mainImg = document.querySelector('.media-main-photo');
    var mainCap = document.querySelector('.media-main-caption');
    var grid = document.querySelector('.media-grid');
    if (main && main.src && mainImg) mainImg.src = main.src;
    if (main && main.caption && mainCap) mainCap.textContent = main.caption;
    if (Array.isArray(gallery) && gallery.length && grid) {
      grid.innerHTML = gallery.map(function (item) {
        return '<article class="media-card">' +
          '<div class="media-card-photo-wrap">' +
          '<img src="' + escapeHtml(item.src || '') + '" alt="' + escapeHtml(item.alt || '') + '" class="media-card-photo" width="400" height="280" loading="lazy">' +
          '</div>' +
          '<p class="media-card-desc">' + escapeHtml(item.desc || '') + '</p>' +
          '</article>';
      }).join('');
    }
    var videoSection = document.getElementById('lab-media-videos');
    if (Array.isArray(videos) && videos.length) {
      if (!videoSection) {
        var gallerySection = document.querySelector('.media-gallery');
        if (gallerySection) {
          var wrap = document.createElement('section');
          wrap.className = 'media-gallery';
          wrap.setAttribute('aria-label', 'Videos');
          wrap.innerHTML = '<h2 class="media-gallery-heading">Videos</h2><div id="lab-media-videos" class="media-videos-list"></div>';
          gallerySection.parentNode.insertBefore(wrap, gallerySection.nextSibling);
        }
        videoSection = document.getElementById('lab-media-videos');
      }
      if (videoSection) {
        videoSection.innerHTML = videos.map(function (v) {
          return '<div class="media-video-item">' +
            '<iframe title="' + escapeHtml(v.title || 'Video') + '" src="' + escapeHtml(embedVideoUrl(v.url)) + '" allowfullscreen></iframe>' +
            '<p class="media-card-desc">' + escapeHtml(v.title || '') + '</p></div>';
        }).join('');
      }
    } else if (videoSection) {
      videoSection.innerHTML = '';
    }
  }

  function embedVideoUrl(url) {
    if (!url) return '';
    if (url.includes('youtube.com/watch')) {
      var m = url.match(/[?&]v=([^&]+)/);
      return m ? 'https://www.youtube.com/embed/' + m[1] : url;
    }
    if (url.includes('youtu.be/')) {
      var parts = url.split('youtu.be/')[1];
      var id = parts ? parts.split('?')[0] : '';
      return id ? 'https://www.youtube.com/embed/' + id : url;
    }
    return url;
  }

  function applyTeamFromStorage() {
    var members = storage.get('labTeamMembers');
    var grid = document.querySelector('.team-grid');
    if (!Array.isArray(members) || !members.length || !grid) return;
    grid.innerHTML = members.map(function (m, i) {
      var featured = m.featured ? ' team-card-featured' : '';
      var degree = m.degree ? '<p class="team-card-degree">' + escapeHtml(m.degree) + '</p>' : '';
      return '<article class="team-card' + featured + '">' +
        '<div class="team-card-photo-wrap">' +
        '<img src="' + escapeHtml(m.photo || '') + '" alt="' + escapeHtml(m.name || '') + '" class="team-card-photo" width="400" height="420" loading="lazy">' +
        '</div>' +
        '<div class="team-card-info">' +
        '<h2 class="team-card-name">' + escapeHtml(m.name || '') + '</h2>' + degree +
        '<p class="team-card-role">' + escapeHtml(m.role || '') + '</p>' +
        '</div></article>';
    }).join('');
  }

  function applyPublicationFromStorage() {
    var list = storage.get('labPublications');
    var container = document.querySelector('.pub-timeline');
    if (!Array.isArray(list) || !list.length || !container) return;
    var byYear = {};
    list.forEach(function (p) {
      var y = (p.year || '').toString().trim();
      if (y.toLowerCase() === 'earlier work') y = 'archive';
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push({ title: p.title || '', year: p.year || y });
    });
    var keys = Object.keys(byYear);
    keys.sort(function (a, b) {
      if (a === 'archive') return 1;
      if (b === 'archive') return -1;
      var na = Number(a);
      var nb = Number(b);
      if (isNaN(na) && isNaN(nb)) return a < b ? 1 : -1;
      if (isNaN(na)) return 1;
      if (isNaN(nb)) return -1;
      return nb - na;
    });
    container.innerHTML = keys.map(function (key) {
      var items = byYear[key];
      if (!items || !items.length) return '';
      var isArchive = key === 'archive';
      var badgeClass = isArchive ? 'pub-badge pub-badge-archive' : 'pub-badge';
      var groupClass = isArchive ? 'pub-year-group pub-year-group-archive' : 'pub-year-group';
      var label = isArchive ? 'Earlier work' : key;
      var itemHtml = items.map(function (it) {
        var badgeVal = isArchive ? (it.year && it.year !== 'archive' ? it.year : label) : key;
        return '<li class="pub-item">' +
          '<span class="' + badgeClass + '">' + escapeHtml(badgeVal) + '</span>' +
          '<p class="pub-title">' + escapeHtml(it.title) + '</p></li>';
      }).join('');
      return '<section class="' + groupClass + '" data-year="' + escapeHtml(key) + '">' +
        '<h2 class="pub-year">' + escapeHtml(label) + '</h2>' +
        '<ul class="pub-list">' + itemHtml + '</ul></section>';
    }).join('');
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  window.applyLabMediaFromStorage = applyMediaFromStorage;
  window.applyLabTeamFromStorage = applyTeamFromStorage;
  window.applyLabPublicationFromStorage = applyPublicationFromStorage;

  // Apply saved content on load (so edits persist)
  var path = (location.pathname || '').toLowerCase();
  if (path.includes('media')) applyMediaFromStorage();
  if (path.includes('team')) applyTeamFromStorage();
  if (path.includes('publication')) applyPublicationFromStorage();

  // ---------- Edit mode UI ----------
  if (sessionStorage.getItem('labEditMode') !== 'true') return;

  var style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = 'css/edit-mode.css';
  document.head.appendChild(style);

  var banner = document.createElement('div');
  banner.className = 'lab-edit-banner';
  banner.innerHTML = '<span class="lab-edit-banner-text">Edit mode — edit content below, then click Save. When done, click the button to exit.</span>' +
    '<button type="button" class="lab-edit-exit" title="Click to leave edit mode">Exit edit mode</button>';
  document.body.insertBefore(banner, document.body.firstChild);

  banner.querySelector('.lab-edit-exit').addEventListener('click', function () {
    sessionStorage.removeItem('labEditMode');
    window.location.reload();
  });

  var path = (location.pathname || '').toLowerCase();

  // ---------- Media edit panel ----------
  if (path.includes('media')) {
    var mainContainer = document.querySelector('.media-main-container');
    if (mainContainer) {
      var mainImg = document.querySelector('.media-main-photo');
      var mainCap = document.querySelector('.media-main-caption');
      var gallery = storage.get('labMediaGallery');
      if (!gallery || !gallery.length) {
        gallery = [];
        document.querySelectorAll('.media-card').forEach(function (card) {
          var img = card.querySelector('.media-card-photo');
          var desc = card.querySelector('.media-card-desc');
          gallery.push({ src: img?.src || '', alt: img?.alt || '', desc: desc?.textContent || '' });
        });
      }
      var mainData = storage.get('labMediaMain') || {};
      if (!mainData.src && mainImg) mainData.src = mainImg.src;
      if (mainData.caption === undefined && mainCap) mainData.caption = mainCap.textContent || '';
      var videos = storage.get('labMediaVideos') || [];

      var panel = document.createElement('div');
      panel.className = 'lab-edit-panel';
      panel.innerHTML =
        '<h3>Edit Media</h3>' +
        '<div class="lab-edit-field">' +
        '<label>Main photo</label>' +
        '<input type="file" id="lab-main-file" accept="image/*" style="display:none">' +
        '<button type="button" class="lab-edit-upload-btn" id="lab-main-upload-btn">Upload photo from PC</button>' +
        '<span id="lab-main-file-status" class="lab-file-status"></span>' +
        '</div>' +
        '<div class="lab-edit-field">' +
        '<label>Main caption</label>' +
        '<input type="text" id="lab-main-caption" value="' + escapeHtml((mainData && mainData.caption) || '') + '" placeholder="Caption">' +
        '</div>' +
        '<h4>Gallery images</h4>' +
        '<div id="lab-gallery-fields"></div>' +
        '<button type="button" class="lab-edit-add" data-add="gallery">+ Add image</button>' +
        '<h4>Videos (paste YouTube link)</h4>' +
        '<div id="lab-video-fields"></div>' +
        '<button type="button" class="lab-edit-add" data-add="video">+ Add video</button>' +
        '<button type="button" class="lab-edit-save" data-save="media">Save</button>';

      var mainFileInput = panel.querySelector('#lab-main-file');
      var mainUploadBtn = panel.querySelector('#lab-main-upload-btn');
      var mainFileStatus = panel.querySelector('#lab-main-file-status');
      mainUploadBtn.addEventListener('click', function () { mainFileInput.click(); });
      mainFileInput.addEventListener('change', function () {
        var file = mainFileInput.files && mainFileInput.files[0];
        if (!file || !file.type.startsWith('image/')) { mainFileStatus.textContent = 'Please choose an image.'; return; }
        if (file.size > 3 * 1024 * 1024) { mainFileStatus.textContent = 'Image too large (max ~3MB).'; return; }
        var reader = new FileReader();
        reader.onload = function () { mainData.src = reader.result; mainFileStatus.textContent = 'Photo set.'; };
        reader.readAsDataURL(file);
      });
      if (mainData && mainData.src && mainData.src.slice(0, 5) === 'data:') mainFileStatus.textContent = 'Photo set.';

      function readFileAsDataUrl(file, callback) {
        if (!file || !file.type.startsWith('image/')) { callback(''); return; }
        if (file.size > 3 * 1024 * 1024) { callback(''); return; }
        var reader = new FileReader();
        reader.onload = function () { callback(reader.result); };
        reader.readAsDataURL(file);
      }

      function renderGalleryFields() {
        var container = document.getElementById('lab-gallery-fields');
        if (!container) return;
        container.innerHTML = gallery.map(function (item, i) {
          return '<div class="lab-edit-row" data-index="' + i + '">' +
            '<input type="file" accept="image/*" class="lab-gallery-file" data-gallery-index="' + i + '" style="display:none">' +
            '<button type="button" class="lab-edit-upload-btn lab-gallery-upload" data-gallery-index="' + i + '">Upload image</button>' +
            '<span class="lab-file-status lab-gallery-status" data-gallery-index="' + i + '">' + (item.src && item.src.slice(0, 5) === 'data:' ? 'Image set.' : '') + '</span>' +
            '<input type="text" placeholder="Description" value="' + escapeHtml(item.desc || '') + '" data-gallery-desc="">' +
            '<button type="button" class="lab-edit-remove" data-remove="gallery" data-index="' + i + '">Remove</button>' +
            '</div>';
        }).join('');
        container.querySelectorAll('.lab-gallery-upload').forEach(function (btn) {
          var idx = parseInt(btn.getAttribute('data-gallery-index'), 10);
          var fileInput = container.querySelector('.lab-gallery-file[data-gallery-index="' + idx + '"]');
          var statusEl = container.querySelector('.lab-gallery-status[data-gallery-index="' + idx + '"]');
          btn.addEventListener('click', function () { fileInput.click(); });
          fileInput.addEventListener('change', function () {
            var file = fileInput.files && fileInput.files[0];
            if (!file) return;
            readFileAsDataUrl(file, function (dataUrl) {
              if (dataUrl) { gallery[idx].src = dataUrl; if (statusEl) statusEl.textContent = 'Image set.'; }
              else if (statusEl) statusEl.textContent = 'Use image under ~3MB.';
            });
          });
        });
        container.querySelectorAll('[data-remove="gallery"]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var i = parseInt(btn.getAttribute('data-index'), 10);
            gallery.splice(i, 1);
            renderGalleryFields();
          });
        });
      }
      function renderVideoFields() {
        var container = document.getElementById('lab-video-fields');
        if (!container) return;
        container.innerHTML = videos.map(function (v, i) {
          return '<div class="lab-edit-row">' +
            '<input type="url" placeholder="Video URL (YouTube)" value="' + escapeHtml(v.url || '') + '" data-video-url="">' +
            '<input type="text" placeholder="Title" value="' + escapeHtml(v.title || '') + '" data-video-title="">' +
            '<button type="button" class="lab-edit-remove" data-remove-video data-index="' + i + '">Remove</button>' +
            '</div>';
        }).join('');
        container.querySelectorAll('[data-remove-video]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            videos.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
            renderVideoFields();
          });
        });
      }
      renderGalleryFields();
      renderVideoFields();

      panel.querySelector('[data-add="gallery"]').addEventListener('click', function () {
        gallery.push({ src: '', alt: '', desc: '' });
        renderGalleryFields();
      });
      panel.querySelector('[data-add="video"]').addEventListener('click', function () {
        videos.push({ url: '', title: '' });
        renderVideoFields();
      });

      panel.querySelector('[data-save="media"]').addEventListener('click', function () {
        var mainCaptionEl = document.getElementById('lab-main-caption');
        var mainCaption = mainCaptionEl ? mainCaptionEl.value.trim() : '';
        storage.set('labMediaMain', { src: mainData.src || '', caption: mainCaption });

        var newGallery = [];
        panel.querySelectorAll('#lab-gallery-fields .lab-edit-row').forEach(function (row) {
          var idx = parseInt(row.getAttribute('data-index'), 10);
          var descIn = row.querySelector('input[data-gallery-desc]');
          newGallery.push({ src: (gallery[idx] && gallery[idx].src) || '', alt: '', desc: descIn ? descIn.value.trim() : '' });
        });
        storage.set('labMediaGallery', newGallery);

        var newVideos = [];
        panel.querySelectorAll('#lab-video-fields .lab-edit-row').forEach(function (row) {
          var urlIn = row.querySelector('[data-video-url]');
          var titleIn = row.querySelector('[data-video-title]');
          newVideos.push({ url: urlIn?.value?.trim() || '', title: titleIn?.value?.trim() || '' });
        });
        storage.set('labMediaVideos', newVideos.filter(function (v) { return v.url; }));

        applyMediaFromStorage();
        alert('Media saved.');
      });

      mainContainer.appendChild(panel);
    }
  }

  // ---------- Team edit panel ----------
  if (path.includes('team')) {
    var teamGrid = document.querySelector('.team-grid');
    if (teamGrid) {
      var members = storage.get('labTeamMembers');
      if (!members || !members.length) {
        members = [];
        teamGrid.querySelectorAll('.team-card').forEach(function (card) {
          var img = card.querySelector('.team-card-photo');
          var name = card.querySelector('.team-card-name');
          var degree = card.querySelector('.team-card-degree');
          var role = card.querySelector('.team-card-role');
          members.push({
            photo: img?.src || '',
            name: name?.textContent || '',
            degree: degree?.textContent || '',
            role: role?.textContent || '',
            featured: card.classList.contains('team-card-featured')
          });
        });
      }

      var panel = document.createElement('div');
      panel.className = 'lab-edit-panel';
      panel.innerHTML = '<h3>Edit Team</h3><div id="lab-team-fields"></div>' +
        '<button type="button" class="lab-edit-add" data-add="member">+ Add member</button>' +
        '<button type="button" class="lab-edit-save" data-save="team">Save</button>';

      function renderTeamFields() {
        var container = document.getElementById('lab-team-fields');
        if (!container) return;
        container.innerHTML = members.map(function (m, i) {
          return '<div class="lab-edit-row lab-edit-row-team" data-member-index="' + i + '">' +
            '<input type="file" accept="image/*" class="lab-team-file" data-member-index="' + i + '" style="display:none">' +
            '<button type="button" class="lab-edit-upload-btn lab-team-upload" data-member-index="' + i + '">Upload photo</button>' +
            '<span class="lab-file-status lab-team-status" data-member-index="' + i + '">' + (m.photo && m.photo.slice(0, 5) === 'data:' ? 'Photo set.' : '') + '</span>' +
            '<input type="text" placeholder="Name" value="' + escapeHtml(m.name || '') + '" data-member-name="">' +
            '<input type="text" placeholder="Degree (e.g. Ph.D.)" value="' + escapeHtml(m.degree || '') + '" data-member-degree="">' +
            '<input type="text" placeholder="Role" value="' + escapeHtml(m.role || '') + '" data-member-role="">' +
            '<label><input type="checkbox" data-member-featured="" ' + (m.featured ? 'checked' : '') + '> Featured</label>' +
            '<button type="button" class="lab-edit-remove" data-remove-member data-index="' + i + '">Remove</button>' +
            '</div>';
        }).join('');
        container.querySelectorAll('.lab-team-upload').forEach(function (btn) {
          var idx = parseInt(btn.getAttribute('data-member-index'), 10);
          var fileInput = container.querySelector('.lab-team-file[data-member-index="' + idx + '"]');
          var statusEl = container.querySelector('.lab-team-status[data-member-index="' + idx + '"]');
          btn.addEventListener('click', function () { fileInput.click(); });
          fileInput.addEventListener('change', function () {
            var file = fileInput.files && fileInput.files[0];
            if (!file) return;
            readFileAsDataUrl(file, function (dataUrl) {
              if (dataUrl) { members[idx].photo = dataUrl; if (statusEl) statusEl.textContent = 'Photo set.'; }
              else if (statusEl) statusEl.textContent = 'Use image under ~3MB.';
            });
          });
        });
        container.querySelectorAll('[data-remove-member]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            members.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
            renderTeamFields();
          });
        });
      }
      function readFileAsDataUrl(file, callback) {
        if (!file || !file.type.startsWith('image/')) { callback(''); return; }
        if (file.size > 3 * 1024 * 1024) { callback(''); return; }
        var reader = new FileReader();
        reader.onload = function () { callback(reader.result); };
        reader.readAsDataURL(file);
      }
      renderTeamFields();

      panel.querySelector('[data-add="member"]').addEventListener('click', function () {
        members.push({ photo: '', name: '', degree: '', role: '', featured: false });
        renderTeamFields();
      });

      panel.querySelector('[data-save="team"]').addEventListener('click', function () {
        var newMembers = [];
        panel.querySelectorAll('#lab-team-fields .lab-edit-row-team').forEach(function (row) {
          var idx = parseInt(row.getAttribute('data-member-index'), 10);
          var m = members[idx];
          newMembers.push({
            photo: (m && m.photo) || '',
            name: (row.querySelector('[data-member-name]') && row.querySelector('[data-member-name]').value.trim()) || '',
            degree: (row.querySelector('[data-member-degree]') && row.querySelector('[data-member-degree]').value.trim()) || '',
            role: (row.querySelector('[data-member-role]') && row.querySelector('[data-member-role]').value.trim()) || '',
            featured: !!(row.querySelector('[data-member-featured]') && row.querySelector('[data-member-featured]').checked)
          });
        });
        storage.set('labTeamMembers', newMembers);
        applyTeamFromStorage();
        alert('Team saved.');
      });

      teamGrid.parentNode.appendChild(panel);
    }
  }

  // ---------- Publication edit panel ----------
  if (path.includes('publication')) {
    var pubTimeline = document.querySelector('.pub-timeline');
    if (pubTimeline) {
      var list = storage.get('labPublications');
      if (!list || !list.length) {
        list = [];
        pubTimeline.querySelectorAll('.pub-item').forEach(function (item) {
          var badge = item.querySelector('.pub-badge');
          var title = item.querySelector('.pub-title');
          var year = badge?.textContent?.trim() || '';
          if (year === 'Earlier work') year = 'archive';
          list.push({ year: year, title: title?.textContent?.trim() || '' });
        });
      }

      var panel = document.createElement('div');
      panel.className = 'lab-edit-panel';
      panel.innerHTML = '<h3>Edit Publications</h3><div id="lab-pub-fields"></div>' +
        '<button type="button" class="lab-edit-add" data-add="pub">+ Add publication</button>' +
        '<button type="button" class="lab-edit-save" data-save="pub">Save</button>';

      function renderPubFields() {
        var container = document.getElementById('lab-pub-fields');
        if (!container) return;
        container.innerHTML = list.map(function (p, i) {
          return '<div class="lab-edit-row lab-edit-row-pub">' +
            '<input type="text" placeholder="Year (e.g. 2025 or archive)" value="' + escapeHtml(p.year || '') + '" data-pub-year="" style="width:80px">' +
            '<input type="text" placeholder="Title" value="' + escapeHtml(p.title || '') + '" data-pub-title="" style="flex:1">' +
            '<button type="button" class="lab-edit-remove" data-remove-pub data-index="' + i + '">Remove</button>' +
            '</div>';
        }).join('');
        container.querySelectorAll('[data-remove-pub]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            list.splice(parseInt(btn.getAttribute('data-index'), 10), 1);
            renderPubFields();
          });
        });
      }
      renderPubFields();

      panel.querySelector('[data-add="pub"]').addEventListener('click', function () {
        list.push({ year: '', title: '' });
        renderPubFields();
      });

      panel.querySelector('[data-save="pub"]').addEventListener('click', function () {
        var newList = [];
        panel.querySelectorAll('#lab-pub-fields .lab-edit-row-pub').forEach(function (row) {
          var y = row.querySelector('[data-pub-year]')?.value?.trim() || '';
          var t = row.querySelector('[data-pub-title]')?.value?.trim() || '';
          if (t) newList.push({ year: y || 'archive', title: t });
        });
        storage.set('labPublications', newList);
        applyPublicationFromStorage();
        alert('Publications saved.');
      });

      pubTimeline.parentNode.appendChild(panel);
    }
  }
})();
