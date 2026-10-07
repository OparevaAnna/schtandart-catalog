import { locationsData } from '../data/locations.js';

let activeFilters = { systems: [], coatings: [], buildingTypes: [], searchQuery: '' };
let filterGroups = {};
let onUpdate = null;

function countMatchesForOption(groupKey, optionValue) {
  const tempFilters = {
    systems: [...activeFilters.systems],
    coatings: [...activeFilters.coatings],
    buildingTypes: [...activeFilters.buildingTypes],
    searchQuery: activeFilters.searchQuery,
  };
  if (!tempFilters[groupKey].includes(optionValue)) {
    tempFilters[groupKey].push(optionValue);
  }
  return locationsData.filter(obj => {
    if (tempFilters.systems.length && !tempFilters.systems.includes(obj.system)) return false;
    if (tempFilters.coatings.length && !tempFilters.coatings.includes(obj.coating)) return false;
    if (tempFilters.buildingTypes.length && !tempFilters.buildingTypes.includes(obj.buildingType)) return false;
    if (tempFilters.searchQuery) {
      const q = tempFilters.searchQuery.toLowerCase();
      const fields = [obj.name, obj.city, obj.address, obj.description].join(' ').toLowerCase();
      if (!fields.includes(q)) return false;
    }
    return true;
  }).length;
}

export function getFilteredLocations() {
  return locationsData.filter(obj => {
    if (activeFilters.systems.length && !activeFilters.systems.includes(obj.system)) return false;
    if (activeFilters.coatings.length && !activeFilters.coatings.includes(obj.coating)) return false;
    if (activeFilters.buildingTypes.length && !activeFilters.buildingTypes.includes(obj.buildingType)) return false;
    if (activeFilters.searchQuery) {
      const q = activeFilters.searchQuery.toLowerCase();
      const fields = [obj.name, obj.city, obj.address, obj.description].join(' ').toLowerCase();
      if (!fields.includes(q)) return false;
    }
    return true;
  });
}

function updateCounters() {
  document.querySelectorAll('.filter-count').forEach(el => {
    const group = el.dataset.group;
    const value = el.dataset.value;
    el.textContent = countMatchesForOption(group, value);
  });
}

export function initFilters(containerEl, statsEl, resetBtn, searchInput, callback) {
  onUpdate = callback;

  const systems = [...new Set(locationsData.map(o => o.system))];
  const coatings = [...new Set(locationsData.map(o => o.coating))];
  const buildingTypes = [...new Set(locationsData.map(o => o.buildingType))];
  filterGroups = { systems, coatings, buildingTypes };

  renderFilterGroup(containerEl, 'Тип системы', 'systems', systems, true);  // открыт по умолчанию
  renderFilterGroup(containerEl, 'Тип покрытия', 'coatings', coatings, false);
  renderFilterGroup(containerEl, 'Тип здания', 'buildingTypes', buildingTypes, false);

  searchInput.addEventListener('input', (e) => {
    activeFilters.searchQuery = e.target.value;
    applyFilters();
  });

  resetBtn.addEventListener('click', () => {
    activeFilters = { systems: [], coatings: [], buildingTypes: [], searchQuery: '' };
    searchInput.value = '';
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    applyFilters();
  });

  containerEl.addEventListener('change', (e) => {
    if (e.target.classList.contains('filter-checkbox')) {
      const group = e.target.dataset.group;
      const value = e.target.value;
      if (e.target.checked) {
        activeFilters[group].push(value);
      } else {
        activeFilters[group] = activeFilters[group].filter(v => v !== value);
      }
      applyFilters();
    }
  });

  applyFilters();
}

function renderFilterGroup(container, title, groupKey, values, isOpen = false) {
  const accordion = document.createElement('div');
  accordion.className = 'mb-3 border border-gray-200 rounded-xl overflow-hidden';

  const bodyHidden = isOpen ? '' : 'hidden';
  const arrowRotate = isOpen ? 'rotate(180deg)' : '';

  accordion.innerHTML = `
    <button class="accordion-header w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left cursor-pointer select-none" type="button">
      <span class="font-medium text-sm text-gray-700">${title}</span>
      <svg class="accordion-arrow w-4 h-4 transition-transform duration-200" style="transform: ${arrowRotate}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>
    <div class="accordion-body ${bodyHidden}" style="transition: max-height 0.3s ease, opacity 0.2s ease;">
      <div class="px-4 pb-3 pt-1 space-y-1">
        ${values.map(v => `
          <label class="flex items-center gap-2 cursor-pointer group py-0.5 hover:bg-gray-50 rounded px-1 -mx-1 transition-colors">
            <input type="checkbox" class="filter-checkbox rounded border-gray-300 text-blue-600 focus:ring-blue-400" data-group="${groupKey}" value="${v}" />
            <span class="text-sm text-gray-600 group-hover:text-gray-800 flex-1">${v}</span>
            <span class="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full filter-count" data-group="${groupKey}" data-value="${v}">0</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;
  container.appendChild(accordion);

  const header = accordion.querySelector('.accordion-header');
  const body = accordion.querySelector('.accordion-body');
  const arrow = accordion.querySelector('.accordion-arrow');

  header.addEventListener('click', () => {
    const isCurrentlyOpen = !body.classList.contains('hidden');
    body.classList.toggle('hidden');
    arrow.style.transform = isCurrentlyOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  });
}

function applyFilters() {
  const filtered = getFilteredLocations();
  updateCounters();

  const statsEl = document.getElementById('stats');
  if (statsEl) {
    statsEl.textContent = `Показано ${filtered.length} из ${locationsData.length} проектов`;
  }

  if (onUpdate) onUpdate(filtered);
}
