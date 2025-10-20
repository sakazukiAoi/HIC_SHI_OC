//始めますか？の画面
document.addEventListener("DOMContentLoaded", () => {
    const startOverlay = document.getElementById("start-overlay");
    const startButton = document.getElementById("start-button");

    startButton.addEventListener("click", () => {
        // フェードアウト
        startOverlay.classList.add("fade-out");

        // 完全に消したい場合（アニメ後に削除）
        setTimeout(() => {
            startOverlay.remove();
        }, 1000);
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const characterContainer = document.getElementById('character-container');
    const characterTreeContainer = document.getElementById('character-tree'); // IDを変更
    let currentCharacterData = null; // 現在表示中のキャラクターデータ

    // メインタブの定義（固定のタブと、動的に生成する eras のプレースホルダー）
    const fixedMainTabs = [
        {
            id: 'basic', title: '基礎', sections: [
                { id: 'basic-info', title: '基本情報', dataPath: 'basic_info' },
                { id: 'basic-physical-characteristics', title: '身体的特徴', dataPath: 'physical_characteristics' },
                { id: 'basic-body-habits', title: '体癖', dataPath: 'body_habits' },
                { id: 'basic-sexual-preferences', title: '関係・恋愛', dataPath: 'sexual_habits_preferences' },
                { id: 'basic-daily-life', title: '日常', dataPath: 'daily_life' },

                { id: 'basic-images', title: '画像', dataPath: 'character_images_by_era.basic', type: 'image_section' }
            ]
        },
        {
            id: 'additional', title: '追加情報', sections: [
                { id: 'other-timeline-events', title: 'その他の出来事', dataPath: 'timeline.other_timeline.events' },
                { id: 'future-outlook', title: '将来の展望', dataPath: 'timeline.other_timeline.future_outlook' }
            ]
        },
        { id: 'lines', title: 'セリフ', dataPath: 'tabs.character_lines' },
        { id: 'videos', title: '動画', dataPath: 'tabs.character_videos' },
        { id: 'questions', title: 'その他質問', dataPath: 'tabs.other_questions' }
    ];

    // 動的に生成される eras 用のセクションテンプレート
    const eraSectionTemplate = [
        { idSuffix: 'overview', title: '概要', dataKey: 'overview' },
        { idSuffix: 'physical-characteristics', title: '身体的特徴', dataKey: 'physical_characteristics' },
        { idSuffix: 'body-habits', title: '体癖', dataKey: 'body_habits' },
        { idSuffix: 'relationships-love', title: '関係・恋愛', dataKey: 'relationships_love' },
        { idSuffix: 'daily-life', title: '日常', dataKey: 'daily_life' },
        { idSuffix: 'environment', title: '環境', dataKey: 'environment' },

        { idSuffix: 'images', title: '画像', dataKey: 'images', type: 'image_section' }
    ];

    // === 初期化処理 ===
    async function initialize() {
        try {
            const indexResponse = await fetch('data/characters.json');
            if (!indexResponse.ok) throw new Error(`HTTP error! status: ${indexResponse.status}`);
            const characterIndex = await indexResponse.json();
            
            // キャラクターツリーUIを生成
            createCharacterTree(characterIndex.categories);

            // クエリパラメータからキャラクターIDを読み込み、該当キャラクターを表示
            const params = new URLSearchParams(window.location.search);
            const charId = params.get('charId');
            if (charId) {
                const charInfo = findCharacterInfoById(characterIndex.categories, charId);
                if (charInfo) {
                    await loadAndDisplayCharacter(charInfo.filePath);
                    // URLで指定されたキャラクターがツリー内で選択状態になるようにする
                    const charLink = characterTreeContainer.querySelector(`[data-char-id="${charId}"]`);
                    if (charLink) {
                        charLink.classList.add('active');
                        // 親カテゴリを開く
                        let parentUl = charLink.closest('ul');
                        while(parentUl && parentUl.classList.contains('category-list')) {
                            const toggleButton = parentUl.previousElementSibling; // ulの前の兄弟要素がボタン
                            if (toggleButton && !toggleButton.classList.contains('open')) {
                                toggleButton.classList.add('open');
                                parentUl.style.display = 'block';
                            }
                            parentUl = toggleButton ? toggleButton.closest('ul') : null;
                        }
                    }
                } else {
                    characterContainer.innerHTML = '<p>指定されたキャラクターが見つかりません。</p>';
                }
            } else {
                characterContainer.innerHTML = '<p>左側のリストからキャラクターを選択してください。</p>';
            }

        } catch (error) {
            console.error('キャラクターインデックスの読み込みに失敗しました:', error);
            characterContainer.innerHTML = '<p>キャラクターデータの読み込みに失敗しました。</p>';
        }
    }

    // === キャラクターツリーUIの生成 ===
    function createCharacterTree(categories) {
        characterTreeContainer.innerHTML = ''; // コンテンツをクリア

        const rootUl = document.createElement('ul');
        rootUl.classList.add('character-tree-root');
        characterTreeContainer.appendChild(rootUl);

        // カテゴリを再帰的に処理してリストを追加
        function renderCategory(node, parentUl) {
            for (const key in node) {
                if (node.hasOwnProperty(key)) {
                    const item = node[key];
                    if (item.filePath) { // これがキャラクターエントリの場合
                        const li = document.createElement('li');
                        const charLink = document.createElement('a');
                        charLink.href = `#`; // または `javascript:void(0)`
                        charLink.textContent = item.mainName; // キャラクター名を表示
                        charLink.classList.add('character-link');
                        charLink.dataset.charId = item.id;
                        charLink.dataset.filePath = item.filePath;
                        
                        charLink.addEventListener('click', async (event) => {
                            event.preventDefault(); // リンクのデフォルト動作をキャンセル
                            // アクティブなリンクをリセット
                            characterTreeContainer.querySelectorAll('.character-link').forEach(link => {
                                link.classList.remove('active');
                            });
                            charLink.classList.add('active'); // クリックされたリンクをアクティブに
                            
                            // URLにキャラクターIDを追加
                            const newUrl = new URL(window.location.href);
                            newUrl.searchParams.set('charId', item.id);
                            window.history.pushState({ charId: item.id }, '', newUrl.toString());

                            await loadAndDisplayCharacter(item.filePath);
                        });
                        li.appendChild(charLink);
                        parentUl.appendChild(li);
                    } else if (typeof item === 'object') { // これがカテゴリの場合
                        const categoryLi = document.createElement('li');
                        const categoryToggle = document.createElement('button');
                        categoryToggle.classList.add('category-toggle');
                        categoryToggle.textContent = key; // カテゴリ名

                        const icon = document.createElement('span');
                        icon.classList.add('toggle-icon');
                        icon.textContent = '▶'; // 閉じた状態のアイコン
                        categoryToggle.prepend(icon); // カテゴリ名の前に追加

                        const subUl = document.createElement('ul');
                        subUl.classList.add('category-list');
                        subUl.style.display = 'none'; // デフォルトで非表示

                        categoryToggle.addEventListener('click', () => {
                            const isOpen = categoryToggle.classList.toggle('open');
                            icon.textContent = isOpen ? '▼' : '▶';
                            subUl.style.display = isOpen ? 'block' : 'none';
                        });

                        categoryLi.appendChild(categoryToggle);
                        categoryLi.appendChild(subUl);
                        parentUl.appendChild(categoryLi);

                        renderCategory(item, subUl); // 再帰呼び出し
                    }
                }
            }
        }

        renderCategory(categories, rootUl);
    }

    // === キャラクターIDからキャラクター情報を検索する関数 ===
    function findCharacterInfoById(categories, idToFind) {
        let foundChar = null;

        function search(node) {
            for (const key in node) {
                if (node.hasOwnProperty(key)) {
                    const item = node[key];
                    if (item.id === idToFind) {
                        foundChar = item;
                        return true; // 見つかったら探索を終了
                    }
                    if (typeof item === 'object' && !item.filePath) { // それ自身がカテゴリの場合（filePathがない）
                         if (search(item)) { // そのカテゴリ内の子要素を再帰的に検索
                             return true;
                         }
                    }
                }
            }
            return false;
        }
        search(categories);
        return foundChar;
    }


    // === キャラクターデータの読み込みと表示 ===
    async function loadAndDisplayCharacter(filePath) {
        characterContainer.innerHTML = '<p>データを読み込み中...</p>'; // ローディングメッセージ
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            currentCharacterData = await response.json();
            renderCharacterDetails(currentCharacterData);
        } catch (error) {
            console.error(`キャラクターデータ ${filePath} の読み込みに失敗しました:`, error);
            characterContainer.innerHTML = '<p>キャラクターデータの読み込みに失敗しました。</p>';
            currentCharacterData = null; // エラー時はデータをクリア
        }
    }

    // === キャラクター詳細のレンダリング ===
    function renderCharacterDetails(characterData) {
        characterContainer.innerHTML = ''; // 既存の内容をクリア

        // キャラクター名の表示
        const characterNameElement = document.createElement('h2');
        characterNameElement.classList.add('character-name-title');
        characterNameElement.textContent = characterData.character_name || 'キャラクター名';
        characterContainer.appendChild(characterNameElement);

        // メインタブのコンテナを再生成
        const mainTabsContainer = document.createElement('div');
        mainTabsContainer.classList.add('main-tabs-container');
        characterContainer.appendChild(mainTabsContainer);

        const mainTabList = document.createElement('ul');
        mainTabList.classList.add('main-tab-list');
        mainTabsContainer.appendChild(mainTabList);

        const mainTabContentContainer = document.createElement('div');
        mainTabContentContainer.classList.add('main-tab-content-container');
        mainTabsContainer.appendChild(mainTabContentContainer);

        // まず固定タブを処理
        fixedMainTabs.forEach((tab) => {
            let tabDataExists = false;
            let currentDataPointer = characterData; // データパスを辿るための仮変数

            if (tab.id === 'basic') { // 'basic'タブは常に表示
                tabDataExists = true;
            } else if (tab.dataPath) {
                const keys = tab.dataPath.split('.');
                for (const key of keys) {
                    if (currentDataPointer && typeof currentDataPointer === 'object' && key in currentDataPointer) {
                        currentDataPointer = currentDataPointer[key];
                    } else {
                        currentDataPointer = null; // パスが見つからない
                        break;
                    }
                }
                if (currentDataPointer !== null && currentDataPointer !== undefined &&
                    (Array.isArray(currentDataPointer) ? currentDataPointer.length > 0 : (typeof currentDataPointer === 'object' ? Object.keys(currentDataPointer).length > 0 : String(currentDataPointer).trim() !== ''))
                ) {
                    tabDataExists = true;
                }
            }

            if (tabDataExists) {
                createMainTab(tab, characterData, mainTabList, mainTabContentContainer);
            }
        });

        // 次に dynamic 'eras' を処理
        if (characterData.eras && Array.isArray(characterData.eras)) {
            characterData.eras.forEach((era, index) => {
                if (era && Object.keys(era).length > 0) {
                    const eraTab = {
                        id: era.id || `era-${index}`,
                        title: era.title || `無題の章 ${index + 1}`,
                        sections: eraSectionTemplate.map(template => ({
                            id: `${era.id || `era-${index}`}-${template.idSuffix}`,
                            title: template.title,
                            dataPath: template.dataKey,
                            type: template.type
                        }))
                    };
                    createMainTab(eraTab, era, mainTabList, mainTabContentContainer);
                }
            });
        }

        // 最初のタブをアクティブにする処理
        const allMainTabButtons = mainTabList.querySelectorAll('.main-tab-button');
        const allMainTabContents = mainTabContentContainer.querySelectorAll('.main-tab-content');

        if (allMainTabButtons.length > 0) {
            const firstActiveMainTabButton = allMainTabButtons[0];
            const firstActiveMainTabContent = allMainTabContents[0];

            firstActiveMainTabButton.classList.add('active');
            firstActiveMainTabContent.classList.add('active');

            // 最初のメインタブ内の最初のサブタブをアクティブにする
            const firstSubTabButton = firstActiveMainTabContent.querySelector('.sub-tab-list .sub-tab-button');
            const firstSubTabContent = firstActiveMainTabContent.querySelector('.sub-tab-content-container .section-content');
            if (firstSubTabButton) {
                firstSubTabButton.classList.add('active');
                firstSubTabContent.classList.add('active');
            }
        }

        // 全てのメインタブが生成された後、まとめてイベントリスナーを設定
        mainTabList.querySelectorAll('.main-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                mainTabList.querySelectorAll('.main-tab-button').forEach(btn => btn.classList.remove('active'));
                mainTabContentContainer.querySelectorAll('.main-tab-content').forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(`main-tab-content-${button.dataset.tabId}`).classList.add('active');

                // メインタブが切り替わったときに、そのタブ内の最初のサブタブをアクティブにする
                const activeMainTabContent = document.getElementById(`main-tab-content-${button.dataset.tabId}`);
                const firstSubTabButton = activeMainTabContent.querySelector('.sub-tab-list .sub-tab-button');
                const firstSubTabContent = activeMainTabContent.querySelector('.sub-tab-content-container .section-content');

                activeMainTabContent.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                activeMainTabContent.querySelectorAll('.section-content').forEach(content => content.classList.remove('active'));

                if (firstSubTabButton) {
                    firstSubTabButton.classList.add('active');
                    firstSubTabContent.classList.add('active');
                }
            });
        });
    }


    // === メインタブの生成とイベントリスナー設定をカプセル化する関数 ===
    function createMainTab(tabDefinition, tabDataSource, mainTabListElement, mainTabContentContainerElement) {
        const tabButtonLi = document.createElement('li');
        const tabButton = document.createElement('button');
        tabButton.textContent = tabDefinition.title;
        tabButton.classList.add('main-tab-button');
        tabButton.dataset.tabId = tabDefinition.id;
        tabButtonLi.appendChild(tabButton);
        mainTabListElement.appendChild(tabButtonLi);

        const tabContentDiv = document.createElement('div');
        tabContentDiv.id = `main-tab-content-${tabDefinition.id}`;
        tabContentDiv.classList.add('main-tab-content');

        if (tabDefinition.sections) {
            // サブタブまたはセクションがある場合
            const subTabsContainer = document.createElement('div');
            subTabsContainer.classList.add('sub-tabs-container');
            const subTabList = document.createElement('ul');
            subTabList.classList.add('sub-tab-list');
            const subTabContentContainer = document.createElement('div');
            subTabContentContainer.classList.add('sub-tab-content-container');

            let firstActiveSubTabButton = null;
            let firstActiveSectionContent = null;

            tabDefinition.sections.forEach((section) => {
                let sectionData = null;
                let currentSectionDataExists = false;

                // セクションのdataPath (dataKey) に基づいてデータを取得
                if (tabDefinition.id === 'basic' && section.dataPath) { // 'basic'タブのサブセクションは常にcharacterDataから
                    const keys = section.dataPath.split('.');
                    let temp = currentCharacterData; // currentCharacterDataから辿る
                    for (const key of keys) {
                        if (temp && typeof temp === 'object' && key in temp) {
                            temp = temp[key];
                        } else {
                            temp = null;
                            break;
                        }
                    }
                    sectionData = temp;
                } else if (section.dataPath) { // eras内のサブセクションはtabDataSourceから
                    sectionData = tabDataSource[section.dataPath];
                }

                if (sectionData !== null && sectionData !== undefined) {
                    if (Array.isArray(sectionData)) {
                        currentSectionDataExists = sectionData.length > 0;
                    } else if (typeof sectionData === 'object') {
                        currentSectionDataExists = Object.keys(sectionData).length > 0;
                    } else if (typeof sectionData === 'string') {
                        currentSectionDataExists = sectionData.trim() !== '';
                    } else {
                        currentSectionDataExists = true; // その他のプリミティブ型は存在する
                    }
                }

                if (currentSectionDataExists) {
                    const subTabButtonLi = document.createElement('li');
                    const subTabButton = document.createElement('button');
                    subTabButton.textContent = section.title;
                    subTabButton.classList.add('sub-tab-button');
                    subTabButton.dataset.sectionId = section.id;
                    subTabButtonLi.appendChild(subTabButton);
                    subTabList.appendChild(subTabButtonLi);

                    const sectionContentDiv = document.createElement('div');
                    sectionContentDiv.id = `section-content-${section.id}`;
                    sectionContentDiv.classList.add('section-content');

                    // コンテンツのレンダリング
                    if (section.type === 'image_section') {
                        let imageHtml = `
                            <div class="image-sub-tabs-container">
                                <ul class="image-sub-tab-list">
                                    <li><button class="image-sub-tab-button active" data-image-type="standing_normal">通常立ち絵</button></li>
                                    <li><button class="image-sub-tab-button" data-image-type="standing_variants">差分</button></li>
                                    <li><button class="image-sub-tab-button" data-image-type="three_view">三面図</button></li>
                                    <li><button class="image-sub-tab-button" data-image-type="accessories">装飾品</button></li>
                                </ul>
                                <div id="image-display-area-${section.id}" class="image-display-area"></div>
                            </div>
                        `;
                        sectionContentDiv.innerHTML = imageHtml;
                        // 初期表示として通常立ち絵を表示
                        setTimeout(() => { // DOMが描画されてから実行
                            displayImageContent(sectionData, 'standing_normal', sectionContentDiv.querySelector(`#image-display-area-${section.id}`));
                        }, 0);

                        // 画像サブタブボタンのイベントリスナーを設定
                        sectionContentDiv.querySelectorAll('.image-sub-tab-button').forEach(imgSubButton => {
                            imgSubButton.addEventListener('click', () => {
                                sectionContentDiv.querySelectorAll('.image-sub-tab-button').forEach(btn => btn.classList.remove('active'));
                                imgSubButton.classList.add('active');
                                displayImageContent(sectionData, imgSubButton.dataset.imageType, sectionContentDiv.querySelector(`#image-display-area-${section.id}`));
                            });
                        });
                    } else if (sectionData) {
                        sectionContentDiv.innerHTML = formatCharacterData(sectionData, section.id);
                    } else {
                        sectionContentDiv.innerHTML = '<p>データがありません。</p>';
                    }

                    subTabContentContainer.appendChild(sectionContentDiv);

                    if (!firstActiveSubTabButton) {
                        firstActiveSubTabButton = subTabButton;
                        firstActiveSectionContent = sectionContentDiv;
                    }
                }
            });

            if (subTabList.children.length > 0) {
                subTabsContainer.appendChild(subTabList);
                subTabsContainer.appendChild(subTabContentContainer);
                tabContentDiv.appendChild(subTabsContainer);

                if (firstActiveSubTabButton) {
                    firstActiveSubTabButton.classList.add('active');
                    firstActiveSectionContent.classList.add('active');
                }

                subTabList.querySelectorAll('.sub-tab-button').forEach(subButton => {
                    subButton.addEventListener('click', () => {
                        subTabList.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        subTabContentContainer.querySelectorAll('.section-content').forEach(content => content.classList.remove('active'));

                        subButton.classList.add('active');
                        document.getElementById(`section-content-${subButton.dataset.sectionId}`).classList.add('active');
                    });
                });
            } else {
                tabContentDiv.innerHTML = '<p>このタブには表示できるデータがありません。</p>';
            }

        } else { // AGFOSを持たない単独のタブ (例: セリフ、動画)
            let data = null;
            if (tabDefinition.dataPath) {
                const keys = tabDefinition.dataPath.split('.');
                let temp = currentCharacterData; // グローバルのcurrentCharacterDataから辿る
                for (const key of keys) {
                    if (temp && typeof temp === 'object' && key in temp) {
                        temp = temp[key];
                    } else {
                        temp = null;
                        break;
                    }
                }
                data = temp;
            }

            if (tabDefinition.id === 'lines') {
                if (data && Array.isArray(data) && data.length > 0) {
                    tabContentDiv.innerHTML = '<ul>' + data.map(line => `<li>${line}</li>`).join('') + '</ul>';
                } else {
                    tabContentDiv.innerHTML = '<p>セリフはありません。</p>';
                }
            } else if (tabDefinition.id === 'videos') {
                if (data && Array.isArray(data) && data.length > 0) {
                    data.forEach(video => {
                        tabContentDiv.innerHTML += `
                            <h4>${video.title || '動画'}</h4>
                            <video controls style="max-width: 100%; display: block; margin-bottom: 15px;">
                                <source src="${video.url}" type="video/mp4">
                                お使いのブラウザは動画タグをサポートしていません。
                            </video>
                        `;
                    });
                } else {
                    tabContentDiv.innerHTML = '<p>動画はありません。</p>';
                }
            }else if (tabDefinition.id === 'questions') {
                if (data && Array.isArray(data) && data.length > 0) {
                    tabContentDiv.innerHTML = '<ul>' + data.map(item => `<li><strong>${item.Q}</strong>: ${item.A}</li>`).join('') + '</ul>';
                } else {
                    tabContentDiv.innerHTML = '<p>その他の質問はありません。</p>';
            }
            } else if (data) {
                tabContentDiv.innerHTML = formatCharacterData(data, tabDefinition.id);
            } else {
                tabContentDiv.innerHTML = '<p>データがありません。</p>';
            }
        }
        mainTabContentContainerElement.appendChild(tabContentDiv);
    }


    // === データ整形関数 ===
    function formatCharacterData(data, sectionId) {
        let html = '';

        if (!data) {
            return '<p>データがありません。</p>';
        }

        if (typeof data === 'object' && !Array.isArray(data)) {
            const orderedKeys = {
                'basic-info': ["name", "gender", "age", "birthday", "occupation", "hometown", "family", "personality", "motto", "likes", "dislikes", "strengths", "weaknesses", "hobbies", "special_skills", "dreams_goals", "secrets"],
                'physical-characteristics': ["height", "weight", "body_type", "hair_color", "eye_color", "skin_color", "distinctive_features"],
                'body-habits': ["posture", "gait", "gestures", "facial_expressions", "speaking_habits", "sleep_habits", "eating_habits", "toilet_habits"],
                'sexual-preferences': ["sexual_orientation", "relationship_status", "ideal_partner", "sexual_experience", "sexual_preferences", "views_on_love"],
                'daily-life': ["morning", "daytime", "night", "holidays", "stress_relief", "favorite_place"],
                'environment': ["home", "school", "work_place", "other"], // 環境用キーを追加
                'other-questions': ["favorite_color", "favorite_food", "least_favorite_food", "music_genre", "movies_books", "dream_job", "what_to_cherish"],
                // 新しいeraのoverviewなど、直接テキストが来る可能性のあるものも考慮
                'overview': [] // overviewは通常直接テキストなので、キーのリストは不要
            };

            const keysToDisplay = orderedKeys[sectionId] || Object.keys(data);

            if (sectionId.includes('overview')) { // overviewセクションの場合は直接テキストとして表示
                if (typeof data === 'string') {
                    html += `<p>${data}</p>`;
                } else if (Object.keys(data).length > 0) { // overviewがオブジェクト形式の場合（想定外だが念のため）
                    for (const key in data) {
                        if (data.hasOwnProperty(key) && String(data[key]).trim() !== '') {
                            html += `<p><strong>${formatKeyForDisplay(key)}:</strong> ${data[key]}</p>`;
                        }
                    }
                } else {
                    html += '<p>概要がありません。</p>';
                }
            } else {
                let hasContent = false;
                keysToDisplay.forEach(key => {
                    if (data.hasOwnProperty(key)) {
                        const value = data[key];
                        const displayKey = formatKeyForDisplay(key);
                        if (value !== null && value !== undefined && String(value).trim() !== '') {
                            html += `<p><strong>${displayKey}:</strong> ${value}</p>`;
                            hasContent = true;
                        }
                    }
                });
                if (!hasContent) {
                    html += '<p>データがありません。</p>';
                }
            }
        } else if (Array.isArray(data)) {
            if (data.length > 0) {
                html += '<ul>';
                data.forEach(item => {
                    if (typeof item === 'object' && item !== null) {
                        html += '<li>';
                        for (const key in item) {
                            if (item.hasOwnProperty(key) && String(item[key]).trim() !== '') {
                                html += `<strong>${formatKeyForDisplay(key)}:</strong> ${item[key]} `;
                            }
                        }
                        html += '</li>';
                    } else if (typeof item === 'string' && item.trim() !== '') {
                        html += `<li>${item}</li>`;
                    }
                });
                html += '</ul>';
                if (html === '<ul></ul>') { // 全て空の要素だった場合
                    html = '<p>データがありません。</p>';
                }
            } else {
                html += '<p>データがありません。</p>';
            }
        } else if (typeof data === 'string' && data.trim() !== '') {
            html += `<p>${data}</p>`;
        } else {
            html += '<p>データがありません。</p>';
        }

        return html;
    }

    // === キーを整形するヘルパー関数 ===
    function formatKeyForDisplay(key) {
        return key.replace(/_/g, ' ')
                  .replace(/\b\w/g, char => char.toUpperCase());
    }

    // === 画像表示関数 ===
    function displayImageContent(imageData, imageType, displayArea) {
        displayArea.innerHTML = ''; // クリア

        if (!imageData || !imageData[imageType] || !Array.isArray(imageData[imageType]) || imageData[imageType].length === 0) {
            displayArea.innerHTML = `<p>表示できる${imageType === 'standing_normal' ? '通常立ち絵' : imageType === 'standing_variants' ? '差分' : imageType === 'three_view' ? '三面図' : imageType === 'accessories' ? '装飾品' : imageType}の画像はありません。</p>`;
            return;
        }

        const galleryDiv = document.createElement('div');
        galleryDiv.classList.add('image-gallery');

        imageData[imageType].forEach(imagePath => {
            const imgWrapper = document.createElement('div');
            imgWrapper.classList.add('image-item');
            const img = document.createElement('img');
            img.src = imagePath;
            img.alt = imageType;
            img.classList.add('character-image');
            imgWrapper.appendChild(img);
            galleryDiv.appendChild(imgWrapper);
        });
        displayArea.appendChild(galleryDiv);
    }

    // 初期化関数を呼び出す
    initialize();
});

