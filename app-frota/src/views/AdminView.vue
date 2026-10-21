<template>
  <div style="max-width: 1000px; margin: 20px auto; padding: 20px;">
    <h2>📊 Painel de Controle de Frota (Administrador)</h2>

    <!-- TABELA DE VIAGENS -->
    <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <thead>
        <tr style="background: #0f172a; color: white; text-align: left;">
          <th style="padding: 12px;">ID / Placa</th>
          <th style="padding: 12px;">Saída / Devolução</th>
          <th style="padding: 12px;">KM Rodados</th>
          <th style="padding: 12px;">Status / Alerta</th>
          <th style="padding: 12px;">Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="v in viagens" :key="v.id" style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px;"><b>#{{ v.id }}</b> - {{ v.placa }}</td>
          <td style="padding: 12px;">
            Início: {{ v.km_inicial }} km ({{ v.nivel_combustivel_saida }})<br>
            Fim: {{ v.km_final ? v.km_final + ' km' : 'Em andamento...' }}
          </td>
          <td style="padding: 12px;">{{ v.distancia_declarada ? v.distancia_declarada + ' km' : '-' }}</td>
          <td style="padding: 12px;">
            <span v-if="v.tem_alerta" style="background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
              ⚠️ {{ v.motivo_alerta }}
            </span>
            <span v-else style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px;">OK</span>
          </td>
          <td style="padding: 12px;">
            <button v-if="v.url_gpx" @click="rotaSelecionada = v.url_gpx" style="background: #0284c7; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">
              Ver Rota OSM
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- MODAL COM O MAPA OPENSTREETMAP -->
    <div v-if="rotaSelecionada" style="margin-top: 30px; background: white; padding: 20px; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3>🗺️ Trajeto Realizado no OpenStreetMap</h3>
        <button @click="rotaSelecionada = null" style="background: #64748b; color: white; border: none; padding: 6px 12px; border-radius: 4px;">Fechar Mapa</button>
      </div>
      <MapaOSM :urlGpx="rotaSelecionada" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MapaOSM from '../components/MapaOSM.vue';

// Define a URL base da API dinamicamente
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const viagens = ref([]);
const rotaSelecionada = ref(null);

onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE}/api/admin/viagens`);
    if (res.ok) {
      viagens.value = await res.json();
    } else {
      console.error('Erro ao buscar viagens:', res.statusText);
    }
  } catch (error) {
    console.error('Erro de conexão com o servidor:', error);
  }
});
</script>