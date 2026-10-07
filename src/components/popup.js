let currentPopup = null;

export function showPopup(data, containerId) {
  // Удаляем предыдущий попап
  destroyPopup();

  const popup = document.createElement('div');
  popup.className = 'popup-animate';
  popup.id = 'custom-popup';
  popup.style.cssText = `
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    width: 360px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.15);
    z-index: 1000;
  `;

  popup.innerHTML = `
    <div class="relative">
      <button id="popup-close" class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow hover:bg-white transition-colors z-10">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      <img src="${data.photo}" alt="${data.name}" class="w-full h-48 object-cover rounded-t-2xl" onerror="this.src='https://placehold.co/600x400/e2e8f0/94a3b8?text=Нет+фото'" />
      <div class="p-5">
        <h3 class="text-lg font-bold text-gray-900 mb-2">${data.name}</h3>
        <div class="flex items-center gap-1 text-sm text-gray-500 mb-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span>${data.city}, ${data.address}</span>
        </div>
        <p class="text-sm text-gray-600 mt-3 mb-4 leading-relaxed">${data.description}</p>
        <div class="flex flex-wrap gap-2 mb-4">
          <span class="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">${data.system}</span>
          <span class="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">${data.coating}</span>
          <span class="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">${data.buildingType}</span>
        </div>
        <a href="tel:${data.phone}" class="block w-full text-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
          Позвонить: ${data.phone}
        </a>
      </div>
    </div>
  `;

  const container = document.getElementById(containerId);
  if (!container) return;
  container.appendChild(popup);
  currentPopup = popup;

  // Закрытие по крестику
  popup.querySelector('#popup-close').addEventListener('click', destroyPopup);

  // Закрытие по клику вне попапа (на карту)
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 0);
}

function handleOutsideClick(e) {
  if (currentPopup && !currentPopup.contains(e.target) && !e.target.closest('.object-marker')) {
    destroyPopup();
  }
}

export function destroyPopup() {
  if (currentPopup) {
    document.removeEventListener('click', handleOutsideClick);
    currentPopup.remove();
    currentPopup = null;
  }
}