//ホバー時に音を鳴らす
document.addEventListener("DOMContentLoaded", () => {
    const startOverlay = document.getElementById("start-overlay");
    const startButton = document.getElementById("start-button");

    startButton.addEventListener("click", () => {
        // フェードアウト
        startOverlay.classList.add("fade-out");

        // アニメ後に削除
        setTimeout(() => {
            startOverlay.remove();
            enableHoverSounds(); // フェードアウト完了後に音システム起動
        }, 1000);
    });
});

function enableHoverSounds() {
    // 対象クラス（ホバーで暗くなる要素たち）
    const hoverClasses = [
        ".category-toggle",
        ".character-link",

    ];
//非表示の要素
//         ".main-tab-button",
//        ".sub-tab-button",
//        ".image-sub-tab-button"
    // 効果音ファイル（任意のwav/mp3に変更可）
    const hoverSound = new Audio("audio/hover.mp3"); 
    hoverSound.volume = 1; // 音量調整（0〜1）

    // 同時再生防止フラグ
    let isPlaying = false;

    // 各対象にイベントを付与
    hoverClasses.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener("mouseenter", () => {
                if (!isPlaying) {
                    isPlaying = true;
                    hoverSound.currentTime = 0; // 毎回先頭から再生
                    hoverSound.play().catch(() => {}); // ブラウザブロック回避
                    // 少し間を置いて再び再生できるようにする
                    setTimeout(() => (isPlaying = false), 10);
                }
            });
        });
    });
}
// ===== 左クリックで音を鳴らす =====

// 音声ファイル（パスは適宜変更）
const CLICK_SOUND_PATH = 'audio/click.mp3';

// 再生用オブジェクト
const clickAudio = new Audio(CLICK_SOUND_PATH);
clickAudio.volume = 0.5;

// 左クリック押下時に音を鳴らす
document.addEventListener('mousedown', (event) => {
    // 左クリックのみ（0 が左ボタン）
    if (event.button !== 0) return;

    try {
        // 再生位置をリセットして重ね再生可能に
        clickAudio.currentTime = 0;
        clickAudio.play().catch(() => {});
    } catch (err) {
        console.error('クリック音の再生に失敗:', err);
    }
});


