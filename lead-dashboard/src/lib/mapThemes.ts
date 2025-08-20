export interface MapTheme {
  id: string
  name: string
  url: string
  attribution: string
  maxZoom?: number
  variant?: 'light' | 'dark' | 'satellite'
}

export const MAP_THEMES: MapTheme[] = [
  {
    id: 'osm',
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    variant: 'light'
  },
  {
    id: 'cartodb-light',
    name: 'Hell',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    variant: 'light'
  },
  {
    id: 'cartodb-dark',
    name: 'Dunkel',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    variant: 'dark'
  },
  {
    id: 'esri-satellite',
    name: 'Satellit',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    variant: 'satellite'
  }
]

export const getThemeById = (id: string): MapTheme => {
  return MAP_THEMES.find((theme) => theme.id === id) || MAP_THEMES[0]
}
