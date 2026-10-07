export function getBounds(coordinates) {
  let minLat = Infinity, minLng = Infinity;
  let maxLat = -Infinity, maxLng = -Infinity;

  for (const coords of coordinates) {
    const lat = coords[1];
    const lng = coords[0];

    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ];
}

/**
 * Параметры анимации при перемещении карты
 */
export const LOCATION_ANIMATION = { easing: 'ease-in-out', duration: 2000 };

/**
 * Отступы от границ карты при установке location
 */
export const MARGIN = [100, 100, 100, 100];

/**
 * Генератор случайных точек (для тестов/демо)
 */
const seed = (s) => () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
};

const rnd = seed(10000);

export const getRandomPointCoordinates = (bounds) => [
    bounds[0][0] + (bounds[1][0] - bounds[0][0]) * rnd(),
    bounds[1][1] + (bounds[0][1] - bounds[1][1]) * rnd()
];

export const getRandomPoints = (count, bounds) => {
    return Array.from({ length: count }, (_, index) => ({
        type: 'Feature',
        id: index.toString(),
        geometry: { type: 'Point', coordinates: getRandomPointCoordinates(bounds) }
    }));
};