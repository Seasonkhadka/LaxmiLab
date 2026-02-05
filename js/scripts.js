// Basic interactivity for nav toggle and video upload/preview
document.addEventListener('DOMContentLoaded', ()=>{
  // Year in footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Nav toggle for small screens
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  toggle?.addEventListener('click', ()=>{
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    nav.style.display = expanded ? 'none' : 'flex';
  });

  // Video upload/drag-drop handling
  const dropArea = document.getElementById('drop-area');
  const input = document.getElementById('video-input');
  const preview = document.getElementById('preview-video');
  const fileInfo = document.getElementById('file-info');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const snapBtn = document.getElementById('snap-btn');

  function preventDefaults(e){ e.preventDefault(); e.stopPropagation(); }
  ['dragenter','dragover','dragleave','drop'].forEach(eventName=>{
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  ['dragenter','dragover'].forEach(eventName=>{
    dropArea.addEventListener(eventName, ()=>dropArea.classList.add('hover'), false);
  });
  ['dragleave','drop'].forEach(eventName=>{
    dropArea.addEventListener(eventName, ()=>dropArea.classList.remove('hover'), false);
  });

  dropArea.addEventListener('drop', (e)=>{
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });

  input.addEventListener('change', (e)=> handleFiles(e.target.files));

  function handleFiles(files){
    if(!files || !files.length) return;
    const file = files[0];
    if(!file.type.startsWith('video/')){
      fileInfo.textContent = 'Please select a video file.';
      return;
    }

    fileInfo.textContent = `File: ${file.name} — ${(file.size/1024/1024).toFixed(2)} MB`;
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.load();

    // Create a poster from first frame when metadata is loaded
    preview.addEventListener('loadeddata', function once(){
      // remove listener after first call
      preview.removeEventListener('loadeddata', once);
      // try to capture first frame using canvas
      try{
        const canvas = document.createElement('canvas');
        canvas.width = preview.videoWidth;
        canvas.height = preview.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        preview.setAttribute('poster', dataUrl);
      }catch(err){ console.warn('Poster capture failed', err); }
    });
  }

  playBtn.addEventListener('click', ()=> preview.play());
  pauseBtn.addEventListener('click', ()=> preview.pause());

  snapBtn.addEventListener('click', ()=>{
    // Save current frame as image (downloads it)
    try{
      const canvas = document.createElement('canvas');
      canvas.width = preview.videoWidth || 640;
      canvas.height = preview.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(preview, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob=>{
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'poster.jpg';
        document.body.appendChild(a); a.click(); a.remove();
      }, 'image/jpeg');
    }catch(e){ alert('Could not capture frame. Try playing the video and then click Save Poster.'); }
  });

  // Mark active link
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(a=>{
    if(location.pathname.endsWith(a.getAttribute('href')) || (location.pathname === '/' && a.getAttribute('href') === 'index.html')){
      a.classList.add('active');
    }
  });
});