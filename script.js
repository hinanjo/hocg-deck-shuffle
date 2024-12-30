// Xのアイコン用SVG
const twitterIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
  <path d="M14.258 10.152L23.176 0h-2.113l-7.747 8.813L7.133 0H0l9.352 13.328L0 23.973h2.113l8.176-9.309 6.531 9.309h7.133zm-2.895 3.293l-.949-1.328L2.875 1.56h3.246l6.086 8.523.945 1.328 7.91 11.078h-3.246zm0 0"/>
</svg>`;

async function fetchDeckData(deckId) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = '<div class="loading">デッキデータを取得中...</div>';

  try {
    const response = await fetch(`https://hocg-card-shuffle.vercel.app/proxy/${deckId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      body: JSON.stringify({
        deck_id: deckId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    resultDiv.innerHTML = `
      <div class="error-message">
        デッキデータの取得に失敗しました。<br>
        エラー詳細: ${error.message}
      </div>
    `;
    return null;
  }
}

function shuffleDeck(list, subList) {
  const mainDeck = createDeck(list);
  const subDeck = createDeck(subList || []);

  return {
    mainDeck: shuffleCards(mainDeck).slice(0, 7),
    subDeck: shuffleCards(subDeck).slice(0, 1)
  };
}

function createDeck(list) {
  const deck = [];
  (list || []).forEach(card => {
    for (let i = 0; i < card.num; i++) {
      deck.push({...card});
    }
  });
  return deck;
}

function shuffleCards(cards) {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shareToTwitter(resultElement) {
  try {        
    // 投稿テキストを構築（URLを含まない）
    const text = `【初手ジェネレーター】\nmade by ホロカ情報局（@holoca11）\n\n#ホロカ #ホロ活\n`;
    
    // URLはウェブサイトのベースURLを使用
    const baseUrl = 'https://hinanjo.github.io/hocg-deck-shuffle/';
    
    // モバイルデバイスかどうかの判定
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // エンコードされたパラメータを使用してURLを構築
    const tweetUrl = new URL('https://twitter.com/intent/tweet');
    tweetUrl.searchParams.append('text', text);
    tweetUrl.searchParams.append('url', baseUrl);

    if (isMobile) {
      // モバイルの場合は直接リンクを開く
      window.location.href = tweetUrl.toString();
    } else {
      // PCの場合はポップアップウィンドウを開く
      window.open(
        tweetUrl.toString(),
        '_blank',
        'width=550,height=420,menubar=no,toolbar=no,scrollbars=yes'
      );
    }
  } catch (error) {
    console.error('Error sharing to Twitter:', error);
    alert('Xの投稿画面を開けませんでした。\nエラー: ' + error.message);
  }
}

async function captureResult(resultElement) {
  try {
    // ボタングループを一時的に非表示
    const buttonGroup = resultElement.querySelector('.button-group');
    buttonGroup.style.display = 'none';

    // キャプチャ用のラッパー要素を作成
    const wrapper = document.createElement('div');
    wrapper.className = 'capture-area';
    
    // 結果要素をクローン
    const clone = resultElement.cloneNode(true);
    
    // 不要な要素を削除
    const cloneButtonGroup = clone.querySelector('.button-group');
    if (cloneButtonGroup) cloneButtonGroup.remove();

    // カードグリッドのスタイルを調整
    const cardGrid = clone.querySelector('.card-grid');
    if (cardGrid) {
      cardGrid.style.display = 'grid';
      cardGrid.style.gridTemplateColumns = 'repeat(8, 1fr)';
      cardGrid.style.gap = '10px';
      cardGrid.style.width = '100%';
    }

    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // キャプチャ
    const canvas = await html2canvas(wrapper, {
      width: 1200,
      height: 628,
      scale: 1,
      useCORS: true,
      logging: false,
      backgroundColor: '#F7F9FC'
    });

    // 一時要素を削除
    document.body.removeChild(wrapper);
    
    // ボタングループを再表示
    buttonGroup.style.display = 'flex';

    // 画像をダウンロード
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `shuffle-result-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png', 0.9);
    link.click();
  } catch (error) {
    console.error('Error capturing result:', error);
    alert('画像の生成に失敗しました。');
  }
}

function displayResults(shuffledResults) {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = shuffledResults.map((result, index) => `
    <div class="result-card">
      <h3 class="result-title">シャッフル結果 ${index + 1}</h3>
      <div class="deck-section">
        <div class="card-grid">
          ${result.mainDeck.map((card, i) => `
            <div class="card-item">
              <div class="card-image">
                <img 
                  src="images/${card.img.replace(/\\/g, '/')}" 
                  alt="${card.name}"
                  loading="lazy"
                  onerror="this.src='images/Back_side.png'"
                >
              </div>
              <div class="card-details">
                <span class="card-number">${i + 1}.</span>
                <span class="card-name">${card.name}</span>
                <span class="card-id">(${card.card_number})</span>
              </div>
            </div>
          `).join('')}
          ${result.subDeck.map(card => `
            <div class="card-item">
              <div class="card-image">
                <img 
                  src="images/${card.img.replace(/\\/g, '/')}" 
                  alt="${card.name}"
                  loading="lazy"
                  onerror="this.src='images/Back_side.png'"
                >
              </div>
              <div class="card-details">
                <span class="card-number">エール<br>デッキ</span>
                <span class="card-name">${card.name}</span>
                <span class="card-id">(${card.card_number})</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="button-group">
        <button onclick="captureResult(this.parentElement.parentElement)" class="screenshot-button">
          結果を画像で保存
        </button>
        <button onclick="shareToTwitter(this.parentElement.parentElement)" class="twitter-button">
          ${twitterIcon}Xの投稿画面を開く（画像を添付してください）
        </button>
      </div>
    </div>
  `).join('');
}

async function handleShuffle() {
  const deckId = document.getElementById("deck-id").value.trim();
  const outputCount = parseInt(document.getElementById("output-count").value, 10);

  if (!deckId) {
    alert("デッキコードを入力してください。");
    return;
  }

  if (isNaN(outputCount) || outputCount < 1 || outputCount > 10) {
    alert("シャッフル回数は1から10の間で指定してください。");
    return;
  }

  const deckData = await fetchDeckData(deckId);
  if (!deckData) return;

  const results = [];
  for (let i = 0; i < outputCount; i++) {
    results.push(shuffleDeck(deckData.list, deckData.sub_list));
  }

  displayResults(results);
}
