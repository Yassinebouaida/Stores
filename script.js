document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SETUP & GLOBAL VARIABLES ---
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js`;
    let stories = [];
    let pdfDoc = null;
    let currentPageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    const PDF_SCALE = 1.5;

    // --==-- Admin Login State --==--
    let isAdminLoggedIn = false;
    const ADMIN_PASSWORD = "yassine123";

    // --- 2. DOM Elements ---
    const adminLoginOverlay = document.getElementById('adminLoginOverlay');
    const adminPasswordInput = document.getElementById('adminPasswordInput');
    const adminLoginButton = document.getElementById('adminLoginButton');
    const adminLoginIcon = document.getElementById('adminLoginIcon');
    const addStoryBtn = document.getElementById('addStoryBtn');
    const storiesGrid = document.getElementById('stories-grid');
    // (Rest of selectors)
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

    // --- 3. HELPER & ADMIN FUNCTIONS ---

    // NEW: Reads a file and converts it to a Base64 string (for permanent storage)
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }

    function checkAdminPassword() {
        if (adminPasswordInput.value === ADMIN_PASSWORD) {
            isAdminLoggedIn = true;
            sessionStorage.setItem('isAdmin', 'true'); // Keep logged in for the session
            adminLoginOverlay.classList.add('hidden');
            updateAdminUI();
        } else {
            alert("كلمة السر غير صحيحة!");
            adminPasswordInput.value = "";
        }
    }

    function updateAdminUI() {
        // Check session storage to persist login on page reload
        if (sessionStorage.getItem('isAdmin') === 'true') {
            isAdminLoggedIn = true;
        }

        if (isAdminLoggedIn) {
            addStoryBtn.classList.remove('hidden');
        } else {
            addStoryBtn.classList.add('hidden');
        }
        // Re-render stories to show/hide delete buttons
        const currentCategory = document.querySelector('.category-btn.active').dataset.category;
        displayStories(currentCategory === 'all' ? stories : stories.filter(s => s.category === currentCategory));
    }

    // --- 4. PDF RENDERING FUNCTIONS ---
    function renderPage(num) {
        pageRendering = true;
        loadingIndicator.style.display = 'block';
        // Convert Base64 back to binary for PDF.js
        const pdfData = atob(pdfDoc.split(',')[1]);
        const pdfBytes = new Uint8Array(pdfData.length);
        for (let i = 0; i < pdfData.length; i++) {
            pdfBytes[i] = pdfData.charCodeAt(i);
        }
        pdfjsLib.getDocument({ data: pdfBytes }).promise.then(doc => {
            doc.getPage(num).then(page => {
                const viewport = page.getViewport({ scale: PDF_SCALE });
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const renderContext = { canvasContext: ctx, viewport: viewport };
                page.render(renderContext).promise.then(() => {
                    pageRendering = false;
                    loadingIndicator.style.display = 'none';
                    if (pageNumPending !== null) { renderPage(pageNumPending); pageNumPending = null; }
                    pageCountDisplay.textContent = doc.numPages;
                    updatePageControls(doc.numPages);
                });
            });
        });
        pageNumDisplay.textContent = num;
    }

    function queueRenderPage(num) { if (pageRendering) { pageNumPending = num; } else { renderPage(num); } }
    function updatePageControls(totalPages) { prevPageBtn.disabled = (currentPageNum <= 1); nextPageBtn.disabled = (currentPageNum >= totalPages); }
    function onPrevPage() { if (currentPageNum <= 1) return; currentPageNum--; queueRenderPage(currentPageNum); }
    function onNextPage() { const total = parseInt(pageCountDisplay.textContent); if (currentPageNum >= total) return; currentPageNum++; queueRenderPage(currentPageNum); }

    // --- 5. CORE APP FUNCTIONS ---
    function loadStories() {
        const storiesFromStorage = localStorage.getItem('storiesApp');
        if (storiesFromStorage) {
            stories = JSON.parse(storiesFromStorage);
        } else {
            stories = [{ id: 1, title: "قصة مثال", excerpt: "هذه قصة مثال. أضف قصصك الخاصة.", category: "مغامرات", imageUrl: 'https://via.placeholder.com/400x200.png?text=غلاف+القصة', pdfUrl: '' }];
        }
    }
    function saveStories() { localStorage.setItem('storiesApp', JSON.stringify(stories)); }
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
            const deleteButtonHTML = isAdminLoggedIn ? `<button class="delete-story-btn" title="حذف القصة">🗑️</button>` : '';
            storyCard.innerHTML = `${deleteButtonHTML}<img src="${story.imageUrl}" alt="${story.title}" class="story-image"><div class="story-content"><h3 class="story-title">${story.title}</h3><p class="story-excerpt">${story.excerpt}</p><div class="story-meta"><span class="story-category">${story.category}</span></div></div>`;
            storiesGrid.appendChild(storyCard);
        });
    }

    function deleteStory(storyId) {
        const storyToDelete = stories.find(s => s.id === storyId);
        if (!storyToDelete) return;
        if (confirm(`هل أنت متأكد من حذف قصة "${storyToDelete.title}"؟`)) {
            stories = stories.filter(s => s.id !== storyId);
            saveStories();
            updateAdminUI();
        }
    }

    function openStoryModal(story) {
        if (!story.pdfUrl) { alert("لا يوجد ملف PDF لهذه القصة."); return; }
        pdfTitle.textContent = story.title;
        pdfDoc = story.pdfUrl; // Store the Base64 string
        currentPageNum = 1;
        storyModal.classList.add('show');
        renderPage(currentPageNum);
    }
    function closeStoryModal() { storyModal.classList.remove('show'); pdfDoc = null; }
    function openAdminPanel() { adminPanel.classList.add('show'); }
    function closeAdminPanel() { adminPanel.classList.remove('show'); addStoryForm.reset(); }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const submitButton = e.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = "جاري الحفظ...";

        const title = document.getElementById('storyTitle').value;
        const excerpt = document.getElementById('storyExcerpt').value;
        const category = document.getElementById('storyCategory').value;
        const imageFile = document.getElementById('storyImage').files[0];
        const pdfFile = document.getElementById('storyPdf').files[0];

        if (!pdfFile || !imageFile || !title || !excerpt || !category) {
            alert('الرجاء ملء جميع الحقول.');
            submitButton.disabled = false;
            submitButton.textContent = "حفظ القصة";
            return;
        }

        try {
            const [imageUrl, pdfUrl] = await Promise.all([
                readFileAsBase64(imageFile),
                readFileAsBase64(pdfFile)
            ]);

            const newStory = { id: Date.now(), title, excerpt, category, imageUrl, pdfUrl };
            stories.unshift(newStory);
            saveStories();
            updateAdminUI();
            closeAdminPanel();

        } catch (error) {
            console.error("Error reading files:", error);
            alert("حدث خطأ أثناء قراءة الملفات.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "حفظ القصة";
        }
    }

    // --- 6. EVENT LISTENERS ---
    adminLoginIcon.addEventListener('click', () => adminLoginOverlay.classList.remove('hidden'));
    adminLoginOverlay.addEventListener('click', (e) => { if (e.target === adminLoginOverlay) adminLoginOverlay.classList.add('hidden'); });
    adminLoginButton.addEventListener('click', checkAdminPassword);
    adminPasswordInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') checkAdminPassword(); });
    prevPageBtn.addEventListener('click', onPrevPage);
    nextPageBtn.addEventListener('click', onNextPage);
    categoryButtonsContainer.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') { document.querySelector('.category-btn.active').classList.remove('active'); e.target.classList.add('active'); updateAdminUI(); } });
    searchInput.addEventListener('input', (e) => { const searchTerm = e.target.value.toLowerCase().trim(); displayStories(stories.filter(s => s.title.toLowerCase().includes(searchTerm) || s.excerpt.toLowerCase().includes(searchTerm))); });
    storiesGrid.addEventListener('click', (e) => { const deleteButton = e.target.closest('.delete-story-btn'); const card = e.target.closest('.story-card'); if (deleteButton) { e.stopPropagation(); const storyId = parseInt(card.dataset.id); deleteStory(storyId); } else if (card) { const storyId = parseInt(card.dataset.id); const story = stories.find(s => s.id === storyId); if (story) openStoryModal(story); } });
    closeModalBtn.addEventListener('click', closeStoryModal);
    storyModal.addEventListener('click', e => { if (e.target === storyModal) closeStoryModal(); });
    addStoryBtn.addEventListener('click', openAdminPanel);
    closeAdminBtn.addEventListener('click', closeAdminPanel);
    addStoryForm.addEventListener('submit', handleFormSubmit);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (storyModal.classList.contains('show')) closeStoryModal(); if (adminPanel.classList.contains('show')) closeAdminPanel(); if (!adminLoginOverlay.classList.contains('hidden')) adminLoginOverlay.classList.add('hidden'); } else if (storyModal.classList.contains('show')) { if (e.key === 'ArrowLeft') onPrevPage(); if (e.key === 'ArrowRight') onNextPage(); } });
    (window.adsbygoogle = window.adsbygoogle || []).push({});

    // --- 7. INITIALIZATION ---
    loadStories();
    updateAdminUI();
});
