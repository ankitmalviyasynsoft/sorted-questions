const fs = require('fs');

const jsonContent = fs.readFileSync('interview_questions.json', 'utf8');

const jsTemplate = `/* ==========================================================================
   Interview Questions Portal - Application Engine
   ========================================================================== */

const FALLBACK_DATA = ${jsonContent};

// Global State
let rawData = null;
let allQuestions = [];
let categories = [];
let companiesMap = new Map();

// Active Filters State
let selectedCategory = 'ALL';
let selectedCompany = 'ALL';
let selectedDifficulties = new Set(['Easy', 'Medium', 'Hard']);
let searchQuery = '';
let showOnlyBookmarked = false;
let sortBy = 'default';
let viewMode = 'grid';

// Local Storage Persistence
let bookmarkedIds = new Set(JSON.parse(localStorage.getItem('techprep_bookmarks') || '[]'));
let masteredIds = new Set(JSON.parse(localStorage.getItem('techprep_mastered') || '[]'));

// Element References
let elements = {};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initElements();
  initTheme();
  await loadData();
  processData();
  renderSidebarControls();
  setupEventListeners();
  applyFiltersAndRender();
});

function initElements() {
  elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    themeText: document.getElementById('themeText'),
    
    totalQuestionsVal: document.getElementById('totalQuestionsVal'),
    filteredQuestionsVal: document.getElementById('filteredQuestionsVal'),
    bookmarkedVal: document.getElementById('bookmarkedVal'),
    masteredVal: document.getElementById('masteredVal'),
    masteredProgressFill: document.getElementById('masteredProgressFill'),
    companiesCountVal: document.getElementById('companiesCountVal'),
    
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    categoryList: document.getElementById('categoryList'),
    companySelect: document.getElementById('companySelect'),
    companyTagsCloud: document.getElementById('companyTagsCloud'),
    diffBtns: document.querySelectorAll('.diff-btn'),
    
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),
    randomQuestionBtn: document.getElementById('randomQuestionBtn'),
    bookmarkFilterBtn: document.getElementById('bookmarkFilterBtn'),
    
    resultsCount: document.getElementById('resultsCount'),
    activeFiltersBar: document.getElementById('activeFiltersBar'),
    sortSelect: document.getElementById('sortSelect'),
    gridModeBtn: document.getElementById('gridModeBtn'),
    listModeBtn: document.getElementById('listModeBtn'),
    
    questionsGrid: document.getElementById('questionsGrid'),
    toastContainer: document.getElementById('toastContainer'),
    backToTopBtn: document.getElementById('backToTopBtn')
  };
}

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('techprep_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('techprep_theme', newTheme);
  updateThemeUI(newTheme);
  showToast(newTheme === 'dark' ? '🌙 Switched to Dark Mode' : '☀️ Switched to Light Mode');
}

function updateThemeUI(theme) {
  if (elements.themeIcon) {
    elements.themeIcon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }
  if (elements.themeText) {
    elements.themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
  }
}

// Data Loading Pipeline
async function loadData() {
  try {
    const response = await fetch('interview_questions.json');
    if (!response.ok) throw new Error('Fetch status not ok');
    rawData = await response.json();
  } catch (err) {
    console.warn('Using embedded JSON fallback:', err);
    rawData = FALLBACK_DATA;
  }
}

// Process and Flatten Data
function processData() {
  allQuestions = [];
  categories = [];
  companiesMap.clear();

  if (!rawData || !rawData.categories) return;

  rawData.categories.forEach(cat => {
    categories.push({
      name: cat.name,
      count: cat.questions ? cat.questions.length : 0
    });

    if (cat.questions) {
      cat.questions.forEach(q => {
        const item = {
          ...q,
          category: cat.name,
          companies: q.companies || []
        };
        allQuestions.push(item);

        // Map companies
        item.companies.forEach(comp => {
          companiesMap.set(comp, (companiesMap.get(comp) || 0) + 1);
        });
      });
    }
  });
}

// Render Sidebar Filter Controls
function renderSidebarControls() {
  if (!elements.categoryList) return;

  // 1. Categories List
  elements.categoryList.innerHTML = '';
  
  const allCatBtn = document.createElement('button');
  allCatBtn.className = 'category-item ' + (selectedCategory === 'ALL' ? 'active' : '');
  allCatBtn.innerHTML = \`
    <span><i class="fa-solid fa-layer-group" style="margin-right: 8px;"></i> All Categories</span>
    <span class="cat-count">\${allQuestions.length}</span>
  \`;
  allCatBtn.onclick = () => selectCategory('ALL');
  elements.categoryList.appendChild(allCatBtn);

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-item ' + (selectedCategory === cat.name ? 'active' : '');
    btn.innerHTML = \`
      <span>\${getCategoryIcon(cat.name)} \${cat.name}</span>
      <span class="cat-count">\${cat.count}</span>
    \`;
    btn.onclick = () => selectCategory(cat.name);
    elements.categoryList.appendChild(btn);
  });

  // 2. Company Select & Tags Cloud
  elements.companySelect.innerHTML = '<option value="ALL">🏢 All Companies (' + companiesMap.size + ')</option>';
  elements.companyTagsCloud.innerHTML = '';

  const sortedCompanies = Array.from(companiesMap.entries()).sort((a, b) => b[1] - a[1]);

  sortedCompanies.forEach(([compName, count]) => {
    // Add option to select
    const opt = document.createElement('option');
    opt.value = compName;
    opt.textContent = compName + ' (' + count + ')';
    if (selectedCompany === compName) opt.selected = true;
    elements.companySelect.appendChild(opt);

    // Add tag pill to cloud
    const tagBtn = document.createElement('button');
    tagBtn.className = 'company-tag-btn ' + (selectedCompany === compName ? 'active' : '');
    tagBtn.innerHTML = compName + ' <span style="opacity:0.7;">(' + count + ')</span>';
    tagBtn.onclick = () => selectCompany(compName);
    elements.companyTagsCloud.appendChild(tagBtn);
  });
}

function getCategoryIcon(catName) {
  const icons = {
    'HTML': '<i class="fa-brands fa-html5" style="color:#f97316;"></i>',
    'CSS': '<i class="fa-brands fa-css3-alt" style="color:#0ea5e9;"></i>',
    'JavaScript': '<i class="fa-brands fa-js" style="color:#eab308;"></i>',
    'TypeScript': '<i class="fa-solid fa-code" style="color:#3b82f6;"></i>',
    'React': '<i class="fa-brands fa-react" style="color:#06b6d4;"></i>',
    'Next.js': '<i class="fa-solid fa-n"></i>',
    'Node.js': '<i class="fa-brands fa-node-js" style="color:#22c55e;"></i>',
    'Express.js': '<i class="fa-solid fa-server" style="color:#a855f7;"></i>',
    'MongoDB': '<i class="fa-solid fa-database" style="color:#10b981;"></i>',
    'SQL': '<i class="fa-solid fa-table" style="color:#f43f5e;"></i>',
    'System Design': '<i class="fa-solid fa-diagram-project" style="color:#8b5cf6;"></i>',
    'Web APIs': '<i class="fa-solid fa-network-wired" style="color:#38bdf8;"></i>',
    'Authentication': '<i class="fa-solid fa-shield-halved" style="color:#eab308;"></i>',
    'Performance': '<i class="fa-solid fa-bolt" style="color:#f97316;"></i>',
    'AWS': '<i class="fa-brands fa-aws" style="color:#ff9900;"></i>',
    'DevOps': '<i class="fa-solid fa-infinity" style="color:#6366f1;"></i>',
    'Git': '<i class="fa-brands fa-git-alt" style="color:#f05032;"></i>',
    'Coding': '<i class="fa-solid fa-laptop-code" style="color:#ec4899;"></i>'
  };
  return icons[catName] || '<i class="fa-solid fa-folder"></i>';
}

// Event Listeners Setup
function setupEventListeners() {
  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.addEventListener('click', toggleTheme);
  }

  // Search input
  elements.searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    elements.clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
    applyFiltersAndRender();
  });

  elements.clearSearchBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    searchQuery = '';
    elements.clearSearchBtn.style.display = 'none';
    applyFiltersAndRender();
  });

  // Company Select
  elements.companySelect.addEventListener('change', (e) => {
    selectCompany(e.target.value);
  });

  // Difficulty Pills
  elements.diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const diff = btn.getAttribute('data-diff');
      if (selectedDifficulties.has(diff)) {
        if (selectedDifficulties.size > 1) {
          selectedDifficulties.delete(diff);
          btn.classList.remove('active');
        } else {
          showToast('⚠️ At least one difficulty must be selected');
          return;
        }
      } else {
        selectedDifficulties.add(diff);
        btn.classList.add('active');
      }
      applyFiltersAndRender();
    });
  });

  // Sort Select
  elements.sortSelect.addEventListener('change', (e) => {
    sortBy = e.target.value;
    applyFiltersAndRender();
  });

  // View Mode
  elements.gridModeBtn.addEventListener('click', () => setViewMode('grid'));
  elements.listModeBtn.addEventListener('click', () => setViewMode('list'));

  // Quick Action Buttons
  elements.resetFiltersBtn.addEventListener('click', resetFilters);
  elements.randomQuestionBtn.addEventListener('click', showRandomQuestion);
  elements.bookmarkFilterBtn.addEventListener('click', toggleBookmarkFilter);

  // Back to Top Button
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      elements.backToTopBtn.classList.add('visible');
    } else {
      elements.backToTopBtn.classList.remove('visible');
    }
  });

  elements.backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function selectCategory(catName) {
  selectedCategory = catName;
  renderSidebarControls();
  applyFiltersAndRender();
}

function selectCompany(compName) {
  selectedCompany = compName;
  elements.companySelect.value = compName;
  renderSidebarControls();
  applyFiltersAndRender();
}

function setViewMode(mode) {
  viewMode = mode;
  if (mode === 'grid') {
    elements.questionsGrid.classList.remove('list-view');
    elements.gridModeBtn.classList.add('active');
    elements.listModeBtn.classList.remove('active');
  } else {
    elements.questionsGrid.classList.add('list-view');
    elements.listModeBtn.classList.add('active');
    elements.gridModeBtn.classList.remove('active');
  }
}

function resetFilters() {
  selectedCategory = 'ALL';
  selectedCompany = 'ALL';
  selectedDifficulties = new Set(['Easy', 'Medium', 'Hard']);
  searchQuery = '';
  showOnlyBookmarked = false;
  sortBy = 'default';
  
  elements.searchInput.value = '';
  elements.clearSearchBtn.style.display = 'none';
  elements.sortSelect.value = 'default';
  elements.bookmarkFilterBtn.classList.remove('accent');
  elements.bookmarkFilterBtn.innerHTML = '<i class="fa-regular fa-star"></i> Bookmarks';
  
  elements.diffBtns.forEach(btn => btn.classList.add('active'));
  
  renderSidebarControls();
  applyFiltersAndRender();
  showToast('🔄 Filters reset to default');
}

function toggleBookmarkFilter() {
  showOnlyBookmarked = !showOnlyBookmarked;
  if (showOnlyBookmarked) {
    elements.bookmarkFilterBtn.classList.add('accent');
    elements.bookmarkFilterBtn.innerHTML = '<i class="fa-solid fa-star"></i> Bookmarked (' + bookmarkedIds.size + ')';
  } else {
    elements.bookmarkFilterBtn.classList.remove('accent');
    elements.bookmarkFilterBtn.innerHTML = '<i class="fa-regular fa-star"></i> Bookmarks';
  }
  applyFiltersAndRender();
}

function showRandomQuestion() {
  if (allQuestions.length === 0) return;
  const randomIndex = Math.floor(Math.random() * allQuestions.length);
  const q = allQuestions[randomIndex];
  
  resetFilters();
  searchQuery = q.id.toLowerCase();
  elements.searchInput.value = q.id;
  elements.clearSearchBtn.style.display = 'block';
  applyFiltersAndRender();
  showToast('🎲 Question ID: ' + q.id);
}

// Filtering & Render Core Logic
function applyFiltersAndRender() {
  let filtered = allQuestions.filter(q => {
    // 1. Category Filter
    if (selectedCategory !== 'ALL' && q.category !== selectedCategory) return false;

    // 2. Company Filter
    if (selectedCompany !== 'ALL' && !q.companies.includes(selectedCompany)) return false;

    // 3. Difficulty Filter
    if (!selectedDifficulties.has(q.difficulty)) return false;

    // 4. Bookmarks Filter
    if (showOnlyBookmarked && !bookmarkedIds.has(q.id)) return false;

    // 5. Search Query
    if (searchQuery) {
      const matchText = (q.question + ' ' + q.id + ' ' + q.category + ' ' + (q.companies.join(' '))).toLowerCase();
      if (!matchText.includes(searchQuery)) return false;
    }

    return true;
  });

  // Sorting
  if (sortBy === 'companies') {
    filtered.sort((a, b) => (b.companies ? b.companies.length : 0) - (a.companies ? a.companies.length : 0));
  } else if (sortBy === 'category') {
    filtered.sort((a, b) => a.category.localeCompare(b.category));
  } else if (sortBy === 'difficulty') {
    const diffMap = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    filtered.sort((a, b) => diffMap[a.difficulty] - diffMap[b.difficulty]);
  }

  // Update Header Stats
  updateHeaderStats(filtered.length);

  // Render Active Filter Badges Bar
  renderActiveFilterBadges();

  // Render Cards
  renderQuestionCards(filtered);
}

function updateHeaderStats(filteredCount) {
  if (elements.totalQuestionsVal) elements.totalQuestionsVal.textContent = allQuestions.length;
  if (elements.filteredQuestionsVal) elements.filteredQuestionsVal.textContent = filteredCount;
  if (elements.bookmarkedVal) elements.bookmarkedVal.textContent = bookmarkedIds.size;
  if (elements.masteredVal) elements.masteredVal.textContent = masteredIds.size;
  if (elements.companiesCountVal) elements.companiesCountVal.textContent = companiesMap.size;
  
  if (elements.resultsCount) elements.resultsCount.textContent = filteredCount + ' Questions Found';

  // Mastered progress
  const pct = allQuestions.length > 0 ? Math.round((masteredIds.size / allQuestions.length) * 100) : 0;
  if (elements.masteredProgressFill) elements.masteredProgressFill.style.width = pct + '%';
}

function renderActiveFilterBadges() {
  if (!elements.activeFiltersBar) return;
  elements.activeFiltersBar.innerHTML = '';
  
  if (selectedCategory !== 'ALL') {
    addFilterBadge('Category: ' + selectedCategory, () => selectCategory('ALL'));
  }
  if (selectedCompany !== 'ALL') {
    addFilterBadge('Company: ' + selectedCompany, () => selectCompany('ALL'));
  }
  if (selectedDifficulties.size < 3) {
    addFilterBadge('Difficulty: ' + Array.from(selectedDifficulties).join(', '), () => {
      selectedDifficulties = new Set(['Easy', 'Medium', 'Hard']);
      elements.diffBtns.forEach(btn => btn.classList.add('active'));
      applyFiltersAndRender();
    });
  }
  if (searchQuery) {
    addFilterBadge('Search: "' + searchQuery + '"', () => {
      elements.searchInput.value = '';
      searchQuery = '';
      elements.clearSearchBtn.style.display = 'none';
      applyFiltersAndRender();
    });
  }
  if (showOnlyBookmarked) {
    addFilterBadge('Only Bookmarked', () => toggleBookmarkFilter());
  }
}

function addFilterBadge(text, onRemove) {
  const badge = document.createElement('span');
  badge.className = 'filter-badge';
  badge.innerHTML = text + ' <i class="fa-solid fa-xmark filter-badge-remove"></i>';
  badge.querySelector('.filter-badge-remove').onclick = onRemove;
  elements.activeFiltersBar.appendChild(badge);
}

// Render Question Cards Grid
function renderQuestionCards(questions) {
  if (!elements.questionsGrid) return;
  elements.questionsGrid.innerHTML = '';

  if (questions.length === 0) {
    elements.questionsGrid.innerHTML = \`
      <div class="no-results">
        <div class="no-results-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
        <div class="no-results-title">No Questions Match Your Filters</div>
        <div class="no-results-text">Try broadening your category selection, company filter, or search keywords.</div>
        <button class="action-btn accent" onclick="resetFilters()">
          <i class="fa-solid fa-rotate-left"></i> Reset All Filters
        </button>
      </div>
    \`;
    return;
  }

  questions.forEach(q => {
    const isBookmarked = bookmarkedIds.has(q.id);
    const isMastered = masteredIds.has(q.id);

    const card = document.createElement('div');
    card.className = 'question-card ' + (isBookmarked ? 'is-bookmarked' : '') + ' ' + (isMastered ? 'is-mastered' : '');

    const formattedQuestion = formatQuestionText(q.question);

    let companiesHtml = '';
    if (q.companies && q.companies.length > 0) {
      const compBadges = q.companies.map(comp => {
        const safeComp = comp.replace(/'/g, "\\\\'");
        return \`<span class="badge-company" onclick="selectCompany('\${safeComp}')" title="Click to filter by \${comp}"><i class="fa-regular fa-building"></i> \${comp}</span>\`;
      }).join('');

      companiesHtml = \`
        <div class="companies-section">
          <span class="companies-label">Asked by:</span>
          \${compBadges}
        </div>
      \`;
    }

    card.innerHTML = \`
      <div class="card-top-row">
        <div class="card-badges">
          <span class="badge-cat" data-category="\${q.category}">\${getCategoryIcon(q.category)} \${q.category}</span>
          <span class="badge-diff \${q.difficulty}">\${q.difficulty}</span>
        </div>
        <span class="card-id">#\${q.id}</span>
      </div>

      <div class="question-body">
        \${formattedQuestion}
      </div>

      \${companiesHtml}

      <div class="card-footer">
        <div class="card-actions">
          <button class="icon-btn bookmark-btn \${isBookmarked ? 'active' : ''}" onclick="toggleBookmark('\${q.id}', this)" title="\${isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}">
            <i class="\${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-star"></i>
          </button>
          
          <button class="icon-btn mastered-btn \${isMastered ? 'active' : ''}" onclick="toggleMastered('\${q.id}', this)" title="\${isMastered ? 'Mark as Unmastered' : 'Mark as Mastered'}">
            <i class="fa-solid fa-check"></i>
          </button>
        </div>

        <button class="icon-btn" onclick="copyQuestionText('\${q.id}')" title="Copy Question Text">
          <i class="fa-regular fa-copy"></i>
        </button>
      </div>
    \`;

    elements.questionsGrid.appendChild(card);
  });
}

function formatQuestionText(text) {
  if (!text) return '';
  let safeText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return safeText.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
}

// Question Action Handlers
window.toggleBookmark = function(id, btn) {
  if (bookmarkedIds.has(id)) {
    bookmarkedIds.delete(id);
    showToast('⭐ Removed from Bookmarks');
  } else {
    bookmarkedIds.add(id);
    showToast('🌟 Added to Bookmarks');
  }
  localStorage.setItem('techprep_bookmarks', JSON.stringify(Array.from(bookmarkedIds)));
  applyFiltersAndRender();
};

window.toggleMastered = function(id, btn) {
  if (masteredIds.has(id)) {
    masteredIds.delete(id);
    showToast('↩️ Marked as Unmastered');
  } else {
    masteredIds.add(id);
    showToast('🎉 Question Mastered!');
  }
  localStorage.setItem('techprep_mastered', JSON.stringify(Array.from(masteredIds)));
  applyFiltersAndRender();
};

window.copyQuestionText = function(id) {
  const q = allQuestions.find(item => item.id === id);
  if (!q) return;

  const textToCopy = \`[\${q.category} - \${q.difficulty}] \${q.question}\`;
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast('📋 Question copied to clipboard!');
  }).catch(() => {
    showToast('📋 Copied question text');
  });
};

// Toast Alerts
function showToast(message) {
  if (!elements.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = message;
  
  elements.toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/* ==========================================================================
   Add Question Modal & Data Management
   ========================================================================== */

function getCategoryPrefix(categoryName) {
  if (!categoryName) return 'q';
  const name = categoryName.trim().toLowerCase();
  const prefixMap = {
    'javascript': 'js',
    'react': 'react',
    'node.js': 'node',
    'nodejs': 'node',
    'express.js': 'express',
    'expressjs': 'express',
    'html': 'html',
    'css': 'css',
    'typescript': 'ts',
    'mongodb': 'mongo',
    'sql': 'sql',
    'system design': 'sd',
    'web apis': 'api',
    'authentication': 'auth',
    'performance': 'perf',
    'aws': 'aws',
    'devops': 'devops',
    'git': 'git',
    'coding': 'coding',
    'next.js': 'next'
  };
  if (prefixMap[name]) return prefixMap[name];
  return name.replace(/[^a-z0-9]/g, '').slice(0, 5) || 'q';
}

function generateNextQuestionId(categoryName) {
  const prefix = getCategoryPrefix(categoryName);
  const regex = new RegExp('^' + prefix + '-(\\\\d+)$', 'i');
  let maxIdNum = 0;

  allQuestions.forEach(q => {
    const match = q.id.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxIdNum) {
        maxIdNum = num;
      }
    }
  });

  const nextNum = maxIdNum + 1;
  return \`\${prefix}-\${String(nextNum).padStart(3, '0')}\`;
}

function initAddQuestionModal() {
  elements.addQuestionModal = document.getElementById('addQuestionModal');
  elements.openAddModalBtn = document.getElementById('openAddModalBtn');
  elements.closeModalBtn = document.getElementById('closeModalBtn');
  elements.cancelModalBtn = document.getElementById('cancelModalBtn');
  elements.resetFormBtn = document.getElementById('resetFormBtn');
  elements.exportDataBtn = document.getElementById('exportDataBtn');
  elements.addQuestionForm = document.getElementById('addQuestionForm');
  elements.newCatSelect = document.getElementById('newCatSelect');
  elements.customCatGroup = document.getElementById('customCatGroup');
  elements.newCustomCatInput = document.getElementById('newCustomCatInput');
  elements.newQuestionId = document.getElementById('newQuestionId');
  elements.autoGenIdBtn = document.getElementById('autoGenIdBtn');
  elements.newQuestionText = document.getElementById('newQuestionText');
  elements.newCompanyInput = document.getElementById('newCompanyInput');
  elements.addCompanyTagBtn = document.getElementById('addCompanyTagBtn');
  elements.quickCompanyPills = document.getElementById('quickCompanyPills');
  elements.selectedCompaniesContainer = document.getElementById('selectedCompaniesContainer');
  elements.newAnswerText = document.getElementById('newAnswerText');
  elements.modalCardPreview = document.getElementById('modalCardPreview');

  if (!elements.addQuestionModal) return;

  if (elements.openAddModalBtn) {
    elements.openAddModalBtn.addEventListener('click', openAddModal);
  }

  if (elements.exportDataBtn) {
    elements.exportDataBtn.addEventListener('click', exportQuestionsJSON);
  }

  if (elements.closeModalBtn) elements.closeModalBtn.addEventListener('click', closeAddModal);
  if (elements.cancelModalBtn) elements.cancelModalBtn.addEventListener('click', closeAddModal);

  elements.addQuestionModal.addEventListener('click', (e) => {
    if (e.target === elements.addQuestionModal) closeAddModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.addQuestionModal.classList.contains('open')) {
      closeAddModal();
    }
  });

  elements.newCatSelect.addEventListener('change', () => {
    if (elements.newCatSelect.value === '__NEW_CATEGORY__') {
      elements.customCatGroup.style.display = 'flex';
      elements.newCustomCatInput.required = true;
      elements.newCustomCatInput.focus();
      elements.newQuestionId.value = generateNextQuestionId(elements.newCustomCatInput.value || 'Custom');
    } else {
      elements.customCatGroup.style.display = 'none';
      elements.newCustomCatInput.required = false;
      elements.newQuestionId.value = generateNextQuestionId(elements.newCatSelect.value);
    }
    updateModalPreview();
  });

  elements.newCustomCatInput.addEventListener('input', () => {
    elements.newQuestionId.value = generateNextQuestionId(elements.newCustomCatInput.value || 'Custom');
    updateModalPreview();
  });

  elements.autoGenIdBtn.addEventListener('click', () => {
    const cat = getSelectedCategoryFromModal();
    elements.newQuestionId.value = generateNextQuestionId(cat);
    showToast('✨ Auto-generated ID: ' + elements.newQuestionId.value);
    updateModalPreview();
  });

  elements.addCompanyTagBtn.addEventListener('click', addCompanyTagFromInput);
  elements.newCompanyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addCompanyTagFromInput();
    }
  });

  const diffRadios = elements.addQuestionForm.querySelectorAll('input[name="difficulty"]');
  diffRadios.forEach(radio => radio.addEventListener('change', updateModalPreview));

  elements.newQuestionText.addEventListener('input', updateModalPreview);
  elements.newQuestionId.addEventListener('input', updateModalPreview);
  elements.newAnswerText.addEventListener('input', updateModalPreview);

  elements.resetFormBtn.addEventListener('click', () => {
    resetModalForm();
    showToast('🔄 Form reset');
  });

  elements.addQuestionForm.addEventListener('submit', handleAddQuestionSubmit);
}

function getSelectedCategoryFromModal() {
  if (elements.newCatSelect.value === '__NEW_CATEGORY__') {
    return elements.newCustomCatInput.value.trim() || 'General';
  }
  return elements.newCatSelect.value || 'JavaScript';
}

function openAddModal() {
  populateModalCategories();
  populateQuickCompanyPills();
  resetModalForm();
  
  if (selectedCategory && selectedCategory !== 'ALL') {
    elements.newCatSelect.value = selectedCategory;
  } else {
    elements.newCatSelect.value = categories.length > 0 ? categories[0].name : 'JavaScript';
  }

  elements.newQuestionId.value = generateNextQuestionId(getSelectedCategoryFromModal());
  updateModalPreview();

  elements.addQuestionModal.classList.add('open');
  elements.addQuestionModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => elements.newQuestionText.focus(), 150);
}

function closeAddModal() {
  elements.addQuestionModal.classList.remove('open');
  elements.addQuestionModal.setAttribute('aria-hidden', 'true');
}

function populateModalCategories() {
  if (!elements.newCatSelect) return;
  elements.newCatSelect.innerHTML = '<option value="" disabled>Select Category</option>';

  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = \`\${cat.name} (\${cat.count} questions)\`;
    elements.newCatSelect.appendChild(opt);
  });

  const newOpt = document.createElement('option');
  newOpt.value = '__NEW_CATEGORY__';
  newOpt.textContent = '➕ Add New Category...';
  elements.newCatSelect.appendChild(newOpt);
}

function populateQuickCompanyPills() {
  if (!elements.quickCompanyPills) return;
  elements.quickCompanyPills.innerHTML = '';

  const popular = ['Inodeed', 'Neosoft', 'Thought Win', 'Sketchbramha', 'Questions Komal', 'Amazon', 'Google', 'Microsoft', 'Trootech'];
  popular.forEach(comp => {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'quick-pill';
    pill.innerHTML = \`<i class="fa-solid fa-plus" style="font-size:0.7rem;"></i> \${comp}\`;
    pill.onclick = () => {
      addedCompanyTagsSet.add(comp);
      renderCompanyTags();
      updateModalPreview();
    };
    elements.quickCompanyPills.appendChild(pill);
  });
}

function addCompanyTagFromInput() {
  const val = elements.newCompanyInput.value.trim().replace(/,/g, '');
  if (val) {
    addedCompanyTagsSet.add(val);
    elements.newCompanyInput.value = '';
    renderCompanyTags();
    updateModalPreview();
  }
}

function renderCompanyTags() {
  if (!elements.selectedCompaniesContainer) return;
  elements.selectedCompaniesContainer.innerHTML = '';

  addedCompanyTagsSet.forEach(comp => {
    const chip = document.createElement('span');
    chip.className = 'tag-chip';
    chip.innerHTML = \`
      <i class="fa-regular fa-building"></i> \${comp}
      <i class="fa-solid fa-xmark tag-chip-remove" onclick="removeCompanyTag('\${comp.replace(/'/g, "\\\\'")}')"></i>
    \`;
    elements.selectedCompaniesContainer.appendChild(chip);
  });
}

window.removeCompanyTag = function(comp) {
  addedCompanyTagsSet.delete(comp);
  renderCompanyTags();
  updateModalPreview();
};

function resetModalForm() {
  elements.addQuestionForm.reset();
  elements.customCatGroup.style.display = 'none';
  elements.newCustomCatInput.required = false;
  addedCompanyTagsSet.clear();
  renderCompanyTags();
  updateModalPreview();
}

function updateModalPreview() {
  if (!elements.modalCardPreview) return;

  const category = getSelectedCategoryFromModal();
  const id = elements.newQuestionId.value.trim() || 'ID';
  const questionText = elements.newQuestionText.value.trim() || 'Question text will appear here as you type...';
  const selectedDiffRadio = elements.addQuestionForm.querySelector('input[name="difficulty"]:checked');
  const difficulty = selectedDiffRadio ? selectedDiffRadio.value : 'Easy';
  const answerText = elements.newAnswerText.value.trim();

  const formattedQuestion = formatQuestionText(questionText);

  let companiesHtml = '';
  if (addedCompanyTagsSet.size > 0) {
    const compBadges = Array.from(addedCompanyTagsSet).map(comp => 
      \`<span class="badge-company"><i class="fa-regular fa-building"></i> \${comp}</span>\`
    ).join('');
    companiesHtml = \`<div class="companies-section"><span class="companies-label">Asked by:</span> \${compBadges}</div>\`;
  }

  let answerHtml = '';
  if (answerText) {
    answerHtml = \`
      <div class="answer-section">
        <div class="answer-content">
          <i class="fa-solid fa-lightbulb" style="color:var(--accent-primary); margin-right:6px;"></i>
          \${formatQuestionText(answerText)}
        </div>
      </div>
    \`;
  }

  elements.modalCardPreview.innerHTML = \`
    <div class="card-top-row">
      <div class="card-badges">
        <span class="badge-cat" data-category="\${category}">\${getCategoryIcon(category)} \${category}</span>
        <span class="badge-diff \${difficulty}">\${difficulty}</span>
      </div>
      <span class="card-id">#\${id}</span>
    </div>

    <div class="question-body">
      \${formattedQuestion}
    </div>

    \${companiesHtml}
    \${answerHtml}
  \`;
}

function handleAddQuestionSubmit(e) {
  e.preventDefault();

  const category = getSelectedCategoryFromModal();
  const id = elements.newQuestionId.value.trim();
  const question = elements.newQuestionText.value.trim();
  const selectedDiffRadio = elements.addQuestionForm.querySelector('input[name="difficulty"]:checked');
  const difficulty = selectedDiffRadio ? selectedDiffRadio.value : 'Easy';
  const answer = elements.newAnswerText.value.trim();
  const companies = Array.from(addedCompanyTagsSet);

  if (!category || !id || !question) {
    showToast('⚠️ Please fill in all required fields (*)');
    return;
  }

  const duplicate = allQuestions.find(q => q.id.toLowerCase() === id.toLowerCase());
  if (duplicate) {
    showToast(\`⚠️ Question ID #\${id} already exists! Auto-updating ID.\`);
    elements.newQuestionId.value = generateNextQuestionId(category);
    return;
  }

  const newQuestion = {
    id,
    question,
    difficulty,
    companies
  };

  if (answer) {
    newQuestion.answer = answer;
  }

  customQuestions.push({
    ...newQuestion,
    category
  });
  localStorage.setItem('techprep_custom_questions', JSON.stringify(customQuestions));

  let catObj = rawData.categories.find(c => c.name.toLowerCase() === category.toLowerCase());
  if (!catObj) {
    catObj = { name: category, questions: [] };
    rawData.categories.push(catObj);
  }
  catObj.questions.push(newQuestion);

  processData();
  renderSidebarControls();

  closeAddModal();

  if (selectedCategory !== 'ALL' && selectedCategory !== category) {
    selectedCategory = category;
  }
  searchQuery = '';
  elements.searchInput.value = '';

  applyFiltersAndRender();

  setTimeout(() => {
    const cardEl = document.getElementById(\`q-card-\${id}\`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cardEl.classList.add('newly-added-pulse');
      setTimeout(() => cardEl.classList.remove('newly-added-pulse'), 5000);
    }
  }, 200);

  showToast(\`🎉 Question #\${id} added successfully!\`);
}

function exportQuestionsJSON() {
  if (!rawData) return;
  const jsonStr = JSON.stringify(rawData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'interview_questions.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('📥 Exported interview_questions.json successfully!');
}

window.toggleAnswer = function(btn) {
  const content = btn.nextElementSibling;
  const caret = btn.querySelector('.caret');
  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    caret.classList.replace('fa-chevron-down', 'fa-chevron-up');
  } else {
    content.classList.add('hidden');
    caret.classList.replace('fa-chevron-up', 'fa-chevron-down');
  }
};
`;

fs.writeFileSync('app.js', jsTemplate, 'utf8');
console.log('Updated app.js created!');

