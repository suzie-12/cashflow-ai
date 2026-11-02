(() => {
  'use strict';

  const DEFAULT_LANGUAGE = 'en';
  const LANGUAGE_STORAGE_KEY = 'sme-workspace-language';
  const names = { en: 'English', zh: '简体中文' };
  const dictionaries = window.CASHFLOW_I18N_DICTIONARIES || { en: {}, zh: {} };
  const supported = new Set(['en', 'zh']);
  const normalize = value => String(value ?? '').replace(/\s+/g, ' ').trim();
  const hanPattern = /[\u3400-\u9fff]/;
  const wordPattern = /[A-Za-z0-9]/;

  const exact = { en: new Map(), zh: new Map() };
  const tries = { en: Object.create(null), zh: Object.create(null) };

  for (const locale of ['en', 'zh']) {
    const dictionary = dictionaries[locale] || {};
    for (const [alias, translated] of Object.entries(dictionary)) {
      const key = normalize(alias).toLocaleLowerCase();
      if (!key || !translated) continue;
      if (!exact[locale].has(key)) exact[locale].set(key, translated);
      if (!hanPattern.test(key) && key.length < 2) continue;
      let node = tries[locale];
      for (const char of key) node = node[char] || (node[char] = Object.create(null));
      if (!node.$) node.$ = translated;
    }
  }

  function boundaryMatches(text, start, end, key) {
    if (wordPattern.test(key[0]) && start > 0 && wordPattern.test(text[start - 1])) return false;
    if (wordPattern.test(key[key.length - 1]) && end < text.length && wordPattern.test(text[end])) return false;
    return true;
  }

  function localizeText(value, locale) {
    const source = String(value ?? '');
    const cleaned = normalize(source);
    const exactMatch = exact[locale].get(cleaned.toLocaleLowerCase());
    if (exactMatch) return exactMatch;

    const trie = tries[locale];
    let result = '';
    let index = 0;
    const normalizedSource = locale === 'en'
      ? source
          .replace(/按\s*(\d+)\s*笔输入记录计算，最低现金\s*([^。]+)。核实收付款日期；未输入的数据不作估算。/g, 'Calculated from $1 entered records; minimum cash $2. Verify receipt and payment dates. Missing data is not estimated.')
          .replace(/第\s*(\d+)\s*条记录的日期、类型或金额无效/g, 'Invalid date, type or amount on record $1')
          .replace(/第\s*(\d+)\s*天前/g, 'before day $1')
          .replace(/(?:预计)?第\s*(\d+)\s*天(?:预计)?跌破安全线/g, 'Expected to breach the safety threshold on day $1')
          .replace(/第\s*(\d+)\s*天触线/g, 'Threshold breach on day $1')
          .replace(/第\s*(\d+)\s*天短缺/g, 'Shortfall on day $1')
          .replace(/第\s*(\d+)\s*天/g, 'day $1')
          .replace(/，/g, ', ')
          .replace(/。/g, '.')
          .replace(/；/g, '; ')
          .replace(/：/g, ': ')
      : source
          .replace(/Expected to breach the safety threshold on day\s+(\d+),\s*minimum cash\s+([¥$][\d,]+),\s*shortfall\s+([¥$][\d,]+)\.?/gi, '预计第$1天将跌破安全线，最低现金$2，预计缺口$3。')
          .replace(/Calculated from\s+(\d+)\s+entered records;\s*minimum cash\s+([¥$][\d,]+)\.\s*Verify receipt and payment dates\.\s*Missing data is not estimated\./gi, '根据已录入的$1条记录计算，最低现金$2。请核实收付款日期；未输入的数据不作估算。');
    const lower = normalizedSource.toLocaleLowerCase();
    while (index < normalizedSource.length) {
      let node = trie;
      let cursor = index;
      let match = null;
      let matchEnd = index;
      while (cursor < normalizedSource.length && node[lower[cursor]]) {
        node = node[lower[cursor++]];
        if (node.$ && boundaryMatches(normalizedSource, index, cursor, lower.slice(index, cursor))) {
          match = node.$;
          matchEnd = cursor;
        }
      }
      if (match !== null) {
        result += match;
        index = matchEnd;
      } else {
        result += normalizedSource[index++];
      }
    }
    if (locale === 'en') {
      result = result
        .replace(/Expected to breach the Safety threshold on Day (\d+)/g, 'Expected to breach the safety threshold on day $1')
        .replace(/Minimum cash/g, 'minimum cash')
        .replace(/Gap (¥|\$)/g, 'shortfall $1');
    }
    return result;
  }

  window.t = (message, params = {}) => {
    let result = localizeText(message, window.currentWorkspaceLanguage || DEFAULT_LANGUAGE);
    for (const [key, value] of Object.entries(params)) {
      result = result.replaceAll(`{${key}}`, String(value));
    }
    return result;
  };

  const textState = new WeakMap();
  const attributeState = new WeakMap();
  const skipSelector = 'script,style,[contenteditable="true"],[data-i18n-ignore]';
  function isSkipped(element) {
    return !!(element && element.closest && element.closest(skipSelector));
  }

  function translateTextNode(node, locale) {
    if (!node || !node.parentElement || isSkipped(node.parentElement)) return;
    if (node.parentElement.closest('textarea')) return;
    const current = node.nodeValue;
    if (!current || !current.trim()) return;
    let state = textState.get(node);
    if (!state) {
      state = { source: current, rendered: current };
      textState.set(node, state);
    } else if (current !== state.rendered) {
      state.source = current;
    }
    const translated = localizeText(state.source, locale);
    state.rendered = translated;
    if (translated !== current) node.nodeValue = translated;
  }

  function translateAttributes(element, locale) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE || isSkipped(element)) return;
    let state = attributeState.get(element);
    if (!state) {
      state = new Map();
      attributeState.set(element, state);
    }
    for (const attribute of ['aria-label', 'title', 'alt', 'placeholder']) {
      if (!element.hasAttribute(attribute)) continue;
      const current = element.getAttribute(attribute);
      let saved = state.get(attribute);
      if (!saved) {
        saved = { source: current, rendered: current };
        state.set(attribute, saved);
      } else if (current !== saved.rendered) {
        saved.source = current;
      }
      const translated = localizeText(saved.source, locale);
      saved.rendered = translated;
      if (translated !== current) element.setAttribute(attribute, translated);
    }
    if (element.matches('input[type="button"],input[type="submit"],input[type="reset"]')) {
      const current = element.value;
      let saved = state.get('value');
      if (!saved) {
        saved = { source: current, rendered: current };
        state.set('value', saved);
      } else if (current !== saved.rendered) {
        saved.source = current;
      }
      const translated = localizeText(saved.source, locale);
      saved.rendered = translated;
      element.value = translated;
    }
  }

  function translateSubtree(root, locale) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, locale);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || isSkipped(root)) return;
    translateAttributes(root, locale);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateTextNode(node, locale);
    root.querySelectorAll('[aria-label],[title],[alt],[placeholder],input[type="button"],input[type="submit"],input[type="reset"]')
      .forEach(element => translateAttributes(element, locale));
  }

  function mountLanguageSetting() {
    const select = document.getElementById('workspace-language');
    if (!select) return;
    select.replaceChildren();
    for (const [value, label] of [['en', 'English'], ['zh', '简体中文']]) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    }
    select.addEventListener('change', () => setLanguage(select.value, true));
  }

  function setLanguage(requested, persist = false) {
    const locale = supported.has(requested) ? requested : DEFAULT_LANGUAGE;
    if (persist) {
      try { localStorage.setItem(LANGUAGE_STORAGE_KEY, locale); } catch (_) {}
    }
    window.currentWorkspaceLanguage = locale;
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    document.title = localizeText('CashFlow AI | Business Finance Intelligence', locale);
    translateSubtree(document.body, locale);
    const current = document.getElementById('workspace-language-current');
    if (current) current.textContent = locale === 'zh' ? '当前：简体中文' : 'Current: English';
    const select = document.getElementById('workspace-language');
    if (select) select.value = locale;
  }

  const observer = new MutationObserver(records => {
    const locale = window.currentWorkspaceLanguage || DEFAULT_LANGUAGE;
    for (const record of records) {
      if (record.type === 'characterData') {
        translateTextNode(record.target, locale);
      } else if (record.type === 'attributes') {
        translateAttributes(record.target, locale);
      } else {
        for (const added of record.addedNodes) translateSubtree(added, locale);
      }
    }
  });

  function start() {
    mountLanguageSetting();
    let saved = DEFAULT_LANGUAGE;
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (supported.has(stored)) saved = stored;
      else if (stored) localStorage.setItem(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
    } catch (_) {}
    setLanguage(saved, false);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-label', 'title', 'alt', 'placeholder']
    });
  }

  window.setWorkspaceLanguage = code => setLanguage(code, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
