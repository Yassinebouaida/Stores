document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP & GLOBAL VARIABLES ---
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;

    let stories = [];
    let pdfDoc = null;
    let currentPageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    const PDF_SCALE = 1.5;

    // --==-- NEW: Admin Login State --==--
    let isAdminLoggedIn = false;
    // !! تنبيه أمني: هذه الطريقة للعرض فقط. في التطبيق الحقيقي، كلمة السر يجب أن تكون في الواجهة الخلفية.
    const ADMIN_PASSWORD = "1234"; 

    // --- 2. DOM Elements ---
    const adminLoginOverlay = document.getElementById('adminLoginOverlay');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const adminLoginButton = document.getElementById('adminLoginButton');
    const addStoryBtn = document.getElementById('addStoryBtn');
    
    const storiesGrid = document.getElementById('stories-grid');
    // (Rest of the selectors are the same)
    const categoryButtonsContainer = document.getElementById('category-buttons');
    const searchInput = document.getElementById('searchInput');
    const storyModal = document.getElementById('storyModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const pdfTitle = document.getElementById('pdf-title');
    const canvas = document.getElementById('pdf-canvas');
    const ctx = canvas.getContext('2d');
    const pageNumDisplay = document.getElementById('page-num');
    const pageCountDisplay = document.getElementById('page-count');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const adminPanel = document.getElementById('adminPanel');
    const closeAdminBtn = document.getElementById('closeAdminBtn');
    const addStoryForm = document.getElementById('addStoryForm');


    // --==-- NEW: Admin Functions --==--
    function checkAdminPassword() {
        if (adminPasswordInput.value === ADMIN_PASSWORD) {
            isAdminLoggedIn = true;
            adminLoginOverlay.classList.add('hidden'); // Hide login screen
            updateAdminUI(); // Show admin buttons
        } else {
            alert("كلمة السر غير صحيحة!");
        }
    }

    function updateAdminUI() {
        if (isAdminLoggedIn) {
            addStoryBtn.classList.remove('hidden');
        } else {
            addStoryBtn.classList.add('hidden');
        }
        // We need to re-render stories to show/hide delete buttons
        displayStories(stories);
    }

    // --- 3. PDF RENDERING FUNCTIONS (Unchanged) ---
    function renderPage(num) { /* ... Same as before ... */ }
    function queueRenderPage(num) { /* ... Same as before ... */ }
    function updatePageControls() { /* ... Same as before ... */ }
    function onPrevPage() { /* ... Same as before ... */ }
    function onNextPage() { /* ... Same as before ... */ }
    
    // --- 4. CORE APP FUNCTIONS (Modified displayStories) ---
    function loadStories() { /* ... Same as before ... */ }
    function saveStories() { /* ... Same as before ... */ }

    function displayStories(storiesToDisplay) {
        storiesGrid.innerHTML = '';
        if (storiesToDisplay.length === 0) {
            storiesGrid.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: white; font-size: 1.2rem;">لا توجد قصص.</p>`;
            return;
        }
        storiesToDisplay.forEach(story => {
            const storyCard = document.createElement('div');
            storyCard.className = 'story-card';
            storyCard.dataset.id = story.id;
            
            // --==-- MODIFIED: Show delete button only if admin is logged in --==--
            const deleteButtonHTML = isAdminLoggedIn 
                ? `<button class="delete-story-btn" title="حذف القصة">🗑️</button>` 
                : '';

            storyCard.innerHTML = `
                ${deleteButtonHTML}
                <img src="${story.imageUrl}" alt="${story.title}" class="story-image">
                <div class="story-content">
                    <h3 class="story-title">${story.title}</h3>
                    <p class="story-excerpt">${story.excerpt}</p>
                    <div class="story-meta"><span class="story-category">${story.category}</span></div>
                </div>`;
            storiesGrid.appendChild(storyCard);
        });
    }

    function deleteStory(storyId) { /* ... Same as before ... */ }
    function openStoryModal(story) { /* ... Same as before ... */ }
    function closeStoryModal() { /* ... Same as before ... */ }
    function openAdminPanel() { /* ... Same as before ... */ }
    function closeAdminPanel() { /* ... Same as before ... */ }
    function handleFormSubmit(e) { /* ... Same as before ... */ }


    // --- 5. EVENT LISTENERS (Added new ones for login) ---
    adminLoginButton.addEventListener('click', checkAdminPassword);
    adminPasswordInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            checkAdminPassword();
        }
    });

    // (The rest of the event listeners are the same)
    prevPageBtn.addEventListener('click', onPrevPage);
    nextPageBtn.addEventListener('click', onNextPage);
    categoryButtonsContainer.addEventListener('click', (e) => { /* ... */ });
    searchInput.addEventListener('input', (e) => { /* ... */ });
    storiesGrid.addEventListener('click', (e) => { /* ... */ });
    closeModalBtn.addEventListener('click', closeStoryModal);
    storyModal.addEventListener('click', e => { if (e.target === storyModal) closeStoryModal() });
    addStoryBtn.addEventListener('click', openAdminPanel);
    closeAdminBtn.addEventListener('click', closeAdminPanel);
    addStoryForm.addEventListener('submit', handleFormSubmit);
    document.addEventListener('keydown', (e) => { /* ... */ });

    // --- 6. INITIALIZATION ---
    loadStories();
    updateAdminUI(); // Set initial UI state (logged out)
    
    
    // --==-- Copying the full functions here for completeness --==--
    
    function renderPage(num) { pageRendering = true; loadingIndicator.style.display = 'block'; pdfDoc.getPage(num).then(page => { const viewport = page.getViewport({ scale: PDF_SCALE }); canvas.height = viewport.height; canvas.width = viewport.width; const renderContext = { canvasContext: ctx, viewport: viewport }; page.render(renderContext).promise.then(() => { pageRendering = false; loadingIndicator.style.display = 'none'; if (pageNumPending !== null) { renderPage(pageNumPending); pageNumPending = null; } updatePageControls(); }); }); pageNumDisplay.textContent = num; }
    function queueRenderPage(num) { if (pageRendering) { pageNumPending = num; } else { renderPage(num); } }
    function updatePageControls() { prevPageBtn.disabled = (currentPageNum <= 1); nextPageBtn.disabled = (currentPageNum >= pdfDoc.numPages); }
    function onPrevPage() { if (currentPageNum <= 1) return; currentPageNum--; queueRenderPage(currentPageNum); }
    function onNextPage() { if (currentPageNum >= pdfDoc.numPages) return; currentPageNum++; queueRenderPage(currentPageNum); }
    function loadStories() { const storiesFromStorage = localStorage.getItem('storiesApp'); if (storiesFromStorage) { stories = JSON.parse(storiesFromStorage); } else { stories = [{ id: 1, title: "قصة مثال", excerpt: "هذه قصة مثال. أضف قصصك الخاصة.", category: "مغامرات", imageUrl: 'https://via.placeholder.com/400x200.png?text=غلاف+القصة', pdfUrl: '' }]; } }
    function saveStories() { localStorage.setItem('storiesApp', JSON.stringify(stories)); }
    function deleteStory(storyId) { const storyToDelete = stories.find(s => s.id === storyId); if (!storyToDelete) return; const confirmation = confirm(`هل أنت متأكد من حذف قصة "${storyToDelete.title}"؟`); if (confirmation) { stories = stories.filter(s => s.id !== storyId); saveStories(); const activeCategory = document.querySelector('.category-btn.active').dataset.category; displayStories(activeCategory === 'all' ? stories : stories.filter(s => s.category === activeCategory)); } }
    function openStoryModal(story) { if (!story.pdfUrl) { alert("لا يوجد ملف PDF لهذه القصة."); return; } pdfTitle.textContent = story.title; loadingIndicator.style.display = 'block'; storyModal.classList.add('show'); pdfjsLib.getDocument(story.pdfUrl).promise.then(doc => { pdfDoc = doc; pageCountDisplay.textContent = pdfDoc.numPages; currentPageNum = 1; renderPage(currentPageNum); }).catch(err => { console.error('Error loading PDF:', err); alert('حدث خطأ أثناء تحميل القصة.'); loadingIndicator.style.display = 'none'; }); }
    function closeStoryModal() { storyModal.classList.remove('show'); pdfDoc = null; }
    function openAdminPanel() { adminPanel.classList.add('show'); }
    function closeAdminPanel() { adminPanel.classList.remove('show'); addStoryForm.reset(); }
    function handleFormSubmit(e) { e.preventDefault(); const title = document.getElementById('storyTitle').value; const excerpt = document.getElementById('storyExcerpt').value; const category = document.getElementById('storyCategory').value; const imageFile = document.getElementById('storyImage').files[0]; const pdfFile = document.getElementById('storyPdf').files[0]; if (!pdfFile) { alert('الرجاء اختيار ملف PDF.'); return; } if (!pdfFile.type.includes('application/pdf') && !pdfFile.name.toLowerCase().endsWith('.pdf')) { alert('الرجاء اختيار ملف PDF فقط.'); document.getElementById('storyPdf').value = ''; return; } if (title && excerpt && category && imageFile) { const imageUrl = URL.createObjectURL(imageFile); const pdfUrl = URL.createObjectURL(pdfFile); const newStory = { id: Date.now(), title, excerpt, category, imageUrl, pdfUrl }; stories.unshift(newStory); saveStories(); displayStories(stories); closeAdminPanel(); } else { alert('الرجاء ملء جميع الحقول.'); } }
    categoryButtonsContainer.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') { document.querySelector('.category-btn.active').classList.remove('active'); e.target.classList.add('active'); const category = e.target.dataset.category; displayStories(category === 'all' ? stories : stories.filter(s => s.category === category)); } });
    searchInput.addEventListener('input', (e) => { const searchTerm = e.target.value.toLowerCase().trim(); displayStories(stories.filter(s => s.title.toLowerCase().includes(searchTerm) || s.excerpt.toLowerCase().includes(searchTerm))); });
    storiesGrid.addEventListener('click', (e) => { const deleteButton = e.target.closest('.delete-story-btn'); const card = e.target.closest('.story-card'); if (deleteButton) { e.stopPropagation(); const storyId = parseInt(card.dataset.id); deleteStory(storyId); } else if (card) { const storyId = parseInt(card.dataset.id); const story = stories.find(s => s.id === storyId); if (story) openStoryModal(story); } });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (storyModal.classList.contains('show')) closeStoryModal(); if (adminPanel.classList.contains('show')) closeAdminPanel(); } else if (storyModal.classList.contains('show')) { if (e.key === 'ArrowLeft') onPrevPage(); if (e.key === 'ArrowRight') onNextPage(); } });
    (window.adsbygoogle = window.adsbygoogle || []).push({});

});
