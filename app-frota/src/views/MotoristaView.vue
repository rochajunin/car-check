<template>
  <div style="max-width: 500px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2>Checklist do Motorista</h2>

    <!-- ETAPA 1: CHECK-IN -->
    <div v-if="!viagemId">
      <h3>1. Retirada do Veículo (Check-in)</h3>
      <input v-model="placa" placeholder="Placa do Carro (ex: ABC1234)" style="width: 100%; padding: 8px; margin-bottom: 10px;" />
      <input v-model="kmInicial" type="number" placeholder="KM Atual do Painel" style="width: 100%; padding: 8px; margin-bottom: 10px;" />

      <label><b>Nível de Combustível:</b></label>
      <select v-model="combustivelSaida" style="width: 100%; padding: 8px; margin-bottom: 15px;">
        <option value="Reserva">Reserva</option>
        <option value="1/4">1/4</option>
        <option value="1/2">1/2 (Meio)</option>
        <option value="3/4">3/4</option>
        <option value="Cheio">Cheio</option>
      </select>

      <h4>Itens Obrigatórios de Segurança:</h4>
      <div v-for="(status, item) in itensChecklist" :key="item" style="margin-bottom: 8px;">
        <input type="checkbox" v-model="itensChecklist[item]" :id="item" />
        <label :for="item" style="margin-left: 8px;">{{ item }}</label>
      </div>

      <button @click="fazerCheckin" style="width: 100%; background: #16a34a; color: white; border: none; padding: 12px; margin-top: 15px; border-radius: 4px; font-weight: bold;">
        Confirmar Check-in e Iniciar Rota
      </button>
    </div>

    <!-- ETAPA 2: EM VIAGEM E CHECK-OUT -->
    <div v-else>
      <div style="background: #dcfce7; color: #166534; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
        <b>🚗 Viagem Ativa:</b> {{ placa }} | Rota gravando offline...
      </div>

      <h3>2. Devolução do Veículo (Check-out)</h3>
      <input v-model="kmFinal" type="number" placeholder="KM Final do Painel" style="width: 100%; padding: 8px; margin-bottom: 10px;" />

      <label><b>Combustível na Devolução:</b></label>
      <select v-model="combustivelChegada" style="width: 100%; padding: 8px; margin-bottom: 15px;">
        <option value="Reserva">Reserva</option>
        <option value="1/4">1/4</option>
        <option value="1/2">1/2</option>
        <option value="3/4">3/4</option>
        <option value="Cheio">Cheio</option>
      </select>

      <h4>Registrar Avaria / Dano (Se houver):</h4>
      <input v-model="novaAvaria" placeholder="Ex: Amassado para-choque dianteiro" style="width: 100%; padding: 8px; margin-bottom: 10px;" />

      <button @click="fazerCheckout" style="width: 100%; background: #dc2626; color: white; border: none; padding: 12px; margin-top: 15px; border-radius: 4px; font-weight: bold;">
        Finalizar e Enviar Rota GPX
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { db } from '../db.js';

const API_URL = 'http://localhost:3000/api';

const placa = ref('');
const kmInicial = ref('');
const kmFinal = ref('');
const combustivelSaida = ref('Cheio');
const combustivelChegada = ref('Cheio');
const viagemId = ref(null);
const novaAvaria = ref('');

const itensChecklist = reactive({
  'Pneu Estepe Calbrado': true,
  'Macaco e Chave de Roda': true,
  'Triângulo de Sinalização': true,
  'Documento (CRLV) Presente': true,
  'Faróis e Piscas Funcionando': true,
  'Limpeza Interna OK': true
});

const fazerCheckin = async () => {
  if (!placa.value || !kmInicial.value) return alert('Preencha Placa e KM Inicial!');

  const res = await fetch(`${API_URL}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      placa: placa.value,
      motorista_id: 'mot_001',
      km_inicial: kmInicial.value,
      nivel_combustivel: combustivelSaida.value,
      itens: itensChecklist
    })
  });

  const data = await res.json();
  if (res.ok) {
    viagemId.value = data.viagem_id;
    if (data.alerta) alert('ATENÇÃO: O sistema registrou um alerta de divergência de KM com o último turno!');
    
    // Inicia gravação do GPX local
    await db.gpx_pontos.clear();
    const cabecalhoGpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1"><trk><name>Rota_${placa.value}</name><trkseg>\n`;
    await db.gpx_pontos.add({ texto_xml: cabecalhoGpx });
  }
};

const fazerCheckout = async () => {
  if (!kmFinal.value) return alert('Informe a KM Final!');

  // Gera arquivo GPX
  const pontos = await db.gpx_pontos.toArray();
  let xml = pontos.map(p => p.texto_xml).join('') + `  <trkpt lat="-2.9050" lon="-41.7770"><time>${new Date().toISOString()}</time></trkpt>\n</trkseg></trk></gpx>`;
  
  const file = new File([new Blob([xml], { type: 'application/gpx+xml' })], 'rota.gpx');
  
  const formData = new FormData();
  formData.append('arquivo_gpx', file);
  formData.append('viagem_id', viagemId.value);
  formData.append('km_final', kmFinal.value);
  formData.append('nivel_combustivel', combustivelChegada.value);
  formData.append('itens', JSON.stringify(itensChecklist));
  formData.append('avarias', JSON.stringify(novaAvaria.value ? [novaAvaria.value] : []));

  const res = await fetch(`${API_URL}/checkout`, { method: 'POST', body: formData });
  
  if (res.ok) {
    alert('Devolução registrada com sucesso!');
    viagemId.value = null;
    await db.gpx_pontos.clear();
  }
};
</script>