document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------
    // I. 定数・初期設定
    // ----------------------------------------
    const characterContainer = document.getElementById('character-container');
    const characterTreeContainer = document.getElementById('character-tree');
    const startOverlay = document.getElementById('start-overlay');
    const startButton = document.getElementById('start-button');

    let currentCharacterData = null; // 現在表示中のキャラクターデータ

    // 表示用日本語名マッピング
    // JSONキー名に対応する日本語名を設定
    const KEY_TO_JAPANESE_MAP = {
        // basic_info
        "name": "名前",
        "gender": "性別",
        "age": "年齢",
        "birthday": "誕生日",
        "occupation": "職業",
        "hometown": "出身地",
        "family": "家族構成",
        "personality": "性格",
        "motto": "モットー",
        "likes": "好きなもの",
        "dislikes": "嫌いなもの",
        "strengths": "長所",
        "weaknesses": "短所",
        "hobbies": "趣味",
        "special_skills": "特技",
        "dreams_goals": "夢・目標",
        "secrets": "秘密",
        // physical_characteristics
        "height": "身長",
        "weight": "体重",
        "body_type": "体型",
        "dexterity": "利き手",
        "hair_color": "髪色",
        "eye_color": "瞳色",
        "skin_color": "肌色",
        "distinctive_features": "特徴",
        // body_habits
        "posture": "姿勢",
        "gait": "歩き方",
        "gestures": "仕草",
        "facial_expressions": "表情",
        "speaking_habits": "話し方",
        "sleep_habits": "睡眠習慣",
        "eating_habits": "食習慣",
        "toilet_habits": "排泄習慣",
        // sexual_habits_preferences
        "sexual_orientation": "性的指向",
        "relationship_status": "関係性",
        "ideal_partner": "理想の相手",
        "sexual_experience": "性経験",
        "sexual_preferences": "性的嗜好",
        "views_on_love": "恋愛観",
        // daily_life
        "morning": "朝",
        "daytime": "昼間",
        "night": "夜",
        "holidays": "休日",
        "stress_relief": "ストレス解消",
        "favorite_place": "お気に入りの場所",
        // environment
        "home": "家",
        "school": "学校",
        "work_place": "職場",
        "other": "その他",
        // その他の質問（questionsタブで使われる可能性のあるキー）
        "Q": "質問",
        "A": "回答",
        "title": "タイトル",
        "url": "URL"
        // ※ dynamicなキーはここで定義しきれないため、その場合は元のキーをそのまま表示する
    };

    // メインタブの定義（固定タブ）
    const FIXED_MAIN_TABS = [
        {
            id: 'basic',
            title: '基礎',
            sections: [
                { id: 'basic-info', title: '基本情報', dataPath: 'basic_info' },
                { id: 'basic-physical-characteristics', title: '身体的特徴', dataPath: 'physical_characteristics' },
                { id: 'basic-body-habits', title: '体癖', dataPath: 'body_habits' },
                { id: 'basic-sexual-preferences', title: '関係・恋愛', dataPath: 'sexual_habits_preferences' },
                { id: 'basic-daily-life', title: '日常', dataPath: 'daily_life' },
                { id: 'basic-images', title: '画像', dataPath: 'character_images_by_era.basic', type: 'image_section' }
            ]
        },
        {
            id: 'additional',
            title: '追加情報',
            sections: [
                { id: 'other-timeline-events', title: 'その他の出来事', dataPath: 'timeline.other_timeline.events' },
                { id: 'future-outlook', title: '将来の展望', dataPath: 'timeline.other_timeline.future_outlook' }
            ]
        },
        { id: 'lines', title: 'セリフ', dataPath: 'tabs.character_lines' },
        { id: 'videos', title: '動画', dataPath: 'tabs.character_videos' },
        { id: 'questions', title: 'その他質問', dataPath: 'tabs.other_questions' }
    ];

    // 動的に生成される eras 用のセクションテンプレート
    const ERA_SECTION_TEMPLATE = [
        { idSuffix: 'overview', title: '概要', dataKey: 'overview' },
        { idSuffix: 'physical-characteristics', title: '身体的特徴', dataKey: 'physical_characteristics' },
        { idSuffix: 'body-habits', title: '体癖', dataKey: 'body_habits' },
        { idSuffix: 'relationships-love', title: '関係・恋愛', dataKey: 'relationships_love' },
        { idSuffix: 'daily-life', title: '日常', dataKey: 'daily_life' },
        { idSuffix: 'environment', title: '環境', dataKey: 'environment' },
        { idSuffix: 'images', title: '画像', dataKey: 'images', type: 'image_section' }
    ];

    // サウンド設定
    const HOVER_SOUND_PATH = 'audio/hover.mp3';
    const CLICK_SOUND_PATH = 'audio/click.mp3';
    const clickAudio = new Audio(CLICK_SOUND_PATH);
    clickAudio.volume = 0.5;

    // ----------------------------------------
    // II. 初期化処理
    // ----------------------------------------

    /**
     * アプリケーションの初期設定と起動を行う
     */
    async function initialize() {
        // スタート画面のイベントリスナーを設定
        setupStartOverlay();

        try {
            const indexResponse = await fetch('data/characters.json');
            if (!indexResponse.ok) throw new Error(`HTTP error! status: ${indexResponse.status}`);
            const characterIndex = await indexResponse.json();

            // キャラクターツリーUIを生成
            createCharacterTree(characterIndex.categories);

            // URLからキャラクターIDを読み込み、該当キャラクターを表示
            const params = new URLSearchParams(window.location.search);
            const charId = params.get('charId');
            if (charId) {
                const charInfo = findCharacterInfoById(characterIndex.categories, charId);
                if (charInfo) {
                    await loadAndDisplayCharacter(charInfo.filePath, charId);
                    activateCharacterInTree(charId); // ツリー内での選択状態と親カテゴリの展開
                } else {
                    characterContainer.innerHTML = '<p>指定されたキャラクターが見つかりません。</p>';
                }
            } else {
                characterContainer.innerHTML = '<p>左側のリストからキャラクターを選択してください。</p>';
            }
        } catch (error) {
            console.error('アプリケーションの初期化に失敗しました:', error);
            characterContainer.innerHTML = '<p>データの読み込みに失敗しました。</p>';
        }

        // 全体のクリック音を設定
        setupClickSound();
    }

    // ----------------------------------------
    // III. UI設定・イベントハンドラ
    // ----------------------------------------

    /**
     * スタートオーバーレイのクリックイベントを設定する
     */
    function setupStartOverlay() {
        if (!startButton || !startOverlay) return;

        startButton.addEventListener('click', () => {
            // フェードアウト
            startOverlay.classList.add('fade-out');

            // 完全に消去（アニメーション後に削除）
            setTimeout(() => {
                startOverlay.remove();
                enableHoverSounds(); // フェードアウト完了後にホバー音システム起動
            }, 1000);
        });
    }

    /**
     * ホバー音システムを有効化する
     */
    function enableHoverSounds() {
        // ホバー音を鳴らす対象クラス
        const hoverClasses = [
            '.category-toggle',
            '.character-link',
            '.main-tab-button',
            '.sub-tab-button',
            '.image-sub-tab-button'
        ];

        const hoverSound = new Audio(HOVER_SOUND_PATH);
        hoverSound.volume = 1;

        let isPlaying = false; // 同時再生防止フラグ

        // 各対象にイベントを付与
        hoverClasses.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.addEventListener('mouseenter', () => {
                    if (!isPlaying) {
                        isPlaying = true;
                        hoverSound.currentTime = 0;
                        hoverSound.play().catch(() => {});
                        setTimeout(() => (isPlaying = false), 10); // わずかな間隔でリセット
                    }
                });
            });
        });
    }

    /**
     * 全体の左クリック時に音を鳴らす設定
     */
    function setupClickSound() {
        document.addEventListener('mousedown', (event) => {
            if (event.button !== 0) return; // 左クリックのみ

            try {
                clickAudio.currentTime = 0; // 再生位置をリセット
                clickAudio.play().catch(() => {});
            } catch (err) {
                console.error('クリック音の再生に失敗:', err);
            }
        });
    }

    /**
     * キャラクターツリーUIを生成し、イベントリスナーを設定する
     * @param {object} categories - キャラクターカテゴリの階層データ
     */
    function createCharacterTree(categories) {
        characterTreeContainer.innerHTML = '';
        const rootUl = document.createElement('ul');
        rootUl.classList.add('character-tree-root');
        characterTreeContainer.appendChild(rootUl);

        function renderCategory(node, parentUl) {
            for (const key in node) {
                if (!node.hasOwnProperty(key)) continue;
                const item = node[key];

                if (item.filePath) { // キャラクターエントリ
                    const li = document.createElement('li');
                    const charLink = document.createElement('a');
                    charLink.href = `#${item.id}`;
                    charLink.textContent = item.mainName;
                    charLink.classList.add('character-link');
                    charLink.dataset.charId = item.id;
                    charLink.dataset.filePath = item.filePath;

                    charLink.addEventListener('click', async (event) => {
                        event.preventDefault();
                        updateCharacterSelection(item.id, item.filePath);
                    });
                    li.appendChild(charLink);
                    parentUl.appendChild(li);
                } else if (typeof item === 'object') { // カテゴリ
                    const categoryLi = document.createElement('li');
                    const categoryToggle = document.createElement('button');
                    categoryToggle.classList.add('category-toggle');
                    categoryToggle.textContent = key;

                    const icon = document.createElement('span');
                    icon.classList.add('toggle-icon');
                    icon.textContent = '▶';
                    categoryToggle.prepend(icon);

                    const subUl = document.createElement('ul');
                    subUl.classList.add('category-list');
                    subUl.style.display = 'none';

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
        renderCategory(categories, rootUl);
    }

    /**
     * キャラクターリンクがクリックされた際の処理（URL更新とデータ表示）
     * @param {string} charId - キャラクターID
     * @param {string} filePath - キャラクターデータファイルパス
     */
    async function updateCharacterSelection(charId, filePath) {
        // アクティブなリンクをリセット
        characterTreeContainer.querySelectorAll('.character-link').forEach(link => {
            link.classList.remove('active');
        });
        const charLink = characterTreeContainer.querySelector(`[data-char-id="${charId}"]`);
        if (charLink) charLink.classList.add('active');

        // URLにキャラクターIDを追加
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('charId', charId);
        window.history.pushState({ charId: charId }, '', newUrl.toString());

        await loadAndDisplayCharacter(filePath);
    }

    /**
     * URLで指定されたキャラクターをツリー内でアクティブにし、親カテゴリを展開する
     * @param {string} charId - キャラクターID
     */
    function activateCharacterInTree(charId) {
        const charLink = characterTreeContainer.querySelector(`[data-char-id="${charId}"]`);
        if (charLink) {
            charLink.classList.add('active');
            let parentUl = charLink.closest('ul');
            // 親カテゴリを辿って展開
            while (parentUl && parentUl.classList.contains('category-list')) {
                const categoryLi = parentUl.parentElement;
                const toggleButton = categoryLi ? categoryLi.querySelector('.category-toggle') : null;
                if (toggleButton && !toggleButton.classList.contains('open')) {
                    toggleButton.classList.add('open');
                    toggleButton.querySelector('.toggle-icon').textContent = '▼';
                    parentUl.style.display = 'block';
                }
                parentUl = toggleButton ? toggleButton.closest('ul.category-list') : null; // 次の親のulへ
            }
        }
    }

    // ----------------------------------------
    // IV. データ操作
    // ----------------------------------------

    /**
     * カテゴリデータ内から特定のIDを持つキャラクター情報を検索する
     * @param {object} categories - キャラクターカテゴリデータ
     * @param {string} idToFind - 検索するキャラクターID
     * @returns {object|null} - 見つかったキャラクター情報、またはnull
     */
    function findCharacterInfoById(categories, idToFind) {
        let foundChar = null;

        function search(node) {
            for (const key in node) {
                if (!node.hasOwnProperty(key)) continue;
                const item = node[key];
                if (item.id === idToFind) {
                    foundChar = item;
                    return true;
                }
                // filePathがないオブジェクトはカテゴリと見なして再帰検索
                if (typeof item === 'object' && !item.filePath) {
                    if (search(item)) return true;
                }
            }
            return false;
        }
        search(categories);
        return foundChar;
    }

    /**
     * キャラクターデータを読み込み、詳細UIを表示する
     * @param {string} filePath - キャラクターデータファイルパス
     */
    async function loadAndDisplayCharacter(filePath) {
        characterContainer.innerHTML = '<p>データを読み込み中...</p>';
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            currentCharacterData = await response.json();
            renderCharacterDetails(currentCharacterData);
        } catch (error) {
            console.error(`キャラクターデータ ${filePath} の読み込みに失敗しました:`, error);
            characterContainer.innerHTML = '<p>キャラクターデータの読み込みに失敗しました。</p>';
            currentCharacterData = null;
        }
    }

    // ----------------------------------------
    // V. UIレンダリング
    // ----------------------------------------

    /**
     * キャラクター詳細画面全体をレンダリングする
     * @param {object} characterData - 表示するキャラクターデータ
     */
    function renderCharacterDetails(characterData) {
        characterContainer.innerHTML = '';

        // キャラクター名の表示
        const characterNameElement = document.createElement('h2');
        characterNameElement.classList.add('character-name-title');
        characterNameElement.textContent = characterData.character_name || 'キャラクター名';
        characterContainer.appendChild(characterNameElement);

        // メインタブのコンテナを生成
        const mainTabsContainer = document.createElement('div');
        mainTabsContainer.classList.add('main-tabs-container');
        characterContainer.appendChild(mainTabsContainer);

        const mainTabList = document.createElement('ul');
        mainTabList.classList.add('main-tab-list');
        mainTabsContainer.appendChild(mainTabList);

        const mainTabContentContainer = document.createElement('div');
        mainTabContentContainer.classList.add('main-tab-content-container');
        mainTabsContainer.appendChild(mainTabContentContainer);

        // 1. 固定タブを処理
        FIXED_MAIN_TABS.forEach((tab) => {
            if (checkTabDataExistence(characterData, tab)) {
                createMainTab(tab, characterData, mainTabList, mainTabContentContainer);
            }
        });

        // 2. 動的な 'eras' タブを処理
        if (characterData.eras && Array.isArray(characterData.eras)) {
            characterData.eras.forEach((era, index) => {
                if (era && Object.keys(era).length > 0) {
                    const eraTab = buildEraTabDefinition(era, index);
                    // eraタブのデータソースは era オブジェクト自体
                    createMainTab(eraTab, era, mainTabList, mainTabContentContainer);
                }
            });
        }

        // 3. タブのアクティブ化とイベント設定
        activateInitialTabs(mainTabList, mainTabContentContainer);
        setupMainTabListeners(mainTabList, mainTabContentContainer);
    }

    /**
     * タブデータが存在するかどうかをチェックする
     * @param {object} data - チェック対象の親データオブジェクト (characterData or era)
     * @param {object} tabDefinition - タブ定義オブジェクト
     * @returns {boolean} - データが存在するかどうか
     */
    function checkTabDataExistence(data, tabDefinition) {
        if (tabDefinition.id === 'basic') return true; // 'basic'タブは常に表示

        if (!tabDefinition.dataPath) return false;

        // dataPathを辿る
        const keys = tabDefinition.dataPath.split('.');
        let currentPointer = data;

        for (const key of keys) {
            if (currentPointer && typeof currentPointer === 'object' && key in currentPointer) {
                currentPointer = currentPointer[key];
            } else {
                return false; // パスが見つからない
            }
        }

        // 終端の値の存在チェック
        if (currentPointer === null || currentPointer === undefined) return false;
        if (Array.isArray(currentPointer)) return currentPointer.length > 0;
        if (typeof currentPointer === 'object') return Object.keys(currentPointer).length > 0;
        if (typeof currentPointer === 'string') return currentPointer.trim() !== '';

        return true; // その他のプリミティブ型は存在する
    }

    /**
     * era (章) のタブ定義オブジェクトを構築する
     * @param {object} era - eraデータオブジェクト
     * @param {number} index - eraのインデックス
     * @returns {object} - 構築されたタブ定義
     */
    function buildEraTabDefinition(era, index) {
        return {
            id: era.id || `era-${index}`,
            title: era.title || `無題の章 ${index + 1}`,
            sections: ERA_SECTION_TEMPLATE.map(template => ({
                id: `${era.id || `era-${index}`}-${template.idSuffix}`,
                title: template.title,
                dataPath: template.dataKey, // eraデータ内のキー
                type: template.type
            }))
        };
    }

    /**
     * メインタブを生成し、コンテンツを構築する
     * @param {object} tabDefinition - タブ定義
     * @param {object} tabDataSource - タブコンテンツのデータソース (characterData または era)
     * @param {HTMLElement} mainTabListElement - タブボタンリストのDOM要素
     * @param {HTMLElement} mainTabContentContainerElement - タブコンテンツコンテナのDOM要素
     */
    function createMainTab(tabDefinition, tabDataSource, mainTabListElement, mainTabContentContainerElement) {
        // メインタブボタン
        const tabButtonLi = document.createElement('li');
        const tabButton = document.createElement('button');
        tabButton.textContent = tabDefinition.title;
        tabButton.classList.add('main-tab-button');
        tabButton.dataset.tabId = tabDefinition.id;
        tabButtonLi.appendChild(tabButton);
        mainTabListElement.appendChild(tabButtonLi);

        // メインタブコンテンツ
        const tabContentDiv = document.createElement('div');
        tabContentDiv.id = `main-tab-content-${tabDefinition.id}`;
        tabContentDiv.classList.add('main-tab-content');

        if (tabDefinition.sections) {
            // サブタブセクションを持つタブ
            renderSectionsWithSubTabs(tabDefinition, tabDataSource, tabContentDiv);
        } else {
            // セクションを持たない単独のタブ (例: セリフ、動画)
            renderStandaloneTabContent(tabDefinition, tabContentDiv);
        }

        mainTabContentContainerElement.appendChild(tabContentDiv);
    }

    /**
     * セクション（サブタブ）を持つメインタブのコンテンツをレンダリングする
     */
    function renderSectionsWithSubTabs(tabDefinition, tabDataSource, tabContentDiv) {
        const subTabsContainer = document.createElement('div');
        subTabsContainer.classList.add('sub-tabs-container');
        const subTabList = document.createElement('ul');
        subTabList.classList.add('sub-tab-list');
        const subTabContentContainer = document.createElement('div');
        subTabContentContainer.classList.add('sub-tab-content-container');

        let firstActiveSubTabButton = null;
        let firstActiveSectionContent = null;

        tabDefinition.sections.forEach((section) => {
            // データ取得ロジック
            let sectionData = getSectionData(tabDefinition.id, section.dataPath, tabDataSource);

            // データが存在するかチェック
            if (!checkDataExistence(sectionData)) return;

            // サブタブボタン
            const subTabButtonLi = document.createElement('li');
            const subTabButton = document.createElement('button');
            subTabButton.textContent = section.title;
            subTabButton.classList.add('sub-tab-button');
            subTabButton.dataset.sectionId = section.id;
            subTabButtonLi.appendChild(subTabButton);
            subTabList.appendChild(subTabButtonLi);

            // セクションコンテンツ
            const sectionContentDiv = document.createElement('div');
            sectionContentDiv.id = `section-content-${section.id}`;
            sectionContentDiv.classList.add('section-content');

            // コンテンツのレンダリング
            if (section.type === 'image_section') {
                renderImageSection(section, sectionData, sectionContentDiv);
            } else if (sectionData) {
                // *** 変更点: formatCharacterDataにsectionIdを渡す ***
                sectionContentDiv.innerHTML = formatCharacterData(sectionData, section.id);
            } else {
                sectionContentDiv.innerHTML = '<p>データがありません。</p>';
            }

            subTabContentContainer.appendChild(sectionContentDiv);

            if (!firstActiveSubTabButton) {
                firstActiveSubTabButton = subTabButton;
                firstActiveSectionContent = sectionContentDiv;
            }
        });

        if (subTabList.children.length > 0) {
            subTabsContainer.appendChild(subTabList);
            subTabsContainer.appendChild(subTabContentContainer);
            tabContentDiv.appendChild(subTabsContainer);

            // サブタブの初期アクティブ化
            if (firstActiveSubTabButton) {
                firstActiveSubTabButton.classList.add('active');
                firstActiveSectionContent.classList.add('active');
            }

            // サブタブイベントリスナー
            setupSubTabListeners(subTabList, subTabContentContainer);
        } else {
            tabContentDiv.innerHTML = '<p>このタブには表示できるデータがありません。</p>';
        }
    }

    /**
     * セクションデータ取得のロジック
     */
    function getSectionData(tabId, dataPath, tabDataSource) {
        let sectionData = null;
        if (tabId === 'basic' && dataPath) {
            // 'basic'タブのサブセクションは常にcurrentCharacterDataから
            sectionData = getDataByPath(currentCharacterData, dataPath);
        } else if (dataPath) {
            // 'era' や 'additional' など、その他のタブはtabDataSourceから (dataPathは単一のキー)
            sectionData = tabDataSource[dataPath];
        }
        return sectionData;
    }

    /**
     * dataPath (ドット区切り) を用いてオブジェクトからデータを取得する
     */
    function getDataByPath(data, dataPath) {
        const keys = dataPath.split('.');
        let temp = data;
        for (const key of keys) {
            if (temp && typeof temp === 'object' && key in temp) {
                temp = temp[key];
            } else {
                return null;
            }
        }
        return temp;
    }

    /**
     * 終端の値の存在チェック
     */
    function checkDataExistence(data) {
        if (data === null || data === undefined) return false;
        if (Array.isArray(data)) return data.length > 0;
        if (typeof data === 'object') return Object.keys(data).length > 0;
        if (typeof data === 'string') return data.trim() !== '';
        return true;
    }

    /**
     * 画像セクションのコンテンツをレンダリングする
     */
    function renderImageSection(section, sectionData, sectionContentDiv) {
        const imageSubTabsHtml = `
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
        sectionContentDiv.innerHTML = imageSubTabsHtml;

        const displayArea = sectionContentDiv.querySelector(`#image-display-area-${section.id}`);

        // 初期表示 (setTimeoutでDOMが描画されるのを待つ)
        setTimeout(() => {
            displayImageContent(sectionData, 'standing_normal', displayArea);
        }, 0);

        // 画像サブタブボタンのイベントリスナーを設定
        sectionContentDiv.querySelectorAll('.image-sub-tab-button').forEach(imgSubButton => {
            imgSubButton.addEventListener('click', () => {
                sectionContentDiv.querySelectorAll('.image-sub-tab-button').forEach(btn => btn.classList.remove('active'));
                imgSubButton.classList.add('active');
                displayImageContent(sectionData, imgSubButton.dataset.imageType, displayArea);
            });
        });
    }

    /**
     * セクションを持たない単独のタブコンテンツをレンダリングする
     */
    function renderStandaloneTabContent(tabDefinition, tabContentDiv) {
        let data = getDataByPath(currentCharacterData, tabDefinition.dataPath);

        if (!data || !checkDataExistence(data)) {
            tabContentDiv.innerHTML = '<p>データがありません。</p>';
            return;
        }

        if (tabDefinition.id === 'lines' && Array.isArray(data)) {
            tabContentDiv.innerHTML = '<ul>' + data.map(line => `<li>${line}</li>`).join('') + '</ul>';
        } else if (tabDefinition.id === 'videos' && Array.isArray(data)) {
            data.forEach(video => {
                // keyを日本語化
                const titleKey = formatKeyForDisplay('title');
                const urlKey = formatKeyForDisplay('url');

                tabContentDiv.innerHTML += `
                    <h4>${video.title || '動画'}</h4>
                    <video controls style="max-width: 100%; display: block; margin-bottom: 15px;">
                        <source src="${video.url}" type="video/mp4">
                        お使いのブラウザは動画タグをサポートしていません。
                    </video>
                    <p class="video-info-detail">
                        <strong>${titleKey}:</strong> ${video.title || 'N/A'}<br>
                        <strong>${urlKey}:</strong> <a href="${video.url}" target="_blank">${video.url}</a>
                    </p>
                `;
            });
        } else if (tabDefinition.id === 'questions' && Array.isArray(data)) {
            // keyを日本語化
            const qKey = formatKeyForDisplay('Q');
            const aKey = formatKeyForDisplay('A');

            tabContentDiv.innerHTML = '<ul>' + data.map(item => `<li><strong>${qKey}:</strong> ${item.Q}<br><strong>${aKey}:</strong> ${item.A}</li>`).join('') + '</ul>';
        } else {
            // その他の単独タブ
            tabContentDiv.innerHTML = formatCharacterData(data, tabDefinition.id);
        }
    }

    /**
     * 最初のタブとサブタブをアクティブにする
     */
    function activateInitialTabs(mainTabList, mainTabContentContainer) {
        const allMainTabButtons = mainTabList.querySelectorAll('.main-tab-button');
        const allMainTabContents = mainTabContentContainer.querySelectorAll('.main-tab-content');

        if (allMainTabButtons.length === 0) return;

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

    /**
     * メインタブのイベントリスナーを設定する
     */
    function setupMainTabListeners(mainTabList, mainTabContentContainer) {
        mainTabList.querySelectorAll('.main-tab-button').forEach(button => {
            button.addEventListener('click', () => {
                // 全てのタブを非アクティブ化
                mainTabList.querySelectorAll('.main-tab-button').forEach(btn => btn.classList.remove('active'));
                mainTabContentContainer.querySelectorAll('.main-tab-content').forEach(content => content.classList.remove('active'));

                // 選択されたタブをアクティブ化
                button.classList.add('active');
                const activeMainTabContent = document.getElementById(`main-tab-content-${button.dataset.tabId}`);
                activeMainTabContent.classList.add('active');

                // アクティブになったメインタブ内のサブタブをリセットし、最初のものをアクティブにする
                const subTabButtons = activeMainTabContent.querySelectorAll('.sub-tab-button');
                const subTabContents = activeMainTabContent.querySelectorAll('.section-content');

                subTabButtons.forEach(btn => btn.classList.remove('active'));
                subTabContents.forEach(content => content.classList.remove('active'));

                if (subTabButtons.length > 0) {
                    subTabButtons[0].classList.add('active');
                    subTabContents[0].classList.add('active');
                }
            });
        });
    }

    /**
     * サブタブのイベントリスナーを設定する
     */
    function setupSubTabListeners(subTabList, subTabContentContainer) {
        subTabList.querySelectorAll('.sub-tab-button').forEach(subButton => {
            subButton.addEventListener('click', () => {
                subTabList.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                subTabContentContainer.querySelectorAll('.section-content').forEach(content => content.classList.remove('active'));

                subButton.classList.add('active');
                document.getElementById(`section-content-${subButton.dataset.sectionId}`).classList.add('active');
            });
        });
    }


    // ----------------------------------------
    // VI. データ整形・ユーティリティ
    // ----------------------------------------

    /**
     * JSONデータをHTMLのpタグやul/liタグに整形する
     * @param {object|array|string} data - 整形するデータ
     * @param {string} sectionId - 現在のセクションID
     * @returns {string} - HTML文字列
     */
    function formatCharacterData(data, sectionId) {
        let html = '';

        if (!checkDataExistence(data)) {
            return '<p>データがありません。</p>';
        }

        // キーの表示順序（前回のものを流用）
        const ORDERED_KEYS = {
            'basic-info': ["name", "gender", "age", "birthday", "occupation", "hometown", "family", "personality", "motto", "likes", "dislikes", "strengths", "weaknesses", "hobbies", "special_skills", "dreams_goals", "secrets"],
            'basic-physical-characteristics': ["height", "weight", "body_type", "dexterity", "hair_color", "eye_color", "skin_color", "distinctive_features"],
            'basic-body-habits': ["posture", "gait", "gestures", "facial_expressions", "speaking_habits", "sleep_habits", "eating_habits", "toilet_habits"],
            'basic-sexual-preferences': ["sexual_orientation", "relationship_status", "ideal_partner", "sexual_experience", "sexual_preferences", "views_on_love"],
            'basic-daily-life': ["morning", "daytime", "night", "holidays", "stress_relief", "favorite_place"],
            'environment': ["home", "school", "work_place", "other"],
        };

        if (typeof data === 'object' && !Array.isArray(data)) {
            // オブジェクトデータの処理 (キー: 値形式)
            const keysToDisplay = ORDERED_KEYS[sectionId] || Object.keys(data);
            let hasContent = false;

            // overviewセクションは単なるテキストの可能性を考慮
            if (sectionId.includes('overview') && typeof data === 'string') {
                return `<p>${data}</p>`;
            }

            keysToDisplay.forEach(key => {
                if (data.hasOwnProperty(key)) {
                    const value = data[key];
                    if (checkDataExistence(value)) {
                        // *** 変更点: 日本語表示キーを使用 ***
                        const displayKey = formatKeyForDisplay(key);
                        html += `<p><strong>${displayKey}:</strong> ${value}</p>`;
                        hasContent = true;
                    }
                }
            });

            if (!hasContent) {
                html += '<p>データがありません。</p>';
            }

        } else if (Array.isArray(data)) {
            // 配列データの処理 (リスト形式) - 主にタイムラインやセリフなどで使用
            html += '<ul>';
            data.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    let itemHtml = '<li>';
                    // オブジェクト内のすべてのキーを日本語表示で列挙
                    for (const key in item) {
                        if (item.hasOwnProperty(key) && checkDataExistence(item[key])) {
                            // *** 変更点: 日本語表示キーを使用 ***
                            const displayKey = formatKeyForDisplay(key);
                            itemHtml += `<strong>${displayKey}:</strong> ${item[key]} `;
                        }
                    }
                    itemHtml += '</li>';
                    if (itemHtml !== '<li></li>') html += itemHtml;
                } else if (typeof item === 'string' && item.trim() !== '') {
                    html += `<li>${item}</li>`;
                }
            });
            html += '</ul>';
            if (html === '<ul></ul>') html = '<p>データがありません。</p>';
        } else if (typeof data === 'string' && data.trim() !== '') {
            // 単一の文字列データ
            html += `<p>${data}</p>`;
        }

        return html;
    }

    /**
     * スネークケースのキー名を、日本語マッピングまたは整形された文字列に変換する
     * @param {string} key - JSONデータ内のキー
     * @returns {string} - 表示用文字列（日本語を優先）
     */
    function formatKeyForDisplay(key) {
        // 1. 日本語マッピングにキーがあればそれを返す
        if (KEY_TO_JAPANESE_MAP[key]) {
            return KEY_TO_JAPANESE_MAP[key];
        }

        // 2. マッピングにない場合は、前回同様スネークケースを整形して返す（保険）
        return key.replace(/_/g, ' ')
                  .replace(/\b\w/g, char => char.toUpperCase());
    }

    /**
     * 指定された画像タイプのコンテンツをDOM要素に表示する
     * @param {object} imageData - 画像データオブジェクト (e.g., {standing_normal: [...], ...})
     * @param {string} imageType - 表示する画像のタイプ (e.g., 'standing_normal')
     * @param {HTMLElement} displayArea - 画像を表示するコンテナDOM要素
     */
    function displayImageContent(imageData, imageType, displayArea) {
        displayArea.innerHTML = '';

        const images = imageData?.[imageType];
        if (!images || !Array.isArray(images) || images.length === 0) {
            const typeName = imageType.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
            displayArea.innerHTML = `<p>表示できる ${typeName} の画像はありません。</p>`;
            return;
        }

        const galleryDiv = document.createElement('div');
        galleryDiv.classList.add('image-gallery');

        images.forEach(imagePath => {
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

    // アプリケーション起動
    initialize();
});
