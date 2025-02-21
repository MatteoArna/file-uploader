const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('files');
const searchInput = document.getElementById('search');

// Drag and Drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  uploadFile(files[0]);
});
dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => uploadFile(fileInput.files[0]));

// Upload file
function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  fetch('/upload', {
    method: 'POST',
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.error) alert(data.error);
      else loadFiles();
    })
    .catch((err) => console.error('Upload failed:', err));
}

// Load and display files
function loadFiles() {
  fetch('/files')
    .then((res) => res.json())
    .then((files) => {
      fileList.innerHTML = '';
      const search = searchInput.value.toLowerCase();

      files
        .filter((file) => file.name.toLowerCase().includes(search))
        .forEach((file) => {
          const li = document.createElement('li');
          li.innerHTML = `
            <a href="${file.url}" target="_blank">${file.originalName}</a>
            <button class="rename" onclick="renameFile('${file.name}')">Rename</button>
            <button class="delete" onclick="deleteFile('${file.name}')">Delete</button>
          `;
          fileList.appendChild(li);
        });
    });
}

// Rename file
function renameFile(oldName) {
  const nameWithoutExt = oldName.replace('.mp4', ''); // Show name without .mp4 in prompt
  const newName = prompt('Enter new filename (no need to add .mp4):', nameWithoutExt);
  if (newName && newName !== nameWithoutExt) {
    fetch('/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName }),
    })
      .then(() => loadFiles())
      .catch((err) => console.error('Rename failed:', err));
  }
}

// Delete file
function deleteFile(filename) {
  if (confirm(`Are you sure you want to delete "${filename}"?`)) {
    fetch('/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    })
      .then(() => loadFiles())
      .catch((err) => console.error('Delete failed:', err));
  }
}

// Search
searchInput.addEventListener('input', loadFiles);

// Initial load
loadFiles();