import { getBounds, LOCATION_ANIMATION, MARGIN } from '../utils/map-helpers.js';
import markerUrl from '../data/marker.png';

const API_KEY = '4435c9da-a1d3-436e-8391-c68f5dbc85f7';
const SCRIPT_ID = 'ymaps3-script';

let ymaps3 = null;
let mapInstance = null;
let clusterer = null;
let popupCallback = null;

// Переменные-флаги для защиты карты от зависания при drag-and-drop
let isUpdating = false;
let lastSerializedData = '';

// Асинхронная загрузка API Яндекс.Карт
function loadYandexMapsAPI() {
  return new Promise((resolve, reject) => {
    if (window.ymaps3) {
      resolve(window.ymaps3);
      return;
    }
    if (document.getElementById(SCRIPT_ID)) {
      const checkReady = setInterval(() => {
        if (window.ymaps3) {
          clearInterval(checkReady);
          resolve(window.ymaps3);
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${API_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => {
      const check = setInterval(() => {
        if (window.ymaps3) {
          clearInterval(check);
          resolve(window.ymaps3);
        }
      }, 100);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function setPopupCallback(callback) {
  popupCallback = callback;
}

export async function initMap(containerId) {
  try {
    const ymaps = await loadYandexMapsAPI();
    ymaps3 = ymaps;

    await ymaps3.ready;

    // Регистрация CDN для импорта дополнительных модулей
    await ymaps3.import.registerCdn('https://cdn.jsdelivr.net/npm/{package}', [
        '@yandex/ymaps3-default-ui-theme@0.0',
        '@yandex/ymaps3-clusterer@0.0'
    ]);

    // Импорт дополнительных модулей
    const { YMapClusterer, clusterByGrid } = await ymaps3.import('@yandex/ymaps3-clusterer');
    const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = ymaps3;

    const container = document.getElementById(containerId);
    if (!container) throw new Error('Container not found');

    // Создаём карту — центр на Москву, дефолтный обзорный зум
    mapInstance = new YMap(container, {
      location: {
        center: [37.6173, 55.7558],
        zoom: 4,
      },
      margin: MARGIN,
    });

    mapInstance.addChild(new YMapDefaultSchemeLayer({}));
    mapInstance.addChild(new YMapDefaultFeaturesLayer({}));

    // Функция создания круга для кластера (Динамический размер)
    function createCircle(count) {
      let size = 42;
      let fontSize = 13;
      let shadowRadius = 6;

      if (count >= 5 && count < 10) {
        size = 52; fontSize = 14; shadowRadius = 10;
      } else if (count >= 10 && count < 20) {
        size = 64; fontSize = 16; shadowRadius = 14;
      } else if (count >= 20) {
        size = 76; fontSize = 18; shadowRadius = 18;
      }

      const circle = document.createElement('div');
      
      // Добавляем абсолютное позиционирование и центрирование (половина от size)
      circle.style.position = 'absolute';
      circle.style.marginLeft = `-${size / 2}px`;
      circle.style.marginTop = `-${size / 2}px`;
      circle.style.willChange = 'transform';

      circle.innerHTML = `
        <div style="
          width: ${size}px; 
          height: ${size}px;
          background: #3b82f6;
          border-radius: 50%;
          display: flex; 
          align-items: center; 
          justify-content: center;
          color: white; 
          font-weight: bold; 
          font-size: ${fontSize}px;
          box-shadow: 0 2px ${shadowRadius}px rgba(59,130,246,0.6);
          cursor: pointer;
          user-select: none;
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          ${count}
        </div>`;
        
      return circle;
    }

    // Функция, генерирующая чистый DOM-элемент для каждого маркера
       function getMarkerElement() {
      const el = document.createElement('div');
      
      // Навешиваем ВСЕ стили, включая размеры, фон и сдвиг якоря (margin) на один элемент
      el.style.position = 'absolute';
      el.style.width = '40px';
      el.style.height = '60px';
      el.style.backgroundImage = `url('${markerUrl}')`;
      el.style.backgroundSize = 'contain';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.style.cursor = 'pointer';
      
      // Сдвиг якоря: половина ширины влево (20px), вся высота вверх (60px)
      el.style.marginLeft = '-20px';
      el.style.marginTop = '-60px';
      
      el.style.willChange = 'transform';
      el.style.userSelect = 'none';
      el.style.webkitUserDrag = 'none';
      
      // Эффект увеличения при наведении мыши
      el.style.transition = 'transform 0.15s ease';
      el.onmouseover = () => { el.style.transform = 'scale(1.15)'; };
      el.onmouseout = () => { el.style.transform = 'scale(1)'; };
      
      return el;
    }

    // Функция отрисовки обычного маркера для кластеризатора
    function createMarker(feature) {
      const data = feature.properties;
      console.log('createMarker', feature.geometry.coordinates)
      
      return new YMapMarker(
        {
          coordinates: feature.geometry.coordinates,
          onClick() {
            if (popupCallback) popupCallback(data);
          },
        },
        getMarkerElement() // Передаем чистый, настроенный DOM-элемент
      );
    }

    // Функция отрисовки кластера
function createCluster(coordinates, features) {
      return new YMapMarker(
        {
          coordinates,
          onClick() {
            const coords = features.map(f => f.geometry.coordinates);
            
            // Вычисляем границы группы точек
            const bounds = getBounds(coords);
            
            // ХИТРОСТЬ: Проверяем, насколько близко точки друг к другу.
            // Если они в одном городе, разница между крайними координатами будет микроскопической.
            const lngDiff = Math.abs(bounds[0][0] - bounds[1][0]);
            const latDiff = Math.abs(bounds[0][1] - bounds[1][1]);
            
            if (lngDiff < 0.5 && latDiff < 0.5) {
              // Если точки скучковались в одном городе — влетаем туда на глубокий зум (уровень улиц)!
              // Это гарантированно заставит кластер распасться и вызвать createMarker
              mapInstance.update({
                location: {
                  center: coordinates, // Центрируемся ровно на самом кластере
                  zoom: 14,            // Глубокий зум, чтобы распахнуть все точки
                  ...LOCATION_ANIMATION
                }
              });

               setTimeout(() => {
                if (clusterer) clusterer.update({});
              }, 300);
            } else {
              // Если точки раскиданы между разными городами (например, Питер и Тверь), 
              // то просто плавно подгоняем границы под этот регион
              mapInstance.update({
                location: {
                  bounds: bounds,
                  ...LOCATION_ANIMATION
                }
              });
            }
          },
        },
        createCircle(features.length)
      );
    }

    // Создаём кластеризатор с сеткой под масштаб страны
    clusterer = new YMapClusterer({
      method: clusterByGrid({ gridSize: 96 }),
      features: [],
      marker:  createMarker,
      cluster: createCluster,
    });

    mapInstance.addChild(clusterer);

    let cameraTimeout = null;
container.addEventListener('transitionend', () => {
      clearTimeout(cameraTimeout);
      cameraTimeout = setTimeout(() => {
        if (clusterer && typeof clusterer.update === 'function') {
          // Принудительно заставляем кластеризатор проверить зум и рассыпаться
          clusterer.update({});
          console.log('🔄 Кластеризатор успешно обновил сетку после завершения полета');
        }
      }, 50);
    });

    // Дополнительно подстрахуем обычный скролл колесиком мыши (зум)
    container.addEventListener('wheel', () => {
      clearTimeout(cameraTimeout);
      cameraTimeout = setTimeout(() => {
        if (clusterer && typeof clusterer.update === 'function') {
          clusterer.update({});
        }
      }, 150);
    });

    return { ymaps3, mapInstance, clusterer };
  } catch (error) {
    console.error('Ошибка инициализации карты:', error);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="flex items-center justify-center h-full bg-gray-100 text-gray-500">
          <div class="text-center p-8">
            <p class="text-lg mb-2">Не удалось загрузить карту</p>
            <p class="text-sm">Проверьте API-ключ и подключение к интернету</p>
          </div>
        </div>
      `;
    }
    throw error;
  }
}

export function updateMapMarkers(filteredLocations) {
  if (!clusterer || !mapInstance) return;

  // Исключаем лишние перерисовки
  const currentSerializedData = filteredLocations.map(obj => obj.id || JSON.stringify(obj.coordinates)).join(',');
  if (currentSerializedData === lastSerializedData) {
    return;
  }
  lastSerializedData = currentSerializedData;

  if (isUpdating) return; 
  isUpdating = true;

  console.group('🗺️ ОБНОВЛЕНИЕ КАРТЫ (Защищенное)');

  // ОБЯЗАТЕЛЬНО ДОБАВЛЯЕМ ID НА СЛЕДУЮЩЕЙ СТРОКЕ:
  const features = filteredLocations.map((obj, index) => ({
    type: 'Feature',
    id: obj.id || `marker-${index}`, // <-- ЭТА СТРОЧКА СПАСЕТ РЕНДЕРИНГ МАРКЕРОВ!
    geometry: {
      type: 'Point',
      coordinates: obj.coordinates,
    },
    properties: { ...obj },
  }));

  console.log(`Передаем в кластеризатор точек с ID: ${features.length}`);

  // Асинхронно обновляем кластеризатор с правильными ID
  setTimeout(() => {
    try {
      clusterer.update({ features });
      console.log('✅ Данные кластеризатора успешно обновлены');
    } catch (e) {
      console.error(e);
    } finally {
      isUpdating = false; 
      console.groupEnd();
    }
  }, 0);

  if (features.length === 0) return;

  const coordinates = features.map(f => f.geometry.coordinates);

  if (window.lastFeaturesLength === features.length) {
    return;
  }
  window.lastFeaturesLength = features.length;

  setTimeout(() => {
    try {
      if (features.length === 1) {
        mapInstance.update({
          location: { center: coordinates, zoom: 12, ...LOCATION_ANIMATION }
        });
      } else {
        mapInstance.update({
          location: { bounds: getBounds(coordinates), ...LOCATION_ANIMATION }
        });
      }
    } catch (err) {
      console.error('Ошибка позиционирования камеры:', err);
    }
  }, 50);
}
