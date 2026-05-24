(() => {
  'use strict';

  const STARTING_CASH = 100000;
  const STORAGE_KEY = 'vx_exchange_local_v1';
  const SESSION_KEY = 'vx_exchange_session_v1';
  const SECTOR_LABEL = {
    tech: '科技', finance: '金融', energy: '能源', consumer: '消费', health: '医疗', realestate: '房地产'
  };
  const SECTOR_COLOR = {
    tech: '#59a6ff', finance: '#ffba3a', energy: '#00d084', consumer: '#ff4d6d', health: '#a78bfa', realestate: '#94a3b8'
  };
  const SECTOR_EMOJI = {
    tech: '💻', finance: '💳', energy: '⚡', consumer: '🛍️', health: '💊', realestate: '🏗️'
  };

  const qs = (s) => document.querySelector(s);
  const qsa = (s) => [...document.querySelectorAll(s)];
  const money = (n = 0) => 'VX ' + Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  const num = (n = 0) => Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
  const compact = (n = 0) => {
    n = Number(n || 0);
    if (n >= 1e8) return 'VX ' + (n / 1e8).toFixed(2) + '亿';
    if (n >= 1e4) return 'VX ' + (n / 1e4).toFixed(1) + '万';
    return money(n);
  };
  const pct = (price, prev) => prev ? ((Number(price) - Number(prev)) / Number(prev) * 100) : 0;
  const isPositive = (n) => Number(n) >= 0;
  const safe = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2);

  const initialCompanies = [
    { id: 'seed-xjkj', founder_id: 'system', name: '星际科技', ticker: 'XJKJ', sector: 'tech', description: '专注于人工智能、量子计算和虚拟交易基础设施的前沿科技公司。', total_shares: 2000000, ipo_shares: 400000, ipo_price: 30, price: 45.8, prev_price: 43.2, status: 'listed', logo_emoji: '🚀', color: '#59a6ff', volume: 12400, created_at: new Date().toISOString() },
    { id: 'seed-lnjt', founder_id: 'system', name: '绿能集团', ticker: 'LNJT', sector: 'energy', description: '清洁能源、储能和可再生能源解决方案提供商。', total_shares: 5000000, ipo_shares: 1000000, ipo_price: 20, price: 22.3, prev_price: 23.5, status: 'listed', logo_emoji: '🌱', color: '#00d084', volume: 8900, created_at: new Date().toISOString() },
    { id: 'seed-szjr', founder_id: 'system', name: '数字金融', ticker: 'SZJR', sector: 'finance', description: '面向虚拟经济的数字金融、风控和资产管理平台。', total_shares: 1000000, ipo_shares: 200000, ipo_price: 60, price: 88.5, prev_price: 85.3, status: 'listed', logo_emoji: '💰', color: '#ffba3a', volume: 5600, created_at: new Date().toISOString() },
    { id: 'seed-yzyl', founder_id: 'system', name: '云端医疗', ticker: 'YDYL', sector: 'health', description: '利用 AI 辅助诊疗和数据平台提供远程医疗服务。', total_shares: 800000, ipo_shares: 160000, ipo_price: 100, price: 156.2, prev_price: 161, status: 'listed', logo_emoji: '🏥', color: '#a78bfa', volume: 3200, created_at: new Date().toISOString() },
    { id: 'seed-yyly', founder_id: 'system', name: '元宇宙娱乐', ticker: 'YYLY', sector: 'tech', description: '下一代虚拟现实内容、游戏和社交娱乐公司。', total_shares: 3000000, ipo_shares: 600000, ipo_price: 25, price: 33.6, prev_price: 31.8, status: 'listed', logo_emoji: '🎮', color: '#59a6ff', volume: 19800, created_at: new Date().toISOString() },
    { id: 'seed-tzhk', founder_id: 'system', name: '碳中和科技', ticker: 'TZHK', sector: 'energy', description: '碳捕获、碳核算和碳交易数字化平台。', total_shares: 2000000, ipo_shares: 400000, ipo_price: 30, price: 41.2, prev_price: 39.8, status: 'listed', logo_emoji: '🌍', color: '#00d084', volume: 9400, created_at: new Date().toISOString() }
  ];

  const initialIpos = [
    { id: 'ipo-njjk', company_id: 'ipo-company-njjk', ipo_price: 50, ipo_shares: 200000, subscribed_shares: 78000, start_at: new Date().toISOString(), end_at: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'open', company: { id: 'ipo-company-njjk', founder_id: 'system', name: '脑机接口科技', ticker: 'NJJK', sector: 'health', description: '非侵入式脑机接口设备研发与商业化应用公司。', total_shares: 1000000, ipo_shares: 200000, ipo_price: 50, price: 50, prev_price: 50, status: 'ipo', logo_emoji: '🧠', color: '#a78bfa', volume: 0, created_at: new Date().toISOString() } },
    { id: 'ipo-cdcn', company_id: 'ipo-company-cdcn', ipo_price: 35, ipo_shares: 400000, subscribed_shares: 225000, start_at: new Date().toISOString(), end_at: new Date(Date.now() + 86400000 * 2).toISOString(), status: 'open', company: { id: 'ipo-company-cdcn', founder_id: 'system', name: '超导储能', ticker: 'CDCN', sector: 'energy', description: '面向电网和数据中心的新型超导储能系统。', total_shares: 2000000, ipo_shares: 400000, ipo_price: 35, price: 35, prev_price: 35, status: 'ipo', logo_emoji: '⚡', color: '#00d084', volume: 0, created_at: new Date().toISOString() } }
  ];

  let app = {
    backend: 'local',
    supabase: null,
    profile: null,
    wallet: { cash: STARTING_CASH },
    companies: [],
    ipos: [],
    holdings: [],
    trades: [],
    leaderboard: [],
    adminStats: { pending: 0, users: 0, trades: 0 },
    activeSector: 'all',
    search: '',
  };

  function toast(title, msg = '', type = 'info') {
    const el = document.createElement('div');
    el.className = 'toast';
    const color = type === 'error' ? 'var(--red)' : type === 'success' ? 'var(--green)' : 'var(--blue)';
    el.innerHTML = `<strong style="color:${color}">${safe(title)}</strong><p>${safe(msg)}</p>`;
    qs('#toastStack').appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  function isSupabaseConfigured() {
    const cfg = window.VX_CONFIG || {};
    return Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_URL.includes('supabase'));
  }

  function decorateCompany(c) {
    return {
      ...c,
      logo_emoji: c.logo_emoji || SECTOR_EMOJI[c.sector] || '🏢',
      color: c.color || SECTOR_COLOR[c.sector] || '#59a6ff',
      price: Number(c.price || c.ipo_price || 1),
      prev_price: Number(c.prev_price || c.price || c.ipo_price || 1),
      total_shares: Number(c.total_shares || 0),
      ipo_shares: Number(c.ipo_shares || 0),
      volume: Number(c.volume || 0)
    };
  }

  function normalizeIpo(i) {
    const embedded = i.company || i.companies || app.companies.find(c => c.id === i.company_id) || {};
    return {
      ...i,
      ipo_price: Number(i.ipo_price || embedded.ipo_price || 1),
      ipo_shares: Number(i.ipo_shares || embedded.ipo_shares || 0),
      subscribed_shares: Number(i.subscribed_shares || 0),
      company: decorateCompany(embedded)
    };
  }

  function getListedCompanies() {
    return app.companies.map(decorateCompany).filter(c => c.status === 'listed');
  }

  function getAllCompaniesForDisplay() {
    const map = new Map();
    app.companies.forEach(c => map.set(c.id, decorateCompany(c)));
    app.ipos.forEach(i => map.set(i.company.id, decorateCompany(i.company)));
    return [...map.values()];
  }

  function findCompany(id) {
    return getAllCompaniesForDisplay().find(c => c.id === id);
  }

  function currentHolding(companyId) {
    return app.holdings.find(h => h.company_id === companyId);
  }

  function equityValue() {
    return app.holdings.reduce((sum, h) => {
      const c = findCompany(h.company_id);
      return sum + (c ? Number(h.quantity) * Number(c.price) : 0);
    }, 0);
  }

  function netWorth() {
    return Number(app.wallet?.cash || 0) + equityValue();
  }

  function requireLogin() {
    if (!app.profile) {
      qs('#authDialog').showModal();
      toast('需要登录', '请先登录或注册账户。', 'info');
      return false;
    }
    return true;
  }

  function isAdmin() {
    return app.profile?.role === 'admin';
  }

  function localLoadStore() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    const now = new Date().toISOString();
    const store = {
      users: [
        { id: 'admin-local', email: 'admin@vx.local', password: 'admin123', username: '管理员', role: 'admin', created_at: now },
        { id: 'demo-user', email: 'demo@vx.local', password: 'demo123', username: 'Demo 用户', role: 'user', created_at: now }
      ],
      wallets: [
        { user_id: 'admin-local', cash: STARTING_CASH },
        { user_id: 'demo-user', cash: STARTING_CASH }
      ],
      companies: initialCompanies.concat(initialIpos.map(i => i.company)),
      ipos: initialIpos.map(({ company, ...ipo }) => ipo),
      holdings: [],
      trades: [],
      wallet_transactions: []
    };
    localSaveStore(store);
    return store;
  }

  function localSaveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  const LocalAPI = {
    async init() {
      app.backend = 'local';
      const store = localLoadStore();
      const session = localStorage.getItem(SESSION_KEY);
      app.profile = store.users.find(u => u.id === session) || null;
    },
    async signIn(email, password) {
      const store = localLoadStore();
      const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!user) throw new Error('账号或密码错误。本地管理员：admin@vx.local / admin123');
      localStorage.setItem(SESSION_KEY, user.id);
      app.profile = user;
      await this.load();
    },
    async signUp(email, password, username) {
      const store = localLoadStore();
      if (store.users.some(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error('该邮箱已注册');
      const user = { id: uuid(), email, password, username: username || email.split('@')[0], role: 'user', created_at: new Date().toISOString() };
      store.users.push(user);
      store.wallets.push({ user_id: user.id, cash: STARTING_CASH });
      localSaveStore(store);
      localStorage.setItem(SESSION_KEY, user.id);
      app.profile = user;
      await this.load();
    },
    async signOut() {
      localStorage.removeItem(SESSION_KEY);
      app.profile = null;
      await this.load();
    },
    async load() {
      const store = localLoadStore();
      app.companies = store.companies.map(decorateCompany);
      app.ipos = store.ipos.filter(i => i.status === 'open').map(i => normalizeIpo({ ...i, company: store.companies.find(c => c.id === i.company_id) }));
      if (app.profile) {
        app.wallet = store.wallets.find(w => w.user_id === app.profile.id) || { user_id: app.profile.id, cash: STARTING_CASH };
        app.holdings = store.holdings.filter(h => h.user_id === app.profile.id);
        app.trades = store.trades.filter(t => t.user_id === app.profile.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      } else {
        app.wallet = { cash: STARTING_CASH };
        app.holdings = [];
        app.trades = [];
      }
      app.leaderboard = store.users.map(u => {
        const wallet = store.wallets.find(w => w.user_id === u.id) || { cash: 0 };
        const holdings = store.holdings.filter(h => h.user_id === u.id);
        const hv = holdings.reduce((sum, h) => {
          const c = store.companies.find(co => co.id === h.company_id);
          return sum + (c ? Number(h.quantity) * Number(c.price) : 0);
        }, 0);
        return { user_id: u.id, username: u.username, role: u.role, total_assets: Number(wallet.cash) + hv, holding_count: holdings.length };
      }).sort((a,b) => b.total_assets - a.total_assets);
      app.adminStats = { pending: store.companies.filter(c => c.status === 'pending').length, users: store.users.length, trades: store.trades.length };
    },
    async createCompany(input) {
      if (!app.profile) throw new Error('请先登录');
      const store = localLoadStore();
      if (store.companies.some(c => c.ticker.toUpperCase() === input.ticker.toUpperCase())) throw new Error('股票代码已存在');
      const company = {
        id: uuid(), founder_id: app.profile.id, name: input.name, ticker: input.ticker.toUpperCase(), sector: input.sector,
        description: input.description, total_shares: input.total_shares, ipo_shares: input.ipo_shares, ipo_price: input.ipo_price,
        price: input.ipo_price, prev_price: input.ipo_price, status: 'pending', logo_emoji: input.logo_emoji || SECTOR_EMOJI[input.sector] || '🏢',
        color: SECTOR_COLOR[input.sector] || '#59a6ff', volume: 0, created_at: new Date().toISOString()
      };
      store.companies.push(company);
      localSaveStore(store);
      await this.load();
      return company;
    },
    async approveCompany(companyId) {
      if (!isAdmin()) throw new Error('需要管理员权限');
      const store = localLoadStore();
      const c = store.companies.find(x => x.id === companyId);
      if (!c) throw new Error('公司不存在');
      c.status = 'ipo';
      let ipo = store.ipos.find(i => i.company_id === c.id);
      if (!ipo) {
        ipo = { id: uuid(), company_id: c.id, ipo_price: c.ipo_price, ipo_shares: c.ipo_shares, subscribed_shares: 0, start_at: new Date().toISOString(), end_at: new Date(Date.now() + 86400000 * 3).toISOString(), status: 'open' };
        store.ipos.push(ipo);
      }
      localSaveStore(store);
      await this.load();
    },
    async rejectCompany(companyId) {
      if (!isAdmin()) throw new Error('需要管理员权限');
      const store = localLoadStore();
      const c = store.companies.find(x => x.id === companyId);
      if (c) c.status = 'rejected';
      localSaveStore(store);
      await this.load();
    },
    async subscribeIPO(ipoId, quantity) {
      if (!app.profile) throw new Error('请先登录');
      const store = localLoadStore();
      const ipo = store.ipos.find(i => i.id === ipoId && i.status === 'open');
      if (!ipo) throw new Error('IPO 不存在或已关闭');
      const c = store.companies.find(x => x.id === ipo.company_id);
      const remaining = Number(ipo.ipo_shares) - Number(ipo.subscribed_shares || 0);
      if (quantity > remaining) throw new Error('认购数量超过剩余发行量');
      const wallet = store.wallets.find(w => w.user_id === app.profile.id);
      const total = quantity * Number(ipo.ipo_price);
      if (wallet.cash < total) throw new Error('余额不足');
      wallet.cash -= total;
      ipo.subscribed_shares = Number(ipo.subscribed_shares || 0) + quantity;
      let holding = store.holdings.find(h => h.user_id === app.profile.id && h.company_id === c.id);
      if (!holding) { holding = { user_id: app.profile.id, company_id: c.id, quantity: 0, avg_cost: Number(ipo.ipo_price) }; store.holdings.push(holding); }
      holding.avg_cost = ((Number(holding.avg_cost) * Number(holding.quantity)) + total) / (Number(holding.quantity) + quantity);
      holding.quantity = Number(holding.quantity) + quantity;
      store.trades.push({ id: uuid(), company_id: c.id, user_id: app.profile.id, side: 'ipo', quantity, price: Number(ipo.ipo_price), fee: 0, total_value: total, created_at: new Date().toISOString() });
      if (Number(ipo.subscribed_shares) >= Number(ipo.ipo_shares)) { ipo.status = 'closed'; c.status = 'listed'; c.listed_at = new Date().toISOString(); }
      localSaveStore(store);
      await this.load();
    },
    async tradeStock(companyId, side, quantity) {
      if (!app.profile) throw new Error('请先登录');
      const store = localLoadStore();
      const c = store.companies.find(x => x.id === companyId && x.status === 'listed');
      if (!c) throw new Error('该公司尚未上市交易');
      const wallet = store.wallets.find(w => w.user_id === app.profile.id);
      const price = Number(c.price);
      const fee = price * quantity * 0.001;
      let total = price * quantity;
      if (side === 'buy') {
        if (wallet.cash < total + fee) throw new Error('余额不足');
        wallet.cash -= total + fee;
        let holding = store.holdings.find(h => h.user_id === app.profile.id && h.company_id === c.id);
        if (!holding) { holding = { user_id: app.profile.id, company_id: c.id, quantity: 0, avg_cost: price }; store.holdings.push(holding); }
        holding.avg_cost = ((Number(holding.avg_cost) * Number(holding.quantity)) + total) / (Number(holding.quantity) + quantity);
        holding.quantity = Number(holding.quantity) + quantity;
      } else {
        let holding = store.holdings.find(h => h.user_id === app.profile.id && h.company_id === c.id);
        if (!holding || Number(holding.quantity) < quantity) throw new Error('持仓不足');
        holding.quantity = Number(holding.quantity) - quantity;
        wallet.cash += total - fee;
        if (holding.quantity <= 0) store.holdings = store.holdings.filter(h => !(h.user_id === app.profile.id && h.company_id === c.id));
      }
      const impactBase = Math.max(Number(c.ipo_shares || c.total_shares * .2), 1);
      const impact = Math.min(0.03, (quantity / impactBase) * 0.5);
      c.prev_price = c.price;
      c.price = Math.max(0.01, Number((price * (side === 'buy' ? 1 + impact : 1 - impact)).toFixed(2)));
      c.volume = Number(c.volume || 0) + quantity;
      store.trades.push({ id: uuid(), company_id: c.id, user_id: app.profile.id, side, quantity, price, fee, total_value: side === 'buy' ? total + fee : total - fee, created_at: new Date().toISOString() });
      localSaveStore(store);
      await this.load();
    }
  };

  const SupabaseAPI = {
    client: null,
    async init() {
      const cfg = window.VX_CONFIG || {};
      this.client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      app.supabase = this.client;
      app.backend = 'supabase';
      const { data } = await this.client.auth.getSession();
      if (data.session?.user) await this.loadProfile(data.session.user.id);
      this.client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) await this.loadProfile(session.user.id); else app.profile = null;
        await this.load();
        render();
      });
    },
    async loadProfile(userId) {
      const { data, error } = await this.client.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      app.profile = data;
    },
    async signIn(email, password) {
      const { data, error } = await this.client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) await this.loadProfile(data.user.id);
      await this.load();
    },
    async signUp(email, password, username) {
      const { data, error } = await this.client.auth.signUp({ email, password, options: { data: { username } } });
      if (error) throw error;
      if (!data.session) toast('注册成功', '请检查邮箱验证链接；若关闭邮箱验证，可直接登录。', 'success');
      if (data.user && data.session) await this.loadProfile(data.user.id);
      await this.load();
    },
    async signOut() {
      await this.client.auth.signOut();
      app.profile = null;
      await this.load();
    },
    async load() {
      const { data: companies, error: companyError } = await this.client.from('companies').select('*').order('created_at', { ascending: false });
      if (companyError) throw companyError;
      app.companies = (companies || []).map(decorateCompany);

      const { data: ipos, error: ipoError } = await this.client.from('ipos').select('*, companies(*)').eq('status', 'open').order('created_at', { ascending: false });
      if (ipoError) throw ipoError;
      app.ipos = (ipos || []).map(row => normalizeIpo({ ...row, company: row.companies }));

      if (app.profile) {
        const [{ data: wallet }, { data: holdings }, { data: trades }] = await Promise.all([
          this.client.from('wallets').select('*').eq('user_id', app.profile.id).maybeSingle(),
          this.client.from('holdings').select('*').eq('user_id', app.profile.id),
          this.client.from('trades').select('*').eq('user_id', app.profile.id).order('created_at', { ascending: false }).limit(50)
        ]);
        app.wallet = wallet || { cash: STARTING_CASH };
        app.holdings = holdings || [];
        app.trades = trades || [];
      } else {
        app.wallet = { cash: STARTING_CASH };
        app.holdings = [];
        app.trades = [];
      }

      const { data: leaderboard } = await this.client.from('leaderboard').select('*').order('total_assets', { ascending: false }).limit(20);
      app.leaderboard = leaderboard || [];

      if (isAdmin()) {
        const [pending, users, trades] = await Promise.all([
          this.client.from('companies').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
          this.client.from('profiles').select('id', { count: 'exact', head: true }),
          this.client.from('trades').select('id', { count: 'exact', head: true })
        ]);
        app.adminStats = { pending: pending.count || 0, users: users.count || 0, trades: trades.count || 0 };
      }
    },
    async createCompany(input) {
      if (!app.profile) throw new Error('请先登录');
      const payload = { ...input, founder_id: app.profile.id, ticker: input.ticker.toUpperCase(), status: 'pending', price: input.ipo_price, prev_price: input.ipo_price, color: SECTOR_COLOR[input.sector] || '#59a6ff' };
      const { data, error } = await this.client.from('companies').insert(payload).select().single();
      if (error) throw error;
      await this.load();
      return data;
    },
    async approveCompany(companyId) {
      const { error } = await this.client.rpc('approve_company', { p_company_id: companyId });
      if (error) throw error;
      await this.load();
    },
    async rejectCompany(companyId) {
      const { error } = await this.client.rpc('reject_company', { p_company_id: companyId });
      if (error) throw error;
      await this.load();
    },
    async subscribeIPO(ipoId, quantity) {
      const { error } = await this.client.rpc('subscribe_ipo', { p_ipo_id: ipoId, p_quantity: quantity });
      if (error) throw error;
      await this.load();
    },
    async tradeStock(companyId, side, quantity) {
      const { error } = await this.client.rpc('trade_stock', { p_company_id: companyId, p_side: side, p_quantity: quantity });
      if (error) throw error;
      await this.load();
    }
  };

  function API() { return app.backend === 'supabase' ? SupabaseAPI : LocalAPI; }

  async function refresh() {
    await API().load();
    render();
  }

  function setActiveView(view) {
    qsa('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
    qsa('.nav-link').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderView(view);
  }

  function render() {
    const logged = Boolean(app.profile);
    qs('#cashChip').textContent = money(app.wallet?.cash || 0);
    qs('#userChip').textContent = logged ? `${app.profile.username || app.profile.email} · ${app.profile.role}` : '未登录';
    qs('#authBtn').textContent = logged ? '退出' : '登录 / 注册';
    qs('#sideNetWorth').textContent = money(netWorth());
    qs('#sideReturn').textContent = `${isPositive(netWorth() - STARTING_CASH) ? '+' : ''}${((netWorth() - STARTING_CASH) / STARTING_CASH * 100).toFixed(2)}%`;
    qs('#sideReturn').style.color = isPositive(netWorth() - STARTING_CASH) ? 'var(--green)' : 'var(--red)';
    qs('#ipoCountPill').textContent = app.ipos.length;
    qs('#modeCard').innerHTML = app.backend === 'supabase'
      ? '后端：<b style="color:var(--green)">Supabase 多人版</b><br>数据、用户、交易会跨设备共享。'
      : '后端：<b style="color:var(--gold)">本地 Demo</b><br>可直接预览；部署多人版需配置 Supabase。';
    qsa('.admin-only').forEach(el => el.classList.toggle('is-hidden', !isAdmin()));
    renderTicker();
    renderMarket();
    renderIpos();
    renderPortfolio();
    renderFounder();
    renderLeaderboard();
    renderAdmin();
    renderListingRules();
  }

  function renderView(view) {
    const map = { market: renderMarket, ipos: renderIpos, portfolio: renderPortfolio, founder: renderFounder, create: renderListingRules, leaderboard: renderLeaderboard, admin: renderAdmin };
    (map[view] || renderMarket)();
  }

  function renderTicker() {
    const listed = getListedCompanies();
    qs('#tickerStrip').innerHTML = listed.slice(0, 10).map(c => {
      const change = pct(c.price, c.prev_price);
      return `<span class="ticker-item"><b>${safe(c.ticker)}</b><strong>${money(c.price)}</strong><em class="${isPositive(change) ? 'positive' : 'negative'}">${isPositive(change) ? '+' : ''}${change.toFixed(2)}%</em></span>`;
    }).join('') || '<span class="ticker-item">暂无上市公司</span>';
  }

  function renderMarket() {
    let rows = getListedCompanies();
    if (app.activeSector !== 'all') rows = rows.filter(c => c.sector === app.activeSector);
    if (app.search) {
      const s = app.search.toLowerCase();
      rows = rows.filter(c => c.name.toLowerCase().includes(s) || c.ticker.toLowerCase().includes(s));
    }
    const totalVol = rows.reduce((s, c) => s + Number(c.volume || 0), 0);
    const index = rows.length ? rows.reduce((s, c) => s + c.price, 0) / rows.length * 100 : 0;
    qs('#statIndex').textContent = index.toFixed(2);
    qs('#statListed').textContent = rows.length;
    qs('#statVolume').textContent = num(totalVol);
    qs('#statMood').textContent = rows.filter(c => c.price >= c.prev_price).length >= rows.length / 2 ? 'Bullish' : 'Mixed';
    qs('#marketRows').innerHTML = rows.map(c => {
      const change = pct(c.price, c.prev_price);
      return `<tr>
        <td><div class="company-cell"><div class="logo" style="color:${c.color}">${safe(c.logo_emoji)}</div><div><strong>${safe(c.name)}</strong><div class="subtle">${safe(c.description).slice(0, 38)}...</div></div></div></td>
        <td><strong>${safe(c.ticker)}</strong></td>
        <td><strong>${money(c.price)}</strong></td>
        <td><span class="badge ${isPositive(change) ? 'green' : 'red'}">${isPositive(change) ? '▲ +' : '▼ '}${change.toFixed(2)}%</span></td>
        <td>${num(c.volume)}</td>
        <td>${compact(c.price * c.total_shares)}</td>
        <td><span class="badge blue">${SECTOR_LABEL[c.sector] || c.sector}</span></td>
        <td><button class="btn primary" data-trade="${c.id}">交易</button></td>
      </tr>`;
    }).join('') || `<tr><td colspan="8"><div class="empty">暂无上市公司</div></td></tr>`;
  }

  function renderIpos() {
    qs('#ipoCards').innerHTML = app.ipos.map(ipo => {
      const c = ipo.company;
      const ratio = ipo.ipo_shares ? Math.min(100, Number(ipo.subscribed_shares) / Number(ipo.ipo_shares) * 100) : 0;
      const hours = Math.max(0, Math.floor((new Date(ipo.end_at) - Date.now()) / 3600000));
      return `<article class="ipo-card">
        <div class="card-head">
          <div class="company-cell"><div class="logo" style="color:${c.color}">${safe(c.logo_emoji)}</div><div><strong>${safe(c.name)}</strong><div class="subtle">${safe(c.ticker)} · ${SECTOR_LABEL[c.sector] || c.sector}</div></div></div>
          <span class="badge gold">IPO OPEN</span>
        </div>
        <div class="card-body">
          <p>${safe(c.description)}</p>
          <div class="list-item"><span>发行价</span><strong>${money(ipo.ipo_price)}</strong></div>
          <div class="progress"><span style="width:${ratio}%"></span></div>
          <div class="subtle">已认购 ${num(ipo.subscribed_shares)} / ${num(ipo.ipo_shares)} 股 · ${hours} 小时剩余</div>
          <button class="btn primary" style="width:100%;margin-top:14px" data-ipo="${ipo.id}">参与认购</button>
        </div>
      </article>`;
    }).join('') || '<div class="empty">暂无开放中的 IPO。管理员审核公司后会出现在这里。</div>';
  }

  function renderPortfolio() {
    const cash = Number(app.wallet?.cash || 0);
    const ev = equityValue();
    const nw = cash + ev;
    qs('#portfolioNetWorth').textContent = money(nw);
    qs('#portfolioCash').textContent = money(cash);
    qs('#portfolioEquity').textContent = money(ev);
    qs('#portfolioReturn').textContent = `${isPositive(nw - STARTING_CASH) ? '+' : ''}${((nw - STARTING_CASH) / STARTING_CASH * 100).toFixed(2)}%`;
    qs('#portfolioReturn').style.color = isPositive(nw - STARTING_CASH) ? 'var(--green)' : 'var(--red)';
    qs('#holdingList').innerHTML = app.holdings.map(h => {
      const c = findCompany(h.company_id);
      if (!c) return '';
      const value = Number(h.quantity) * c.price;
      const pnl = value - Number(h.quantity) * Number(h.avg_cost);
      return `<div class="list-item"><div class="company-cell"><div class="logo" style="color:${c.color}">${safe(c.logo_emoji)}</div><div><strong>${safe(c.name)}</strong><div class="subtle">${num(h.quantity)} 股 · 均价 ${money(h.avg_cost)}</div></div></div><div style="text-align:right"><strong>${money(value)}</strong><div class="${isPositive(pnl) ? 'positive' : 'negative'}">${isPositive(pnl) ? '+' : ''}${money(pnl)}</div></div></div>`;
    }).join('') || '<div class="empty">暂无持仓。去市场买入股票，或参与 IPO。</div>';
    qs('#tradeList').innerHTML = app.trades.map(t => {
      const c = findCompany(t.company_id) || { ticker: 'IPO', name: 'Unknown' };
      return `<div class="list-item"><div><span class="badge ${t.side === 'sell' ? 'red' : 'green'}">${t.side.toUpperCase()}</span> <strong>${safe(c.ticker)}</strong><div class="subtle">${new Date(t.created_at).toLocaleString('zh-CN')}</div></div><div style="text-align:right"><strong>${num(t.quantity)} 股</strong><div class="subtle">${money(t.price)}</div></div></div>`;
    }).join('') || '<div class="empty">暂无交易记录。</div>';
  }

  function renderFounder() {
    if (!app.profile) { qs('#founderList').innerHTML = '<div class="empty">请先登录，然后创建公司。</div>'; return; }
    const mine = app.companies.filter(c => c.founder_id === app.profile.id);
    qs('#founderList').innerHTML = mine.map(c => {
      const statusBadge = c.status === 'pending' ? 'gold' : c.status === 'listed' ? 'green' : c.status === 'rejected' ? 'red' : 'blue';
      const ipo = app.ipos.find(i => i.company_id === c.id);
      const ratio = ipo ? Math.min(100, Number(ipo.subscribed_shares) / Number(ipo.ipo_shares) * 100) : 0;
      return `<article class="company-card">
        <div class="card-head"><div class="company-cell"><div class="logo" style="color:${c.color}">${safe(c.logo_emoji)}</div><div><strong>${safe(c.name)}</strong><div class="subtle">${safe(c.ticker)}</div></div></div><span class="badge ${statusBadge}">${safe(c.status)}</span></div>
        <div class="card-body"><p>${safe(c.description)}</p><div class="list-item"><span>估值</span><strong>${compact(Number(c.price) * Number(c.total_shares))}</strong></div>${ipo ? `<div class="progress"><span style="width:${ratio}%"></span></div><div class="subtle">IPO 认购进度 ${ratio.toFixed(1)}%</div>` : '<div class="subtle">等待审核或已完成上市。</div>'}</div>
      </article>`;
    }).join('') || '<div class="empty">你还没有创建公司。点击“申请上市”开始。</div>';
  }

  function renderLeaderboard() {
    qs('#leaderboardRows').innerHTML = app.leaderboard.map((p, idx) => `<tr><td><strong>${idx + 1}</strong></td><td>${safe(p.username || '匿名用户')}</td><td><span class="badge ${p.role === 'admin' ? 'gold' : 'blue'}">${safe(p.role || 'user')}</span></td><td><strong>${money(p.total_assets)}</strong></td><td>${num(p.holding_count)}</td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">暂无排行榜数据。</div></td></tr>';
  }

  function renderAdmin() {
    qs('#adminMode').textContent = app.backend === 'supabase' ? 'Supabase' : 'Local';
    qs('#adminPending').textContent = app.adminStats.pending || 0;
    qs('#adminUsers').textContent = app.adminStats.users || 0;
    qs('#adminTrades').textContent = app.adminStats.trades || 0;
    if (!isAdmin()) { qs('#adminPendingList').innerHTML = '<div class="empty">当前账户不是管理员。</div>'; return; }
    const pending = app.companies.filter(c => c.status === 'pending');
    qs('#adminPendingList').innerHTML = pending.map(c => `<div class="list-item"><div class="company-cell"><div class="logo" style="color:${c.color}">${safe(c.logo_emoji)}</div><div><strong>${safe(c.name)} (${safe(c.ticker)})</strong><div class="subtle">${safe(c.description).slice(0, 90)}...</div></div></div><div style="display:flex;gap:8px"><button class="btn primary" data-approve="${c.id}">批准 IPO</button><button class="btn danger" data-reject="${c.id}">拒绝</button></div></div>`).join('') || '<div class="empty">没有待审核公司。</div>';
  }

  function renderListingRules() {
    const name = qs('#companyName')?.value?.trim() || '';
    const ticker = qs('#companyTicker')?.value?.trim() || '';
    const desc = qs('#companyDesc')?.value?.trim() || '';
    const exists = getAllCompaniesForDisplay().some(c => c.ticker.toUpperCase() === ticker.toUpperCase());
    const rules = [
      [name.length >= 2, '公司名称至少 2 个字符'],
      [/^[A-Za-z]{2,5}$/.test(ticker), '股票代码必须是 2–5 位英文字母'],
      [desc.length >= 50, `公司简介至少 50 字，当前 ${desc.length} 字`],
      [!exists || !ticker, '股票代码不能重复'],
      [Boolean(app.profile), '登录后才能提交上市申请']
    ];
    const el = qs('#listingRules');
    if (el) el.innerHTML = rules.map(([ok, text]) => `<div style="color:${ok ? 'var(--green)' : 'var(--muted)'}">${ok ? '✓' : '○'} ${safe(text)}</div>`).join('');
  }

  function openTradeDialog(companyId) {
    if (!requireLogin()) return;
    const c = findCompany(companyId);
    if (!c) return;
    const h = currentHolding(companyId);
    const change = pct(c.price, c.prev_price);
    qs('#tradeDialogContent').innerHTML = `<h2>${safe(c.name)} <span class="subtle">${safe(c.ticker)}</span></h2>
      <p>当前价格 <strong>${money(c.price)}</strong> <span class="${isPositive(change) ? 'positive' : 'negative'}">${isPositive(change) ? '+' : ''}${change.toFixed(2)}%</span></p>
      <label>方向<select id="tradeSide"><option value="buy">买入</option><option value="sell">卖出</option></select></label>
      <label>数量<input id="tradeQty" type="number" min="1" value="100" /></label>
      <div class="rule-box">可用现金：${money(app.wallet.cash)}<br>当前持仓：${h ? num(h.quantity) : 0} 股<br>手续费：0.1%</div>
      <button class="btn primary large" type="button" id="executeTradeBtn">提交交易</button>`;
    qs('#tradeDialog').showModal();
    qs('#executeTradeBtn').onclick = async () => {
      const side = qs('#tradeSide').value;
      const qty = Number(qs('#tradeQty').value);
      if (!Number.isFinite(qty) || qty <= 0) return toast('输入错误', '请输入有效数量。', 'error');
      try { await API().tradeStock(companyId, side, qty); qs('#tradeDialog').close(); toast('交易成功', `${side === 'buy' ? '买入' : '卖出'} ${num(qty)} 股 ${c.ticker}`, 'success'); render(); }
      catch (err) { toast('交易失败', err.message, 'error'); }
    };
  }

  function openIpoDialog(ipoId) {
    if (!requireLogin()) return;
    const ipo = app.ipos.find(i => i.id === ipoId);
    if (!ipo) return;
    const c = ipo.company;
    const remaining = Number(ipo.ipo_shares) - Number(ipo.subscribed_shares);
    qs('#ipoDialogContent').innerHTML = `<h2>${safe(c.name)} IPO</h2><p>${safe(c.description)}</p>
      <div class="rule-box">发行价：${money(ipo.ipo_price)}<br>剩余可认购：${num(remaining)} 股<br>你的现金：${money(app.wallet.cash)}</div>
      <label>认购数量<input id="ipoQty" type="number" min="1" max="${remaining}" value="100" /></label>
      <button class="btn primary large" type="button" id="executeIpoBtn">确认认购</button>`;
    qs('#ipoDialog').showModal();
    qs('#executeIpoBtn').onclick = async () => {
      const qty = Number(qs('#ipoQty').value);
      if (!Number.isFinite(qty) || qty <= 0) return toast('输入错误', '请输入有效数量。', 'error');
      try { await API().subscribeIPO(ipoId, qty); qs('#ipoDialog').close(); toast('认购成功', `已认购 ${num(qty)} 股 ${c.ticker}`, 'success'); render(); }
      catch (err) { toast('认购失败', err.message, 'error'); }
    };
  }

  async function handleCompanySubmit(e) {
    e.preventDefault();
    if (!requireLogin()) return;
    const name = qs('#companyName').value.trim();
    const ticker = qs('#companyTicker').value.trim().toUpperCase();
    const sector = qs('#companySector').value;
    const description = qs('#companyDesc').value.trim();
    const total_shares = Number(qs('#companyShares').value);
    const ipo_price = Number(qs('#companyPrice').value);
    const ratio = Number(qs('#companyRatio').value);
    const logo_emoji = qs('#companyEmoji').value.trim() || SECTOR_EMOJI[sector] || '🏢';
    if (!/^[A-Z]{2,5}$/.test(ticker)) return toast('格式错误', '股票代码必须是 2–5 位英文字母。', 'error');
    if (description.length < 50) return toast('简介太短', '公司简介至少需要 50 字。', 'error');
    try {
      await API().createCompany({ name, ticker, sector, description, total_shares, ipo_shares: Math.floor(total_shares * ratio), ipo_price, logo_emoji });
      e.target.reset();
      toast('提交成功', '公司已进入待审核队列。管理员批准后会开启 IPO。', 'success');
      setActiveView('founder');
    } catch (err) { toast('提交失败', err.message, 'error'); }
  }

  function bindEvents() {
    document.body.addEventListener('click', async (e) => {
      const viewBtn = e.target.closest('[data-view]');
      if (viewBtn) setActiveView(viewBtn.dataset.view);
      const tradeBtn = e.target.closest('[data-trade]');
      if (tradeBtn) openTradeDialog(tradeBtn.dataset.trade);
      const ipoBtn = e.target.closest('[data-ipo]');
      if (ipoBtn) openIpoDialog(ipoBtn.dataset.ipo);
      const approve = e.target.closest('[data-approve]');
      if (approve) { try { await API().approveCompany(approve.dataset.approve); toast('已批准', '公司进入 IPO 阶段。', 'success'); render(); } catch (err) { toast('批准失败', err.message, 'error'); } }
      const reject = e.target.closest('[data-reject]');
      if (reject) { try { await API().rejectCompany(reject.dataset.reject); toast('已拒绝', '申请已被拒绝。', 'success'); render(); } catch (err) { toast('拒绝失败', err.message, 'error'); } }
    });
    qs('#authBtn').onclick = async () => {
      if (app.profile) { await API().signOut(); toast('已退出', '账户已退出登录。'); render(); }
      else qs('#authDialog').showModal();
    };
    qs('#syncBtn').onclick = async () => { try { await refresh(); toast('已刷新', '市场数据已同步。', 'success'); } catch (err) { toast('刷新失败', err.message, 'error'); } };
    qs('#loginBtn').onclick = async () => {
      try { await API().signIn(qs('#authEmail').value, qs('#authPassword').value); qs('#authDialog').close(); toast('登录成功', '欢迎回来。', 'success'); render(); }
      catch (err) { toast('登录失败', err.message, 'error'); }
    };
    qs('#registerBtn').onclick = async () => {
      try { await API().signUp(qs('#authEmail').value, qs('#authPassword').value, qs('#authUsername').value); qs('#authDialog').close(); toast('注册成功', '账户已创建。', 'success'); render(); }
      catch (err) { toast('注册失败', err.message, 'error'); }
    };
    qs('#marketSearch').addEventListener('input', e => { app.search = e.target.value.trim(); renderMarket(); });
    qsa('[data-sector]').forEach(b => b.onclick = () => { app.activeSector = b.dataset.sector; qsa('[data-sector]').forEach(x => x.classList.toggle('active', x === b)); renderMarket(); });
    qs('#companyForm').addEventListener('submit', handleCompanySubmit);
    ['companyName','companyTicker','companyDesc'].forEach(id => qs('#' + id).addEventListener('input', renderListingRules));
  }

  async function boot() {
    bindEvents();
    try {
      if (isSupabaseConfigured()) {
        if (!window.supabase) throw new Error('Supabase JS 未加载，请检查网络或 CDN。');
        await SupabaseAPI.init();
      } else {
        await LocalAPI.init();
      }
      await API().load();
      render();
      toast('VX Exchange 已启动', app.backend === 'supabase' ? '当前为 Supabase 多人版。' : '当前为本地 Demo 版，可在 config.js 配置 Supabase。', 'success');
    } catch (err) {
      console.error(err);
      await LocalAPI.init();
      await LocalAPI.load();
      render();
      toast('已切换到本地 Demo', err.message || 'Supabase 初始化失败。', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
