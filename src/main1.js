import './style.css';
import { initFilters, getFilteredLocations } from './features/filters.js';
import { initMap, updateMapMarkers, setPopupCallback } from './features/map.js';
import { showPopup } from './components/popup.js';


async function initApp() {
  const filtersContainer = document.getElementById('filtersContainer');
  const statsEl = document.getElementById('stats');
  const resetBtn = document.getElementById('resetFilters');
  const searchInput = document.getElementById('searchInput');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const openBtn = document.getElementById('openSidebar');
  const closeBtn = document.getElementById('closeSidebar');

  // --- Мобильная шторка ---
  function openSidebarHandler() {
    sidebar.classList.remove('max-md:translate-y-full');
    overlay.classList.remove('hidden');
  }
  function closeSidebarHandler() {
    sidebar.classList.add('max-md:translate-y-full');
    overlay.classList.add('hidden');
  }

  if (openBtn) openBtn.addEventListener('click', openSidebarHandler);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebarHandler);
  if (overlay) overlay.addEventListener('click', closeSidebarHandler);

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      sidebar.classList.remove('max-md:translate-y-full');
      overlay.classList.add('hidden');
    }
  });

  // --- Инициализация фильтров (всегда, независимо от карты) ---
  // Сначала показываем статистику
  const allLocations = getFilteredLocations();
  if (statsEl) {
    statsEl.textContent = `Показано ${allLocations.length} из ${allLocations.length} проектов`;
  }

  // Функция для передачи отфильтрованных данных в карту (будет доступна после инициализации карты)
  let mapUpdateFn = null;
  function onFiltersChange(filtered) {
    if (mapUpdateFn) {
      mapUpdateFn(filtered);
    }
  }

  // Запускаем фильтры — они сразу отрендерят аккордеоны
  initFilters(filtersContainer, statsEl, resetBtn, searchInput, onFiltersChange);

  // --- Инициализация карты (асинхронно, может упасть) ---
  setPopupCallback((data) => {
    showPopup(data, 'mapContainer');
  });

  try {
    await initMap('mapContainer');
    // Когда карта готова, подключаем обновление маркеров
    mapUpdateFn = (filtered) => {
      updateMapMarkers(filtered);
    };
    // Загружаем данные на карту
    const currentFiltered = getFilteredLocations();
    updateMapMarkers(currentFiltered);
  } catch (error) {
    console.error('Ошибка инициализации карты:', error);
  }
}

document.addEventListener('DOMContentLoaded', initApp);