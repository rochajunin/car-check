require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({
  origin: [
    'https://car-check-app-frota-two.vercel.app', // Sua nova URL da Vercel
    'http://localhost:5173',                       // Desenvolvimento local (Vite)
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ROTA 1: CHECK-IN (Motorista pega o carro)
app.post('/api/checkin', async (req, res) => {
    try {
        const { placa, motorista_id, km_inicial, nivel_combustivel, itens } = req.body;

        // Garante que o veículo existe
        await supabase.from('veiculos').upsert([{ placa, modelo: 'Veículo Oficial' }]);

        // Busca o último Check-out registrado para esse veículo para cruzar dados
        const { data: ultimaViagem } = await supabase
            .from('checklists_viagens')
            .select('km_final')
            .eq('placa', placa)
            .order('id', { ascending: false })
            .limit(1)
            .single();

        let temAlerta = false;
        let motivoAlerta = '';

        // Cruzamento 1: KM Inicial atual é menor que a KM Final da última viagem?
        if (ultimaViagem && ultimaViagem.km_final && Number(km_inicial) < Number(ultimaViagem.km_final)) {
            temAlerta = true;
            motivoAlerta = `Divergência de KM no pátio: KM de saída (${km_inicial}) menor que o último Check-out (${ultimaViagem.km_final}).`;
        }

        const { data, error } = await supabase
            .from('checklists_viagens')
            .insert([{
                placa,
                motorista_id,
                km_inicial: Number(km_inicial),
                nivel_combustivel_saida: nivel_combustivel,
                itens_verificados_saida: itens,
                tem_alerta: temAlerta,
                motivo_alerta: motivoAlerta,
                data_saida: new Date().toISOString()
            }])
            .select();

        if (error) throw error;

        res.status(200).json({ mensagem: 'Check-in realizado!', viagem_id: data[0].id, alerta: temAlerta });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Falha ao realizar Check-in.' });
    }
});

// ROTA 2: CHECK-OUT (Motorista devolve o carro + Envia GPX)
app.post('/api/checkout', upload.single('arquivo_gpx'), async (req, res) => {
    try {
        const { viagem_id, km_final, nivel_combustivel, itens, avarias } = req.body;
        const arquivo = req.file;

        if (!arquivo) return res.status(400).json({ erro: 'Arquivo GPX obrigatório.' });

        // Upload do GPX
        const nomeArquivo = `rota_${viagem_id}_${Date.now()}.gpx`;
        await supabase.storage.from('rotas_gpx').upload(nomeArquivo, arquivo.buffer, { contentType: 'application/gpx+xml' });
        const { data: urlPublica } = supabase.storage.from('rotas_gpx').getPublicUrl(nomeArquivo);

        // Busca dados do Check-in para cruzar
        const { data: viagemAtual } = await supabase
            .from('checklists_viagens')
            .select('*')
            .eq('id', viagem_id)
            .single();

        let temAlerta = viagemAtual.tem_alerta;
        let motivoAlerta = viagemAtual.motivo_alerta || '';

        // Cruzamento 2: Houve avaria registrada na devolução?
        const listaAvarias = JSON.parse(avarias || '[]');
        if (listaAvarias.length > 0) {
            temAlerta = true;
            motivoAlerta += ` | Nova avaria registrada no turno.`;
        }

        // Cruzamento 3: KM final menor que a inicial?
        if (Number(km_final) < Number(viagemAtual.km_inicial)) {
            temAlerta = true;
            motivoAlerta += ` | KM Final (${km_final}) menor que a KM Inicial (${viagemAtual.km_inicial}).`;
        }

        const { error } = await supabase
            .from('checklists_viagens')
            .update({
                km_final: Number(km_final),
                distancia_declarada: Number(km_final) - Number(viagemAtual.km_inicial),
                nivel_combustivel_chegada: nivel_combustivel,
                itens_verificados_chegada: JSON.parse(itens || '{}'),
                avarias_registradas: listaAvarias,
                url_gpx: urlPublica.publicUrl,
                tem_alerta: temAlerta,
                motivo_alerta: motivoAlerta,
                data_devolucao: new Date().toISOString()
            })
            .eq('id', viagem_id);

        if (error) throw error;

        res.status(200).json({ mensagem: 'Check-out finalizado com sucesso!' });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Falha ao realizar Check-out.' });
    }
});

// ROTA 3: PAINEL ADMIN (Lista todas as viagens com alertas destacados)
app.get('/api/admin/viagens', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('checklists_viagens')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        res.status(200).json(data);
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar dados do painel.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));