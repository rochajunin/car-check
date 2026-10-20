import Dexie from 'dexie';

// Cria o banco de dados interno do navegador do celular
export const db = new Dexie('FrotaOfflineDB');

db.version(1).stores({
    // A tabela local de viagens
    viagem_atual: 'id, placa, km_inicial, data_hora_inicio, status',
    
    // Tabela para guardar os blocos de texto do GPX durante a rota
    gpx_pontos: '++id, texto_xml' 
});