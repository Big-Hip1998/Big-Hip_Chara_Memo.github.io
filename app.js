// ★★★ 末尾を /exec の本番用URLに変更しました ★★★
const GAS_URL = "https://script.google.com/macros/s/AKfycbzloiXRseiuPp6o3_Z_mqYxjZPk5Z5VzlSX_oS7gMaSArXw15msq_Pi6bY5ErBQdR927Q/exec";

let allCharacters = [];
let allRelations = [];

// 初期化処理
document.addEventListener("DOMContentLoaded", () => {
  fetchData();

  document.getElementById('addCharForm').addEventListener('submit', handleAddCharacter);
});

// タブ切り替え機能
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  
  document.getElementById(`tab-${tabName}`).classList.add('active');
  event.target.classList.add('active');

  if (tabName === 'relation') {
    renderRelationGraph(); // 相関図タブが開かれた際に描画を更新
  }
}

// データの全取得
async function fetchData() {
  try {
    const res = await fetch(GAS_URL);
    const data = await res.json();
    allCharacters = data.characters || [];
    allRelations = data.relations || [];
    
    filterAndSortCharacters();
    updateRelationSelects();
  } catch (err) {
    alert("データの取得に失敗しました: " + err);
  }
}

// 検索・ソート処理
function filterAndSortCharacters() {
  const searchText = document.getElementById('searchInput').value.toLowerCase().trim();
  const bloodTypeFilter = document.getElementById('filterBloodType').value;
  const sortValue = document.getElementById('sortSelect').value;

  // 1. 絞り込み処理
  let filtered = allCharacters.filter(c => {
    // キーワード検索（名前・詳細設定・誕生日・星座・干支などを対象）
    const matchKeyword = !searchText || 
      (c.name && c.name.toLowerCase().includes(searchText)) ||
      (c.details && c.details.toLowerCase().includes(searchText)) ||
      (c.zodiac && c.zodiac.toLowerCase().includes(searchText)) ||
      (c.zodiacAnimal && c.zodiacAnimal.toLowerCase().includes(searchText));

    // 血液型フィルタ
    const matchBloodType = !bloodTypeFilter || c.bloodType === bloodTypeFilter;

    return matchKeyword && matchBloodType;
  });

  // 2. ソート処理
  filtered.sort((a, b) => {
    if (sortValue === 'name-asc') return (a.name || '').localeCompare(b.name || '', 'ja');
    if (sortValue === 'height-asc') return (Number(a.height) || 0) - (Number(b.height) || 0);
    if (sortValue === 'height-desc') return (Number(b.height) || 0) - (Number(a.height) || 0);
    return 0; // デフォルト（登録順）
  });

  renderCharacterList(filtered);
}

// カードの画面描画
function renderCharacterList(characters) {
  const container = document.getElementById('characterList');
  container.innerHTML = '';

  if (characters.length === 0) {
    container.innerHTML = '<p>該当するキャラクターがいません。</p>';
    return;
  }

  characters.forEach(c => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      ${c.imageUrl ? `<img src="${escapeHtml(c.imageUrl)}" class="card-image" alt="${escapeHtml(c.name)}">` : ''}
      <div class="card-header">
        <h3>${escapeHtml(c.name)}</h3>
        <button class="delete-btn" onclick="deleteCharacter('${c.id}', '${escapeHtml(c.name)}')">削除</button>
      </div>
      <div class="card-tags">
        ${c.birthday ? `<span class="tag">🎂 ${escapeHtml(c.birthday)}</span>` : ''}
        ${c.height ? `<span class="tag">📏 ${escapeHtml(c.height)}cm</span>` : ''}
        ${c.bloodType ? `<span class="tag">🩸 ${escapeHtml(c.bloodType)}</span>` : ''}
        ${c.zodiac ? `<span class="tag">⭐ ${escapeHtml(c.zodiac)}</span>` : ''}
        ${c.zodiacAnimal ? `<span class="tag">🐾 ${escapeHtml(c.zodiacAnimal)}</span>` : ''}
      </div>
      <div class="card-details">${escapeHtml(c.details || '')}</div>
    `;
    container.appendChild(card);
  });
}

// キャラ新規保存処理
async function handleAddCharacter(e) {
  e.preventDefault();
  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.innerText = "画像アップロード＆保存中...";

  const fileInput = document.getElementById('addImage');
  let imageBase64 = '';
  let imageName = '';

  // 画像ファイルが選択されている場合Base64形式に変換
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    imageName = file.name;
    imageBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  const newChar = {
    action: 'addCharacter',
    data: {
      id: "char_" + Date.now(),
      name: document.getElementById('addName').value,
      birthday: document.getElementById('addBirthday').value,
      height: document.getElementById('addHeight').value,
      bloodType: document.getElementById('addBloodType').value,
      zodiac: document.getElementById('addZodiac').value,
      zodiacAnimal: document.getElementById('addZodiacAnimal').value,
      details: document.getElementById('addDetails').value,
      imageBase64: imageBase64,
      imageName: imageName
    }
  };

  try {
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(newChar)
    });
    
    document.getElementById('addCharForm').reset();
    await fetchData();
    alert("登録が完了しました！");
    switchTab('list');
  } catch (err) {
    alert("保存失敗: " + err);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = "保存する";
  }
}

// キャラ削除処理
async function deleteCharacter(id, name) {
  if (!confirm(`「${name}」を削除してもよろしいですか？\n（関連する相関図のデータも削除されます）`)) {
    return;
  }

  try {
    await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'deleteCharacter',
        data: { id: id }
      })
    });

    alert(`「${name}」を削除しました。`);
    await fetchData(); // 最新データの再取得
  } catch (err) {
    alert("削除に失敗しました: " + err);
  }
}

// XSS対策のエスケープ関数
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}