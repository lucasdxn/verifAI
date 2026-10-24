/* verifAI demo: shared state, navigation and helpers.
   State lives in this browser (localStorage) so every page sees the same progress. */
(function () {
  var D = window.RW_DATA;
  var KEY = 'rootwise-demo-v1';
  var memory = null;

  function blank() {
    return { ov: {}, goals: [], extraTeach: [], task: { step: 3, done: {} }, activity: [], dark: null, other: {} }; // dark: null = follow the system setting
  }
  function load() {
    if (memory) return memory;
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    memory = Object.assign(blank(), s || {});
    // Older saves had one guided task; move it into the task list.
    if (!memory.tasks) {
      memory.tasks = {
        list: [{ id: 't-plat412', tpl: 'plat-412', step: (memory.task && memory.task.step) || 3, code: (memory.task && memory.task.code) || {}, extra: memory.extraTeach || [], created: '21.10.' }],
        active: 't-plat412'
      };
    }
    if (!memory.chat) memory.chat = [];
    return memory;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch (e) { /* storage unavailable: keep in memory */ }
  }
  function update(fn) { var s = load(); fn(s); save(); return s; }

  function today() {
    var d = new Date();
    return d.getDate() + '.' + (d.getMonth() + 1) + '.';
  }

  // ---------- nodes ----------
  var NODE = {};
  D.nodes.forEach(function (r) {
    NODE[r[0]] = { id: r[0], lane: r[1], col: r[2], row: r[3], name: r[4], base: r[5], basePct: r[6], optional: r[7], desc: r[8], req: r[9], baseDate: r[10] };
  });
  var LANE = {};
  D.lanes.forEach(function (l) { LANE[l.id] = l; });
  var MANAGER_KNOWN_BASE = { 'py-fn': true };

  function rawStatus(id) {
    var s = load(), o = s.ov[id], n = NODE[id];
    return o && o.status ? o.status : n.base;
  }
  function node(id) {
    var s = load(), n = NODE[id], o = s.ov[id] || {};
    var st = rawStatus(id);
    if (st === 'ready' || st === 'locked') {
      var ok = n.req.every(function (r) { return rawStatus(r) === 'verified'; });
      st = ok ? 'ready' : 'locked';
    }
    var byManager = o.by === 'manager' || (!o.status && MANAGER_KNOWN_BASE[id]);
    return Object.assign({}, n, {
      status: st,
      pct: st === 'verified' ? 100 : (o.pct != null ? o.pct : (st === 'learning' ? n.basePct : 0)),
      date: o.date || n.baseDate,
      byManager: !!byManager && st === 'verified',
      byTask: o.by === 'task' && st === 'verified',
      laneName: LANE[n.lane].name, c: LANE[n.lane].c, tag: LANE[n.lane].tag,
      reqNames: n.req.length ? n.req.map(function (r) { return NODE[r].name; }).join(', ') : 'Nothing, start here',
      inTask: teaches().indexOf(id) !== -1 && st !== 'verified',
      taskId: st !== 'verified' ? taskTeaching(id) : null,
      goal: goalFor(id)
    });
  }
  // ---------- developer level ----------
  // XP per verified concept grows with its stage: Basics 10 ... Advanced 50.
  // Overall levels 1-6 come from total XP. Level 7, Full Stack Engineer, needs Senior in TypeScript and in a backend language.
  var LEVELS = [[0, 'Newcomer'], [20, 'Beginner'], [60, 'Junior'], [130, 'Intermediate'], [220, 'Advanced'], [320, 'Senior'], [null, 'Full Stack Engineer']];
  // Per language, levels follow the share of that tree's XP you've verified (trees differ in size).
  var LANE_SHARE = [0, 0.05, 0.15, 0.30, 0.50, 0.75];
  function xpOf(n) { return (n.col + 1) * 10; }
  function laneXP(laneId) {
    var ns = allNodes().filter(function (n) { return n.lane === laneId; });
    var max = ns.reduce(function (a, n) { return a + xpOf(n); }, 0);
    var xp = ns.filter(function (n) { return n.status === 'verified'; }).reduce(function (a, n) { return a + xpOf(n); }, 0);
    return { xp: xp, max: max, share: max ? xp / max : 0 };
  }
  function isLaneSenior(laneId) { return laneXP(laneId).share >= LANE_SHARE[5]; }
  function fullStack() {
    return D.fullStackSets.some(function (set) { return set.every(isLaneSenior); });
  }
  // Progress towards Full Stack: the closest set, judged by its weakest language.
  function fullStackProgress() {
    return Math.round(Math.max.apply(null, D.fullStackSets.map(function (set) {
      return Math.min.apply(null, set.map(function (l) { return Math.min(1, laneXP(l).share / LANE_SHARE[5]); }));
    })) * 100);
  }
  function suggestions(ns) {
    // the quickest concepts to reach the next level: learning first, then ready ones, biggest XP first
    return ns.filter(function (n) { return n.status === 'learning' || n.status === 'ready'; })
      .sort(function (a, b) { return (b.status === 'learning') - (a.status === 'learning') || xpOf(b) - xpOf(a); }).slice(0, 3)
      .map(function (n) { return { id: n.id, name: n.name, lane: n.laneName, xp: xpOf(n) }; });
  }
  function withCareer(o) {
    var c = D.career[o.num - 1];
    o.position = c.position; o.eur = c.eur; o.usd = c.usd; o.salaryNote = c.note || '';
    return o;
  }
  function level(laneId) {
    if (laneId) {
      var lx = laneXP(laneId), k = 0;
      for (var a = 0; a < LANE_SHARE.length; a++) if (lx.share >= LANE_SHARE[a]) k = a;
      var nextShare = LANE_SHARE[k + 1];
      var nextXP = nextShare == null ? null : Math.ceil(nextShare * lx.max);
      return withCareer({
        xp: lx.xp, max: lx.max, num: k + 1, name: LEVELS[k][1], nextName: nextShare == null ? null : LEVELS[k + 1][1],
        nextAt: nextXP, toNext: nextXP == null ? 0 : nextXP - lx.xp,
        pct: nextShare == null ? 100 : Math.round((lx.share - LANE_SHARE[k]) / (nextShare - LANE_SHARE[k]) * 100),
        suggest: suggestions(allNodes().filter(function (n) { return n.lane === laneId; }))
      });
    }
    var ns = allNodes();
    var xp = ns.filter(function (n) { return n.status === 'verified'; }).reduce(function (s, n) { return s + xpOf(n); }, 0);
    var i = 0;
    for (var j = 0; j < 6; j++) if (xp >= LEVELS[j][0]) i = j;
    if (i === 5 && fullStack()) i = 6;
    var o = { xp: xp, num: i + 1, name: LEVELS[i][1], suggest: suggestions(ns) };
    if (i < 5) {
      o.nextName = LEVELS[i + 1][1]; o.nextAt = LEVELS[i + 1][0]; o.toNext = o.nextAt - xp;
      o.pct = Math.round((xp - LEVELS[i][0]) / (o.nextAt - LEVELS[i][0]) * 100);
    } else if (i === 5) {
      // Senior to Full Stack: no XP number, it's about which languages you're Senior in.
      o.nextName = LEVELS[6][1]; o.nextAt = null; o.toNext = 0; o.pct = fullStackProgress();
      o.requirement = 'Reach Senior in TypeScript and in Python or Go';
    } else {
      o.nextName = null; o.nextAt = null; o.toNext = 0; o.pct = 100;
    }
    return withCareer(o);
  }

  function verify(id, by, taskId) {
    var before = level().num;
    update(function (s) {
      s.ov[id] = { status: 'verified', date: today(), by: by || 'challenge' };
      if (taskId) s.ov[id].task = taskId;
      var n = NODE[id];
      s.activity.unshift({
        text: by === 'manager' ? D.manager.name + ' marked ' + n.name + ' (' + LANE[n.lane].name + ') as already known' : 'Verified ' + n.name + ' (' + LANE[n.lane].name + ')',
        when: today(), kind: by === 'manager' ? 'manager' : 'verified'
      });
    });
    var after = level();
    if (after.num > before) {
      update(function (s) {
        s.levelUp = after.name;
        s.activity.unshift({ text: 'Reached level ' + after.num + ': ' + after.name + ' developer', when: today(), kind: 'verified' });
      });
      showLevelUp();
    }
  }
  function showLevelUp() {
    var s = load();
    if (!s.levelUp || !document.body) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = 'Level up! You’re now level ' + level().num + ': ' + s.levelUp + ' developer.';
    document.body.appendChild(t);
    update(function (x) { x.levelUp = null; });
    setTimeout(function () { t.remove(); }, 4000);
    header(currentActive);
  }
  function unverify(id) {
    update(function (s) {
      s.ov[id] = { status: 'ready' };
      s.activity.unshift({ text: D.manager.name + ' undid "known" for ' + NODE[id].name, when: today(), kind: 'manager' });
    });
  }
  function allNodes() { return D.nodes.map(function (r) { return node(r[0]); }); }
  function laneStats(laneId) {
    var ns = allNodes().filter(function (n) { return n.lane === laneId; });
    var ver = ns.filter(function (n) { return n.status === 'verified'; });
    var lrn = ns.filter(function (n) { return n.status === 'learning'; });
    var next = ns.filter(function (n) { return n.status === 'learning'; }).sort(function (a, b) { return b.pct - a.pct; })[0] ||
      ns.filter(function (n) { return n.status === 'ready'; })[0];
    return { total: ns.length, ver: ver.length, learning: lrn.length, verifiedNames: ver.map(function (n) { return n.name; }), next: next };
  }
  function nextUp() {
    var cand = allNodes().filter(function (n) { return n.status === 'learning'; }).sort(function (a, b) { return b.pct - a.pct; });
    return cand[0] || null;
  }

  // ---------- goals & task ----------
  function goals() { return D.goals.concat(load().goals); }
  function goalFor(id) {
    var g = goals().filter(function (x) { return x.node === id; }).pop();
    return g ? g.due : (NODE[id] && NODE[id].optional ? 'optional' : '');
  }
  function addGoal(nodeId, who, size, due) {
    update(function (s) {
      s.goals.push({ id: 'u' + Date.now(), node: nodeId, who: who, size: size, othersDone: 0, due: due });
      s.activity.unshift({ text: D.manager.name + ' set a goal: ' + NODE[nodeId].name + ' by ' + due, when: today(), kind: 'manager' });
    });
  }
  // ---------- guided tasks ----------
  var LIB = {};
  D.library.forEach(function (t) { LIB[t.id] = t; });
  function uniq(a) { return a.filter(function (x, i) { return a.indexOf(x) === i; }); }
  function resolve(t) {
    var plan = t.tpl ? LIB[t.tpl] : t.plan;
    if (!plan) return null;
    return {
      id: t.id, tpl: t.tpl || null, custom: !t.tpl, ticket: plan.ticket || 'Own task', lane: plan.lane, laneName: LANE[plan.lane].name,
      title: plan.title, brief: plan.brief, uses: plan.uses || [], steps: plan.steps,
      teaches: uniq((plan.teaches || []).concat(t.extra || [])), extra: t.extra || [],
      step: Math.min(Math.max(t.step || 1, 1), plan.steps.length), code: t.code || {}, created: t.created, aiPlanned: !!plan.aiPlanned
    };
  }
  function tasks() { return load().tasks.list.map(resolve).filter(Boolean); }
  function task(id) { return tasks().filter(function (t) { return t.id === id; })[0] || null; }
  function activeTask() { var a = task(load().tasks.active); return a || tasks()[0] || null; }
  function setActive(id) { update(function (s) { s.tasks.active = id; }); }
  function rawTask(s, id) { return s.tasks.list.filter(function (t) { return t.id === id; })[0]; }
  function updateTask(id, fn) { update(function (s) { var t = rawTask(s, id); if (t) fn(t, s); }); }
  function startTask(tplId, plan) {
    var id = 't' + Date.now().toString(36);
    update(function (s) {
      s.tasks.list.unshift({ id: id, tpl: tplId || null, plan: plan || null, step: 1, code: {}, extra: [], created: today() });
      s.tasks.active = id;
      s.activity.unshift({ text: 'Started guided task: ' + (tplId ? LIB[tplId].title : plan.title), when: today(), kind: 'task' });
    });
    return id;
  }
  // Deleting a task keeps concepts it already unlocked; only the task and its progress go away.
  function deleteTask(id) {
    var t = task(id);
    update(function (s) {
      s.tasks.list = s.tasks.list.filter(function (x) { return x.id !== id; });
      if (s.tasks.active === id) s.tasks.active = s.tasks.list[0] ? s.tasks.list[0].id : null;
      if (t) s.activity.unshift({ text: 'Deleted guided task: ' + t.title, when: today(), kind: 'task' });
    });
  }
  // Resetting starts the task over and locks again what its own checks unlocked.
  function resetTask(id) {
    var t = task(id);
    update(function (s) {
      var r = rawTask(s, id);
      if (!r) return;
      r.step = 1; r.code = {};
      Object.keys(s.ov).forEach(function (nid) {
        var o = s.ov[nid];
        if (o.task === id && (o.by === 'task' || o.status === 'learning')) delete s.ov[nid];
      });
      s.activity.unshift({ text: 'Reset guided task: ' + t.title, when: today(), kind: 'task' });
    });
  }
  function teaches() { return uniq([].concat.apply([], tasks().map(function (t) { return t.teaches; }))); }
  function taskTeaching(nodeId) {
    var t = tasks().filter(function (x) { return x.teaches.indexOf(nodeId) !== -1; })[0];
    return t ? t.id : null;
  }

  // ---------- assistant gate ----------
  // Finds the concepts a question touches. A question is allowed only if every concept it needs is verified.
  var LANE_HINTS = { py: /\bpython\b|\.py\b|\bpip\b/i, ts: /\btypescript\b|\bjavascript\b|\bts\b|\bnode\.?js\b/i, go: /\bgolang\b|\bin go\b|\bgo (code|program|func)/i };
  function gate(text, defaultLane) {
    var q = ' ' + String(text).toLowerCase() + ' ';
    var lanes = Object.keys(LANE_HINTS).filter(function (l) { return LANE_HINTS[l].test(text); });
    if (!lanes.length && defaultLane) lanes = [defaultLane];
    var groups = {}; // keyword -> node ids it matches
    Object.keys(D.keywords).forEach(function (id) {
      if (lanes.length && lanes.indexOf(NODE[id].lane) === -1) return;
      D.keywords[id].forEach(function (k) {
        var re = new RegExp('(^|[^a-z0-9_])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9_]|$)', 'i');
        if (re.test(q)) { (groups[k] = groups[k] || []).push(id); }
      });
    });
    var needed = [], allowed = [];
    Object.keys(groups).forEach(function (k) {
      var ns = uniq(groups[k]).map(node);
      var ok = ns.filter(function (n) { return n.status === 'verified'; });
      if (ok.length) ok.forEach(function (n) { allowed.push(n.id); });
      else needed.push(ns[0].id);
    });
    return { lanes: lanes, needed: uniq(needed), allowed: uniq(allowed), matched: Object.keys(groups).length > 0 };
  }
  function catalog() {
    return allNodes().map(function (n) { return { id: n.id, name: n.name, lang: n.laneName, verified: n.status === 'verified' }; });
  }

  // ---------- rendering helpers ----------
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function setTheme(dark) {
    if (dark === null || dark === undefined) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
  function isDark() {
    var a = document.documentElement.getAttribute('data-theme');
    if (a) return a === 'dark';
    try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; }
  }
  // Where the page runs: the local server (full features), a plain file, or a hosted copy without the server.
  var isLocal = /^(localhost|127\.0\.0\.1|\[::1])$/.test(location.hostname);
  setTheme(load().dark);

  // Each role sees its own navigation. Developers never get the Team tab.
  var NAV = {
    dev: [['home.html', 'Home'], ['tree.html', 'My tree'], ['challenge.html', 'Challenges'], ['guided-task.html', 'Guided tasks'], ['assistant.html', 'Assistant']],
    manager: [['team.html', 'Team'], ['team.html#set-goal', 'Set a goal']]
  };
  function role() { return load().role || null; }
  function setRole(r) { update(function (s) { s.role = r; }); }
  function homeFor(r) { return r === 'manager' ? 'team.html' : 'home.html'; }
  var LOGO = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#5B5BD6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path d="M8.5 6c5 0 4 6 7 6"/><path d="M8.5 18c5 0 4-6 7-6"/></svg>';
  var MOON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var SUN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

  var GEAR = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';

  // Talks to the local verifAI server (server/server.js). Fails cleanly when the page is opened as a plain file.
  function api(path, opts) {
    opts = opts || {};
    if (location.protocol === 'file:') {
      return Promise.reject(new Error('AI features aren\u2019t available here right now.'));
    }
    if (!isLocal) {
      return Promise.reject(new Error('AI features aren\u2019t available here right now.'));
    }
    return fetch(path, {
      method: opts.method || 'GET',
      headers: opts.body ? { 'Content-Type': 'application/json' } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || ('Request failed (' + res.status + ')'));
        return data;
      });
    }, function () {
      throw new Error('AI features aren\u2019t available here right now. Please try again later.');
    });
  }

  var currentActive = '', currentManager = false;
  function header(active) {
    var el = document.getElementById('rw-header');
    if (!el) return;
    var dark = isDark();
    var asManager = role() === 'manager';
    var who = asManager ? D.manager : D.user;
    var lv = level();
    currentActive = active; currentManager = asManager;
    el.innerHTML =
      '<div class="wrap header-row">' +
      '<a class="logo" href="' + homeFor(role()) + '">' + LOGO + '<span>verif<span class="ai">AI</span></span></a>' +
      (asManager ? '<span class="pill pill-blue">Manager</span>' : '') +
      '<nav class="nav" aria-label="Main">' + NAV[asManager ? 'manager' : 'dev'].map(function (n, i) {
        var on = n[0] === active || (asManager && i === 0 && active === 'team.html');
        return '<a href="' + n[0] + '"' + (on ? ' aria-current="page" class="on"' : '') + '>' + n[1] + '</a>';
      }).join('') + '</nav>' +
      '<div class="header-end">' +
      '<a class="icon-btn" href="settings.html" aria-label="AI provider settings"' + (active === 'settings.html' ? ' aria-current="page" style="border-color:var(--accent);color:var(--accent)"' : '') + '>' + GEAR + '</a>' +
      '<button class="icon-btn" id="rw-theme" aria-label="' + (dark ? 'Switch to light mode' : 'Switch to dark mode') + '">' + (dark ? SUN : MOON) + '</button>' +
      (asManager ? '' : '<a href="home.html#level" class="level-badge" aria-label="Your developer level: ' + lv.num + ', ' + lv.name + '"><span class="mono">Lv ' + lv.num + '</span>' + lv.name + '</a>') +
      '<span class="avatar' + (asManager ? ' avatar-pink' : '') + '">' + who.initials + '</span><span class="who">' + who.name + '</span>' +
      '<a class="btn" href="index.html" style="min-height:40px;padding:0 14px;font-size:13px">Switch role</a>' +
      '</div></div>';
    document.getElementById('rw-theme').addEventListener('click', function () {
      var next = !isDark();
      var s = update(function (s) { s.dark = next; });
      setTheme(s.dark);
      header(active);
    });
  }
  function footer() {
    var el = document.getElementById('rw-footer');
    if (!el) return;
    el.innerHTML = '<div class="wrap footer-row"><span>Demo: sample data, progress saved in this browser only.</span>' +
      '<span style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><a href="architecture.html" style="font-weight:700">System architecture</a>' +
      '<button class="link-btn" id="rw-reset">Reset demo</button></span></div>';
    document.getElementById('rw-reset').addEventListener('click', function () {
      try { localStorage.removeItem(KEY); } catch (e) { }
      memory = null;
      location.reload();
    });
  }
  // opts.role: the only role allowed on this page ('dev' or 'manager'). Without a chosen role, go to the start page.
  function initPage(active, opts) {
    var r = role();
    if (!r) { location.replace('index.html'); return; }
    if (opts && opts.role && opts.role !== r) { location.replace(homeFor(r)); return; }
    document.addEventListener('DOMContentLoaded', function () { header(active); footer(); showLevelUp(); });
  }

  window.RW = {
    D: D, NODE: NODE, LANE: LANE, load: load, update: update, today: today,
    node: node, allNodes: allNodes, laneStats: laneStats, nextUp: nextUp,
    verify: verify, unverify: unverify, goals: goals, addGoal: addGoal, teaches: teaches,
    esc: esc, initPage: initPage, header: header, api: api, level: level, LEVELS: LEVELS,
    LIB: LIB, tasks: tasks, task: task, activeTask: activeTask, setActive: setActive, updateTask: updateTask,
    startTask: startTask, deleteTask: deleteTask, resetTask: resetTask,
    gate: gate, catalog: catalog, isLocal: function () { return isLocal; },
    role: role, setRole: setRole, homeFor: homeFor
  };
})();
