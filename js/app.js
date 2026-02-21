// ===== Elias Spelportal - App Logic =====

const STORAGE_KEY = 'elias-spelportal-recent';
const MAX_RECENT = 6;

let allGames = [];
let activeCategory = 'all';
let searchQuery = '';

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  loadGames();
  setupMobileMenu();
});

// ===== Load Games from JSON =====
async function loadGames() {
  try {
    const response = await fetch('data/games.json');
    allGames = await response.json();

    if (isGamePage()) {
      initGamePage();
    } else {
      initHomePage();
    }
  } catch (error) {
    console.error('Kunde inte ladda spel:', error);
  }
}

// ===== Check if we're on game.html =====
function isGamePage() {
  return document.body.classList.contains('game-page');
}

// ===== HOME PAGE =====
function initHomePage() {
  renderCategories();
  renderFeaturedGames();
  renderAllGames();
  renderRecentlyPlayed();
  setupSearch();
  setupCategoryFilters();
}

// ===== Render Categories =====
function renderCategories() {
  const container = document.getElementById('categories-container');
  const mobileContainer = document.getElementById('mobile-categories');
  const categories = [...new Set(allGames.map(g => g.category))];

  const categoryEmojis = {
    'Action': '💥',
    'Pussel': '🧩',
    'Sport': '⚽',
    'Äventyr': '🌿',
    'Utbildning': '📚',
  };

  categories.forEach(cat => {
    const emoji = categoryEmojis[cat] || '🎮';

    const btn = document.createElement('button');
    btn.className = 'category-tag';
    btn.dataset.category = cat;
    btn.textContent = `${emoji} ${cat}`;
    container.appendChild(btn);

    if (mobileContainer) {
      const mobileBtn = btn.cloneNode(true);
      mobileContainer.appendChild(mobileBtn);
    }
  });
}

// ===== Render Featured Games =====
function renderFeaturedGames() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;

  const featured = allGames.filter(g => g.featured);
  grid.innerHTML = '';
  featured.forEach(game => grid.appendChild(createGameCard(game)));
}

// ===== Render All Games =====
function renderAllGames(games) {
  const grid = document.getElementById('games-grid');
  if (!grid) return;

  const list = games || allGames;
  grid.innerHTML = '';
  list.forEach(game => grid.appendChild(createGameCard(game)));
}

// ===== Create Game Card =====
function createGameCard(game) {
  const card = document.createElement('a');
  card.className = 'game-card';
  card.href = `game.html?id=${game.id}`;

  card.innerHTML = `
    <div class="card-thumbnail-wrapper">
      <img class="card-thumbnail" src="${game.thumbnail}" alt="${game.title}" loading="lazy"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22><rect fill=%22%2316213e%22 width=%22400%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%234a9eff%22 font-size=%2248%22>🎮</text></svg>'">
      <div class="card-play-overlay">
        <div class="card-play-btn">▶</div>
      </div>
    </div>
    <div class="card-info">
      <div class="card-title">${game.title}</div>
      <span class="card-category" data-cat="${game.category}">${game.category}</span>
    </div>
  `;

  return card;
}

// ===== Search =====
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const mobileSearchInput = document.getElementById('mobile-search-input');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (mobileSearchInput) mobileSearchInput.value = searchQuery;
      filterGames();
    });
  }

  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchInput) searchInput.value = searchQuery;
      filterGames();
    });
  }
}

// ===== Category Filters =====
function setupCategoryFilters() {
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('category-tag')) {
      activeCategory = e.target.dataset.category;

      document.querySelectorAll('.category-tag').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === activeCategory);
      });

      filterGames();

      // Close mobile menu if open
      const mobileNav = document.getElementById('mobile-nav');
      const menuToggle = document.getElementById('menu-toggle');
      if (mobileNav && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        menuToggle.classList.remove('active');
      }
    }
  });
}

// ===== Filter Games =====
function filterGames() {
  let filtered = allGames;

  if (activeCategory !== 'all') {
    filtered = filtered.filter(g => g.category === activeCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.category.toLowerCase().includes(q)
    );
  }

  // Update title
  const title = document.getElementById('all-games-title');
  if (title) {
    if (searchQuery.trim()) {
      title.textContent = `🔍 Sökresultat`;
    } else if (activeCategory !== 'all') {
      title.textContent = `🕹️ ${activeCategory}`;
    } else {
      title.textContent = '🕹️ Alla spel';
    }
  }

  // Show/hide sections
  const featuredSection = document.getElementById('featured-section');
  const recentSection = document.getElementById('recently-played-section');
  const noResults = document.getElementById('no-results');
  const isFiltering = searchQuery.trim() || activeCategory !== 'all';

  if (featuredSection) featuredSection.style.display = isFiltering ? 'none' : '';
  if (recentSection) recentSection.style.display = isFiltering ? 'none' : '';

  renderAllGames(filtered);

  if (noResults) {
    noResults.style.display = filtered.length === 0 ? 'block' : 'none';
  }
}

// ===== Recently Played =====
function renderRecentlyPlayed() {
  const section = document.getElementById('recently-played-section');
  const grid = document.getElementById('recently-played-grid');
  if (!section || !grid) return;

  const recentIds = getRecentlyPlayed();
  if (recentIds.length === 0) {
    section.style.display = 'none';
    return;
  }

  const recentGames = recentIds
    .map(id => allGames.find(g => g.id === id))
    .filter(Boolean);

  if (recentGames.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  grid.innerHTML = '';
  recentGames.forEach(game => grid.appendChild(createGameCard(game)));
}

function getRecentlyPlayed() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecentlyPlayed(gameId) {
  let recent = getRecentlyPlayed();
  recent = recent.filter(id => id !== gameId);
  recent.unshift(gameId);
  recent = recent.slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
}

// ===== Mobile Menu =====
function setupMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('mobile-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      nav.classList.toggle('open');
    });
  }
}

// ===== GAME PAGE =====
function initGamePage() {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get('id');

  if (!gameId) {
    window.location.href = 'index.html';
    return;
  }

  const game = allGames.find(g => g.id === gameId);
  if (!game) {
    window.location.href = 'index.html';
    return;
  }

  // Set page info
  document.title = `${game.title} - Elias Spelportal`;
  document.getElementById('game-title').textContent = game.title;
  document.getElementById('game-description').textContent = game.description;

  const categoryBadge = document.getElementById('game-category');
  categoryBadge.textContent = game.category;
  categoryBadge.dataset.cat = game.category;

  // Load game in iframe
  const iframe = document.getElementById('game-iframe');
  const loader = document.getElementById('game-loader');

  iframe.addEventListener('load', () => {
    loader.classList.add('hidden');
  });

  iframe.src = game.path;

  // Save to recently played
  saveRecentlyPlayed(game.id);

  // Fullscreen button
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  fullscreenBtn.addEventListener('click', () => {
    const wrapper = document.getElementById('game-wrapper');
    if (wrapper.requestFullscreen) {
      wrapper.requestFullscreen();
    } else if (wrapper.webkitRequestFullscreen) {
      wrapper.webkitRequestFullscreen();
    }
  });

  // More games (excluding current game)
  const moreGamesGrid = document.getElementById('more-games-grid');
  if (moreGamesGrid) {
    const others = allGames.filter(g => g.id !== gameId).slice(0, 4);
    others.forEach(g => moreGamesGrid.appendChild(createGameCard(g)));
  }
}
