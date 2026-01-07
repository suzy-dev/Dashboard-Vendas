<template>
  <div class="container">
    <h1>Dashboard de Vendas</h1>
    
    <div class="card form-card">
      <h3>{{ idEmEdicao ? 'Editando Venda' : 'Adicionar Nova Venda' }}</h3>
      
      <div class="inputs">
        <select v-model="novoMes" class="input-mes">
          <option disabled value="">Selecione o mês</option>
          <option v-for="mes in mesesDisponiveis" :key="mes" :value="mes" @input="aplicarMascara">
            {{ mes }}
          </option>
        </select>

        <input v-model="novoValor" type="text" placeholder="Valor (R$)" />
        
        <button 
          @click="salvarVenda" 
          :class="idEmEdicao ? 'btn-update' : 'btn-add'">
          {{ idEmEdicao ? 'Salvar Alteração' : 'Adicionar' }}
        </button>

        <button v-if="idEmEdicao" @click="cancelarEdicao" class="btn-cancel">
          Cancelar
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Carregando dados...</div>
    <div v-else class="chart-container">
      <ZingChart 
        :key="chartKey"
        :data="chartConfig" 
        :series="chartSeries"
        height="350">
      </ZingChart>
    </div>

    <div class="card list-card" v-if="vendas.length > 0">
      <h3>Gerenciar Lançamentos</h3>
      <ul>
        <li v-for="venda in vendas" :key="venda.id">
          <span>📅 {{ venda.mes }} - <strong>R$ {{ venda.valor }}</strong></span>
          
          <div class="actions">
            <button class="btn-edit" @click="prepararEdicao(venda)">Editar</button>
            <button class="btn-delete" @click="removerVenda(venda.id)">Excluir</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import 'zingchart/es6';
import ZingChart from 'zingchart-vue';

// --- ESTADO (VARIÁVEIS) ---
const loading = ref(true);
const vendas = ref([]); // Lista completa (bruta) do banco
const novoMes = ref('');
const novoValor = ref('');
const idEmEdicao = ref(null);

const mesesDisponiveis = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const chartConfig = ref({
  type: 'bar',
  title: { text: 'Relatório Anual Consolidado', adjustLayout: true, fontSize: 18, color: "#333" },
  scaleX: { labels: [], label: { color: "#333" } },
  scaleY: { label: { color: "#333" }, item: { color: "#333" } },
  plot: { animation: { effect: 2, method: 3, sequence: 1, speed: 500 } },
  backgroundColor: "transparent"
});

const aplicarMascara = (event)=>{
  let valor = event.target.value;
  valor = valor.replace(/\D/g,""); // remove caracters

  const numero = Number(valor)/100; // converte para valor considerando centavos

  novoValor.value = numero.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
}

const chartSeries = ref([]);
const chartKey = ref(0);

const fetchData = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/vendas');
    const result = await response.json();
    
    vendas.value = result.data;

    const mesesGrafico = [];
    const valoresGrafico = [];

    mesesDisponiveis.forEach(mesNome => {
      const vendasDoMes = vendas.value.filter(v => v.mes === mesNome);
      
      if (vendasDoMes.length > 0) {
        const total = vendasDoMes.reduce((acc, curr) => acc + curr.valor, 0);
        mesesGrafico.push(mesNome);
        valoresGrafico.push(total);
      }
    });

    chartConfig.value.scaleX.labels = mesesGrafico;
    chartSeries.value = [{
      values: valoresGrafico,
      text: "Total Vendido",
      backgroundColor: "#6fa8dc",
      tooltip: { text: "R$ %v" }
    }];

  } catch (error) {
    console.error("Erro ao buscar dados:", error);
  } finally {
    loading.value = false;
    chartKey.value++;
  }
};

const salvarVenda = async () => {
  if (!novoMes.value || !novoValor.value) return alert("Preencha todos os campos!");

  const dados = { mes: novoMes.value, valor: Number(novoValor.value) };

  try {
    if (idEmEdicao.value) {
      // UPDATE
      await fetch(`http://localhost:3000/api/vendas/${idEmEdicao.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
    } else {
      // CREATE
      await fetch('http://localhost:3000/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
    }
    cancelarEdicao();

    await fetchData();

  } catch (error) {
    console.error("Erro ao salvar:", error);
  }
};

// --- 3. DELETAR ---
const removerVenda = async (id) => {
  if(!confirm("Tem certeza que deseja excluir este lançamento?")) return;

  try {
    await fetch(`http://localhost:3000/api/vendas/${id}`, { method: 'DELETE' });

    if (idEmEdicao.value === id) cancelarEdicao();
    
    await fetchData();

  } catch (error) {
    console.error("Erro ao deletar:", error);
  }
};

// Auxiliares do Formulário
const prepararEdicao = (venda) => {
  novoMes.value = venda.mes;
  novoValor.value = venda.valor;
  idEmEdicao.value = venda.id;
};

const cancelarEdicao = () => {
  novoMes.value = '';
  novoValor.value = '';
  idEmEdicao.value = null;
};

// Inicialização
onMounted(() => {
  fetchData();
});
</script>

<style>

body { 
  background-color: #f0f2f5; 
  color: #333; 
  margin: 0; 
  font-family: 'Segoe UI', sans-serif; 
}

.container { 
  width: 100%; 
  margin: 40px auto; 
  padding: 20px; 
}

h1, h3 { 
  text-align: center; 
  color: #2c3e50; 
  margin-bottom: 20px;
}

.card, .chart-container { 
  background: #ffffff; 
  color: #333; 
  padding: 20px; 
  border-radius: 10px; 
  box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
  margin-bottom: 20px; 
}

.inputs { 
  display: flex; 
  gap: 10px; 
  justify-content: center; 
  flex-wrap: wrap; 
}

input, select { 
  padding: 10px; 
  border: 1px solid #ddd; 
  border-radius: 5px; 
  outline: none; 
  background: #fff;
  color: #333;
  font-size: 1rem;
}

button { 
  padding: 10px 20px; 
  color: white; 
  border: none; 
  border-radius: 5px; 
  cursor: pointer; 
  font-weight: bold; 
  transition: opacity 0.2s; 
}
button:hover { opacity: 0.9; }

.btn-add { background-color: #28a745; }
.btn-update { background-color: #ffc107; color: #333; }
.btn-cancel { background-color: #6c757d; }
.btn-edit { background-color: #17a2b8; padding: 6px 12px; font-size: 0.9em; }
.btn-delete { background-color: #dc3545; padding: 6px 12px; font-size: 0.9em; }

/* Lista */
ul { list-style: none; padding: 0; margin: 0; }
li { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 15px 10px; 
  border-bottom: 1px solid #eee;
  color: #333; 
}
li:last-child { border-bottom: none; }
li span { font-size: 1.05rem; }

.actions { display: flex; gap: 8px; }
</style>