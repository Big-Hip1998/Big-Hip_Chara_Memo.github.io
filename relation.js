let networkInstance = null;

// 相関図のドロップダウン選択肢を更新
function updateRelationSelects() {
  const fromSelect = document.getElementById('relFrom');
  const toSelect = document.getElementById('relTo');
  
  fromSelect.innerHTML = '';
  toSelect.innerHTML = '';

  allCharacters.forEach(c => {
    const opt1 = new Option(c.name, c.id);
    const opt2 = new Option(c.name, c.id);
    fromSelect.add(opt1);
    toSelect.add(opt2);
  });
}

// 相関図の描画
function renderRelationGraph() {
  const container = document.getElementById('networkCanvas');
  
  // Vis.js用のデータ形式に変換
  const nodes = new vis.DataSet(
    allCharacters.map(c => ({ id: c.id, label: c.name, shape: 'circle', color: '#3498db', font: { color: 'white' } }))
  );

  const edges = new vis.DataSet(
    allRelations.map(r => ({ from: r.fromId, to: r.toId, label: r.label, arrows: 'to', font: { align: 'top' } }))
  );

  const data = { nodes: nodes, edges: edges };
  const options = {
    physics: { enabled: true, barnesHut: { springLength: 150 } },
    edges: { color: '#7f8c8d', smooth: true }
  };

  if (networkInstance) {
    networkInstance.destroy();
  }
  networkInstance = new vis.Network(container, data, options);
}

// 関係性の新規追加
async function addRelation() {
  const fromId = document.getElementById('relFrom').value;
  const toId = document.getElementById('relTo').value;
  const label = document.getElementById('relLabel').value;

  if (!fromId || !toId) {
    alert("キャラクターを選択してください。");
    return;
  }
  if (fromId === toId) {
    alert("異なるキャラクターを選択してください。");
    return;
  }

  const newRel = {
    action: 'addRelation',
    data: {
      id: "rel_" + Date.now(),
      fromId: fromId,
      toId: toId,
      label: label
    }
  };

  try {
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(newRel)
    });
    
    document.getElementById('relLabel').value = '';
    await fetchData();
    renderRelationGraph();
    alert("関係性を追加しました！");
  } catch (err) {
    alert("保存失敗: " + err);
  }
}