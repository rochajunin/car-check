<template>
  <div class="map-wrapper">
    <div ref="mapContainer" class="mapa-box"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { gpx } from '@tmcw/togeojson';

const props = defineProps({
  urlGpx: {
    type: String,
    required: true
  }
});

const mapContainer = ref(null);
let map = null;
let geoJsonLayer = null;

const renderizarMapa = async () => {
  if (!props.urlGpx) return;

  // 1. Cria a instância do mapa se ainda não existir
  if (!map) {
    map = L.map(mapContainer.value).setView([0, 0], 2);

    // Adiciona a camada oficial de blocos do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
  }

  try {
    // 2. Busca o arquivo GPX do Supabase
    const resposta = await fetch(props.urlGpx);
    const textoGpx = await resposta.text();

    // 3. Converte o XML em GeoJSON
    const parser = new DOMParser();
    const gpxDom = parser.parseFromString(textoGpx, 'text/xml');
    const dadosGeoJson = gpx(gpxDom);

    // Limpa camadas anteriores se houver troca de URL
    if (geoJsonLayer) {
      map.removeLayer(geoJsonLayer);
    }

    // 4. Desenha a linha da rota no mapa
    geoJsonLayer = L.geoJSON(dadosGeoJson, {
      style: {
        color: '#2563eb', // Cor azul para destaque da rota
        weight: 5,
        opacity: 0.85
      }
    }).addTo(map);

    // 5. Centraliza o mapa ajustando o zoom para a rota inteira
    const bounds = geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  } catch (erro) {
    console.error('Erro ao carregar o arquivo GPX no OpenStreetMap:', erro);
  }
};

onMounted(() => {
  renderizarMapa();
});

// Atualiza o mapa se a URL do GPX mudar
watch(() => props.urlGpx, () => {
  renderizarMapa();
});
</script>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 400px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 15px;
}

.mapa-box {
  width: 100%;
  height: 100%;
}
</style>