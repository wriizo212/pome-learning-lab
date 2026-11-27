/*
 POME Lab · Mill Arcade games. Five games, five different mechanics:
  - POME Rescue: a real-time storm defence (pick the right tool before incidents expire)
  - Build the Treatment Train: a pipe puzzle you assemble, then run
  - Biogas Mission: a live control room (keep the digester healthy and the power on)
  - POME Manager Challenge: a three-year card strategy game with a budget
  - Quiz Arena: a fast arcade quiz with a timer, lives and combos
 Every game exposes up to four main actions as [data-answer="0..3"] so the keyboard (1-4)
 and the camera gesture controls work in all of them. Numbers are game values for
 learning, not plant data. Written for secondary-school (SMK) learners.
*/
(() => {
  'use strict';
  const games = [
    {id:'rescue', icon:'⛈️', title:'POME Rescue', subtitle:'Storm night: stop the pond overflowing and save the river.'},
    {id:'train', icon:'🧩', title:'Build the Treatment Train', subtitle:'Snap the plant together in the right order, then switch it on.'},
    {id:'biogas', icon:'🎛️', title:'Biogas Mission', subtitle:'Run the control room and keep the power on.'},
    {id:'manager', icon:'🃏', title:'POME Manager Challenge', subtitle:'Three years, one budget: build the best mill.'},
    {id:'arena', icon:'⚡', title:'Quiz Arena', subtitle:'Beat the clock. Build a combo. Keep your lives.'}
  ];

  /* ---------- tiny DOM helpers ---------- */
  function h(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v;
      else if (k === 'style') n.style.cssText = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return n;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = list => { const c = list.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };
  const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
  function meter(label, icon) {
    const fill = h('i'), value = h('b');
    const root = h('div', {class: 'g-meter'}, h('span', {}, icon + ' ' + label), h('div', {class: 'g-bar'}, fill), value);
    return {root, set(v, text, tone) { fill.style.width = clamp(v, 0, 100) + '%'; value.textContent = text ?? Math.round(v) + '%'; root.dataset.tone = tone || ''; }};
  }
  // A simple loop that keeps running while the tab is visible and stops on destroy.
  function loop(step) {
    let last = performance.now(), id = 0, live = true;
    const run = now => { if (!live) return; const dt = Math.min(.25, (now - last) / 1000); last = now; if (!document.hidden) step(dt * (window.__gameSpeed || 1)); /* __gameSpeed: test hook only */ id = requestAnimationFrame(run); };
    id = requestAnimationFrame(run);
    return () => { live = false; cancelAnimationFrame(id); };
  }

  /* =========================================================================
     1. POME RESCUE · storm defence in real time
     ========================================================================= */
  function rescue(root, api) {
    const uses = {small: 3, medium: 4, large: 5}[api.scenario] || 4;
    const S = {t: 0, end: 90, pond: 52, river: 100, storage: uses, cooldown: 0, score: 0, next: 4, active: [], solved: 0, missed: 0, over: false};
    const TOOLS = [
      {icon: '🛢️', name: 'Storage tank', hint: 'Lowers the pond'},
      {icon: '🧽', name: 'Oil skimmer', hint: 'Removes floating oil'},
      {icon: '🧪', name: 'Test kit', hint: 'Measures DO and BOD'},
      {icon: '🧱', name: 'Sludge barrier', hint: 'Stops sludge washing away'}
    ];
    const INCIDENTS = [
      {stage: 'intake', icon: '🛢️', title: 'Oil slick at the inlet', tool: 1, fact: 'Oil floats and stops oxygen getting into water. Skim it early. The oil can even be sold.'},
      {stage: 'river', icon: '🐟', title: 'Fish gasping downstream', tool: 2, fact: 'Test dissolved oxygen (DO) and BOD. Rotting waste uses up the oxygen that fish need.'},
      {stage: 'polish', icon: '🫧', title: 'Brown foam on the basin', tool: 2, fact: 'Foam can mean the bacteria are stressed. Test the water before anything leaves the plant.'},
      {stage: 'sludge', icon: '🟫', title: 'Sludge sliding in the rain', tool: 3, fact: 'Rain can wash sludge into drains. Contain it, so the pollution does not just move somewhere else.'},
      {stage: 'river', icon: '🧑‍🌾', title: 'Villager: “Is the river safe?”', tool: 2, fact: 'Only a test can tell. Clear-looking water can still have a high BOD.'},
      {stage: 'intake', icon: '🧴', title: 'Grease blocking the screen', tool: 1, fact: 'Fat and oil clog pumps and screens. Removing them protects the rest of the plant.'}
    ];
    const pondM = meter('Pond level', '🌊'), riverM = meter('River health', '🐟');
    const clock = h('div', {class: 'g-clock'}), rain = h('div', {class: 'g-rain'});
    const list = h('div', {class: 'rescue-incidents', 'aria-live': 'polite'});
    const tools = TOOLS.map((tool, i) => h('button', {class: 'g-tool', 'data-answer': i, onclick: () => use(i)}, h('kbd', {}, String(i + 1)), h('span', {class: 'g-tool-icon'}, tool.icon), h('b', {}, tool.name), h('small', {}, tool.hint)));
    const storeLabel = h('em');
    tools[0].append(storeLabel);
    root.append(h('div', {class: 'g-hud rescue-hud'}, clock, rain), h('div', {class: 'g-meters'}, pondM.root, riverM.root), list, h('div', {class: 'g-tools'}, tools));
    api.focus('intake');
    function spawn(kind) {
      const pick = kind || shuffle(INCIDENTS.filter(x => !S.active.some(a => a.title === x.title)))[0];
      if (!pick) return;
      const card = h('div', {class: 'rescue-card'}, h('span', {class: 'rescue-icon'}, pick.icon), h('b', {}, pick.title), h('i', {class: 'rescue-timer'}));
      const item = {...pick, left: pick.urgent ? 7 : 9, total: pick.urgent ? 7 : 9, card};
      S.active.push(item); list.append(card); api.focus(pick.stage); api.sound('alarm');
    }
    function solve(item) {
      S.active.splice(S.active.indexOf(item), 1); S.solved++; S.score += 100 + Math.round(item.left * 10);
      item.card.classList.add('solved'); setTimeout(() => item.card.remove(), 450);
      api.feedback('✔ ' + item.fact, 'good'); api.sound('good'); api.log(TOOLS[item.tool].name + ' → ' + item.title, true, item.fact);
    }
    function use(i) {
      if (S.over) return;
      const need = S.active.find(a => a.tool === i);
      if (i === 0) {
        if (S.storage <= 0 || S.cooldown > 0) { api.feedback(S.storage <= 0 ? 'The storage tank is full. Keep the river safe with your other tools.' : 'The pump is still moving water. Wait a moment.', 'bad'); api.sound('bad'); return; }
        S.storage--; S.cooldown = 6; S.pond = Math.max(0, S.pond - 24); api.sound('good');
        if (need) solve(need); else api.feedback('Water pumped into the storage tank. The pond has room again.', 'good');
        return;
      }
      if (need) { solve(need); return; }
      S.river = Math.max(0, S.river - 3); api.sound('bad');
      api.feedback('Nothing needs the ' + TOOLS[i].name.toLowerCase() + ' right now. Read the alerts first.', 'bad');
    }
    const stop = loop(dt => {
      if (S.over) return;
      S.t += dt; S.cooldown = Math.max(0, S.cooldown - dt);
      const storm = .55 + .9 * (S.t / S.end) + (Math.sin(S.t * .7) > .85 ? .8 : 0);
      S.pond += storm * dt * 1.15;
      if (S.pond >= 100) { S.pond = 100; S.river -= 5 * dt; riverM.root.classList.add('shake'); } else riverM.root.classList.remove('shake');
      if (S.pond > 86 && !S.active.some(a => a.tool === 0)) spawn({stage: 'intake', icon: '🌊', title: 'Pond almost full!', tool: 0, urgent: true, fact: 'Storage buys time in a storm. An overflow sends untreated POME straight to the river.'});
      S.next -= dt; if (S.next <= 0) { spawn(); S.next = 8 + Math.random() * 4 - S.t / 30; }
      for (const a of S.active.slice()) {
        a.left -= dt; a.card.querySelector('.rescue-timer').style.setProperty('--p', clamp(a.left / a.total, 0, 1));
        if (a.left <= 0) {
          S.active.splice(S.active.indexOf(a), 1); S.missed++; S.river -= a.tool === 0 ? 8 : 12; a.card.classList.add('missed'); setTimeout(() => a.card.remove(), 450);
          api.feedback('✖ Too late: ' + a.title.toLowerCase() + '. ' + a.fact, 'bad'); api.sound('bad'); api.log('Missed: ' + a.title, false, a.fact);
        }
      }
      S.river = clamp(S.river, 0, 100);
      pondM.set(S.pond, Math.round(S.pond) + '%', S.pond > 86 ? 'bad' : S.pond > 70 ? 'warn' : '');
      riverM.set(S.river, Math.round(S.river) + '%', S.river < 40 ? 'bad' : S.river < 70 ? 'warn' : 'good');
      const left = Math.max(0, Math.ceil(S.end - S.t));
      clock.textContent = '⏱ Storm ends in 0:' + String(left).padStart(2, '0');
      rain.textContent = storm > 1.4 ? '🌧️🌧️🌧️ Heavy rain' : storm > 1 ? '🌧️🌧️ Rain' : '🌦️ Drizzle';
      storeLabel.textContent = S.cooldown > 0 ? 'pumping…' : S.storage + ' left';
      tools[0].disabled = S.storage <= 0;
      api.model({success: S.river >= 45, storm: clamp(.35 + .65 * S.t / S.end, 0, 1)});
      api.progress('Storm ' + Math.round(S.t / S.end * 100) + '% · Score ' + S.score, Math.min(5, 1 + Math.floor(S.t / S.end * 5)), 5);
      if (S.t >= S.end || S.river <= 0) end();
    });
    function end() {
      S.over = true; stop(); api.model({storm: 0});
      const n = S.river >= 75 ? 3 : S.river >= 45 ? 2 : S.river > 0 ? 1 : 0;
      api.sound(n >= 2 ? 'win' : 'bad');
      api.finish(`${stars(n)} River health ${Math.round(S.river)}% · ${S.solved} alerts solved, ${S.missed} missed · score ${S.score}.`,
        n >= 2 ? 'You kept the river alive through the storm. Ponds have little spare room, which is why storage and quick action matter.' : 'The river suffered. Open ponds overflow in storms; covered tanks and storage give the plant more control.');
    }
    return {key: use, state: () => ({locked: S.over, finished: S.over}), destroy: () => { S.over = true; stop(); api.model({storm: 0}); }};
  }

  /* =========================================================================
     2. BUILD THE TREATMENT TRAIN · pipe puzzle, then run it
     ========================================================================= */
  function train(root, api) {
    const TILES = {
      screen: {icon: '🧹', name: 'Screen & oil trap', line: 'water', at: 0, stage: 'intake', fact: 'Screens catch fibre and shell; the oil trap skims oil. Both protect the pumps.'},
      cool: {icon: '❄️', name: 'Cooling tank', line: 'water', at: 1, stage: 'intake', fact: 'Raw POME is about 80 °C. The digester bacteria like it near 37 °C, so it is cooled first.'},
      digester: {icon: '🦠', name: 'UASB digester', line: 'water', at: 2, stage: 'digester', fact: 'No air inside: bacteria eat the waste and make biogas. Most of the pollution goes here.'},
      aeration: {icon: '💨', name: 'Aeration basin', line: 'water', at: 3, stage: 'polish', fact: 'Air bubbles feed other bacteria that clean up what is left, so the water is safe to release or reuse.'},
      scrubber: {icon: '🧽', name: 'H₂S scrubber', line: 'gas', at: 0, stage: 'gas', fact: 'Hydrogen sulphide smells of rotten eggs and corrodes engines. Scrub it out first.'},
      engine: {icon: '⚡', name: 'Gas engine', line: 'gas', at: 1, stage: 'gas', fact: 'Burning the methane turns a greenhouse gas into electricity for the mill.'},
      press: {icon: '🗜️', name: 'Screw press', line: 'sludge', at: 0, stage: 'sludge', fact: 'Squeezes water out of the sludge so it is lighter and easier to handle.'},
      compost: {icon: '🌱', name: 'Compost with EFB', line: 'sludge', at: 1, stage: 'sludge', fact: 'Sludge mixed with empty fruit bunches becomes fertiliser for the palms, after a quality check.'},
      river: {icon: '🚫', name: 'Pipe to river', decoy: true, fact: 'Never! Raw POME would use up the river’s oxygen and kill the fish.'},
      pond: {icon: '🌫️', name: 'Open-air pond', decoy: true, fact: 'Open ponds let methane escape to the air. This plant captures it instead.'}
    };
    const LINES = [
      {id: 'water', label: '💧 Water line', start: '🔥 Raw POME', end: '🏞️ Clean water', slots: 4},
      {id: 'gas', label: '🔥 Gas line', start: '🦠 from digester', end: '🏭 Mill power', slots: 2},
      {id: 'sludge', label: '🟫 Sludge line', start: '🦠 from tanks', end: '🌴 Palms', slots: 2}
    ];
    const placed = {}; let selected = null, runs = 0, running = false, done = false;
    const tray = h('div', {class: 'train-tray', 'aria-label': 'Station tiles'});
    const cod = h('div', {class: 'train-cod'}, h('span', {}, 'Pollution (COD)'), h('b', {}, '—'));
    const board = h('div', {class: 'train-board'});
    const slotEls = {};
    for (const line of LINES) {
      const row = h('div', {class: 'train-line', 'data-line': line.id}, h('span', {class: 'train-label'}, line.label), h('span', {class: 'train-end'}, line.start));
      for (let i = 0; i < line.slots; i++) {
        const slot = h('button', {class: 'train-slot', 'aria-label': line.label + ' slot ' + (i + 1), onclick: () => place(line.id, i)}, h('span', {class: 'train-pipe'}));
        slot.addEventListener('dragover', e => e.preventDefault());
        slot.addEventListener('drop', e => { e.preventDefault(); selected = e.dataTransfer.getData('text/plain') || selected; place(line.id, i); });
        slotEls[line.id + i] = slot; row.append(slot);
      }
      row.append(h('span', {class: 'train-end'}, line.end)); board.append(row);
    }
    const tileEls = {};
    for (const id of shuffle(Object.keys(TILES))) {
      const t = TILES[id];
      const tile = h('button', {class: 'train-tile', draggable: 'true', 'data-tile': id, onclick: () => select(id)}, h('span', {}, t.icon), t.name);
      tile.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', id); select(id); });
      tileEls[id] = tile; tray.append(tile);
    }
    const buttons = [
      h('button', {class: 'g-cta', 'data-answer': 0, onclick: run}, h('kbd', {}, '1'), '▶ Switch the plant on'),
      h('button', {class: 'g-ghost', 'data-answer': 1, onclick: hint}, h('kbd', {}, '2'), '💡 Hint'),
      h('button', {class: 'g-ghost', 'data-answer': 2, onclick: clearWrong}, h('kbd', {}, '3'), '↺ Clear red tiles')
    ];
    root.append(h('p', {class: 'g-tip'}, 'Tap a tile, then tap an empty slot (or drag it). Two tiles are traps!'), board, cod, tray, h('div', {class: 'g-row'}, buttons));
    function select(id) {
      if (running || done) return; selected = selected === id ? null : id;
      Object.entries(tileEls).forEach(([k, el]) => el.classList.toggle('picked', k === selected));
      if (selected) api.focus(TILES[selected].stage || 'intake');
    }
    function place(line, i) {
      if (running || done) return;
      const key = line + i, current = placed[key];
      if (slotEls[key].classList.contains('ok')) return;
      if (!selected) { if (current) { tray.append(tileEls[current]); delete placed[key]; render(); } return; }
      for (const [k, v] of Object.entries(placed)) if (v === selected) delete placed[k];
      if (current) tray.append(tileEls[current]);
      placed[key] = selected; slotEls[key].classList.remove('bad'); slotEls[key].append(tileEls[selected]); tileEls[selected].classList.remove('picked'); selected = null; api.sound('tick'); render();
    }
    function render() { for (const [k, el] of Object.entries(slotEls)) el.classList.toggle('filled', !!placed[k]); }
    function clearWrong() { for (const [k, el] of Object.entries(slotEls)) if (el.classList.contains('bad')) { tray.append(tileEls[placed[k]]); delete placed[k]; el.classList.remove('bad'); } render(); }
    function hint() {
      for (const line of LINES) for (let i = 0; i < line.slots; i++) {
        const k = line.id + i, want = Object.keys(TILES).find(id => TILES[id].line === line.id && TILES[id].at === i);
        if (placed[k] !== want) { api.feedback('💡 ' + line.label.slice(2) + ', step ' + (i + 1) + ': ' + TILES[want].fact, ''); slotEls[k].classList.add('glow'); setTimeout(() => slotEls[k].classList.remove('glow'), 1600); api.focus(TILES[want].stage); return; }
      }
    }
    const wait = ms => new Promise(r => setTimeout(r, ms));
    async function run() {
      if (running || done) return;
      running = true; runs++; let ok = true; const values = [50000, 46000, 45000, 6000, 250];
      cod.querySelector('b').textContent = '50,000 mg/L';
      for (const line of LINES) {
        for (let i = 0; i < line.slots; i++) {
          const k = line.id + i, id = placed[k], slot = slotEls[k];
          slot.classList.add('flow'); await wait(380); slot.classList.remove('flow');
          const t = TILES[id];
          if (!id || t.decoy || t.line !== line.id || t.at !== i) {
            ok = false; slot.classList.add('bad'); api.sound('bad'); api.focus(line.id === 'water' ? 'intake' : line.id);
            api.feedback(!id ? 'The ' + line.label.slice(2).toLowerCase() + ' has a gap: water spills out!' : t.decoy ? '✖ ' + t.fact : '✖ The ' + t.name + ' is in the wrong place. ' + (t.line !== line.id ? 'It belongs on the ' + t.line + ' line.' : 'Think about what has to happen before it.'), 'bad');
            api.log(id ? TILES[id].name + ' in ' + line.id + ' slot ' + (i + 1) : 'Empty ' + line.id + ' slot ' + (i + 1), false, 'Wrong or missing station');
            break;
          }
          if (!slot.classList.contains('ok')) { slot.classList.add('ok'); tileEls[id].disabled = true; api.feedback('✔ ' + t.name + ': ' + t.fact, 'good'); api.log(t.name + ' connected', true, t.fact); }
          api.focus(t.stage); api.sound('tick');
          if (line.id === 'water') cod.querySelector('b').textContent = values[i + 1].toLocaleString() + ' mg/L';
          await wait(500);
        }
        if (!ok) break;
      }
      running = false;
      api.progress('Runs ' + runs + ' · ' + document.querySelectorAll('.train-slot.ok').length + ' / 8 connected', document.querySelectorAll('.train-slot.ok').length, 8);
      if (ok) {
        done = true; api.sound('win'); api.focus('river'); api.model({success: true});
        const n = runs === 1 ? 3 : runs <= 3 ? 2 : 1;
        api.finish(`${stars(n)} The plant runs! Built in ${runs} ${runs === 1 ? 'try' : 'tries'}. COD fell from 50,000 to about 250 mg/L in this game.`, 'Order matters: clean and cool first, digest without air, then polish with air. Gas and sludge become energy and fertiliser.');
      }
    }
    api.progress('0 / 8 connected', 0, 8); api.focus('intake');
    return {key(i) { buttons[i]?.click(); }, state: () => ({locked: running, finished: done}), destroy() { done = true; }};
  }

  /* =========================================================================
     3. BIOGAS MISSION · live control room
     ========================================================================= */
  function biogas(root, api) {
    const S = {t: 0, limit: 150, feed: 27, acid: 1.7, temp: 37, set: 37, scrub: false, health: 100, lime: 0, stable: 0, need: 40, over: false, events: [{at: 18, done: false}, {at: 45, done: false}], hist: []};
    const TARGET = 650;
    function gauge(label, unit, min, max, lo, hi) {
      const needle = h('i', {class: 'gauge-needle'}), val = h('b');
      const g = h('div', {class: 'gauge'}, h('div', {class: 'gauge-dial', style: `--lo:${(lo - min) / (max - min)};--hi:${(hi - min) / (max - min)}`}, needle), val, h('span', {}, label));
      return {root: g, set(v) { needle.style.transform = `rotate(${-90 + 180 * clamp((v - min) / (max - min), 0, 1)}deg)`; val.textContent = (Math.abs(v) < 20 ? v.toFixed(1) : Math.round(v)) + unit; g.dataset.tone = v >= lo && v <= hi ? 'good' : 'bad'; }};
    }
    const gPH = gauge('pH', '', 5.5, 8, 6.8, 7.5), gT = gauge('Temperature', ' °C', 25, 50, 34, 40), gGas = gauge('Biogas', ' m³/h', 0, 450, 300, 450), gP = gauge('Power', ' kW', 0, 900, TARGET, 900);
    const health = meter('Engine health', '🔧'), stable = meter('Stable time', '✅');
    const chart = h('canvas', {class: 'bio-chart', width: 520, height: 90, 'aria-label': 'Power over time'});
    const alarm = h('div', {class: 'bio-alarm', 'aria-live': 'polite'});
    const feedOut = h('b'), heat = h('input', {type: 'range', min: 30, max: 42, step: .5, value: 37, 'aria-label': 'Heater set point'}), heatOut = h('b', {}, '37 °C');
    heat.oninput = () => { S.set = +heat.value; heatOut.textContent = S.set + ' °C'; };
    const btn = [
      h('button', {class: 'g-tool', 'data-answer': 0, onclick: () => feed(-1)}, h('kbd', {}, '1'), h('span', {class: 'g-tool-icon'}, '⬇️'), h('b', {}, 'Less feed')),
      h('button', {class: 'g-tool', 'data-answer': 1, onclick: () => feed(1)}, h('kbd', {}, '2'), h('span', {class: 'g-tool-icon'}, '⬆️'), h('b', {}, 'More feed')),
      h('button', {class: 'g-tool', 'data-answer': 2, onclick: lime}, h('kbd', {}, '3'), h('span', {class: 'g-tool-icon'}, '🧂'), h('b', {}, 'Add lime'), h('small', {}, 'raises pH')),
      h('button', {class: 'g-tool', 'data-answer': 3, onclick: scrub}, h('kbd', {}, '4'), h('span', {class: 'g-tool-icon'}, '🧽'), h('b', {}, 'Scrubber'), h('small', {}, 'off'))
    ];
    root.append(alarm, h('div', {class: 'bio-gauges'}, gPH.root, gT.root, gGas.root, gP.root),
      h('div', {class: 'bio-controls'}, h('label', {}, 'Feed ', feedOut, ' m³/h'), h('label', {}, '🔥 Heater ', heat, heatOut)),
      h('div', {class: 'g-tools'}, btn), chart, h('div', {class: 'g-meters'}, health.root, stable.root));
    api.focus('digester');
    function feed(d) { if (S.over) return; S.feed = clamp(S.feed + d, 0, 34); api.sound('tick'); }
    function lime() { if (S.over) return; if (S.lime > 0) { api.feedback('The lime is still mixing in. Wait a few seconds.', 'bad'); return; } S.acid = Math.max(0, S.acid - .7); S.lime = 6; api.sound('good'); api.feedback('🧂 Lime added: it neutralises acid, so the pH goes up. It does not fix overfeeding.', 'good'); api.log('Added lime', true, 'Lime buffers acid in the digester.'); }
    function scrub() { if (S.over) return; S.scrub = !S.scrub; btn[3].querySelector('small').textContent = S.scrub ? 'on' : 'off'; btn[3].classList.toggle('on', S.scrub); api.focus('gas'); api.sound(S.scrub ? 'good' : 'tick'); if (S.scrub) { api.feedback('🧽 Scrubber on: H₂S is removed before it reaches the engine.', 'good'); api.log('Scrubber switched on', true, 'H₂S corrodes engines.'); } }
    const ctx = chart.getContext('2d');
    function draw() {
      const w = chart.width, hh = chart.height; ctx.clearRect(0, 0, w, hh);
      ctx.fillStyle = 'rgba(215,248,142,.12)'; const ty = hh - TARGET / 900 * hh; ctx.fillRect(0, 0, w, ty);
      ctx.strokeStyle = 'rgba(215,248,142,.7)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(w, ty); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 2; ctx.beginPath();
      S.hist.forEach((p, i) => { const x = i / 119 * w, y = hh - clamp(p / 900, 0, 1) * hh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.fillStyle = '#c3d6bf'; ctx.font = '11px system-ui'; ctx.fillText('target ' + TARGET + ' kW', 6, Math.max(12, ty - 4));
    }
    let tick = 0;
    const stop = loop(dt => {
      if (S.over) return;
      S.t += dt; S.lime = Math.max(0, S.lime - dt);
      const cap = 20;
      S.acid = clamp(S.acid + (S.feed - cap) / cap * .32 * dt, 0, 3.2);
      S.temp += (S.set - S.temp) * .12 * dt;
      for (const [i, e] of S.events.entries()) if (!e.done && S.t >= e.at) {
        e.done = true;
        if (i === 0) { S.feed = clamp(S.feed + 5, 0, 34); alarmMsg('🚚 The mill is busy: a surge of POME just arrived (feed +5).'); }
        else { S.temp -= 6; alarmMsg('🌧️ Cold rain cooled the tank by 6 °C. Turn up the heater?'); }
      }
      const pH = clamp(7.4 - .45 * S.acid, 5.5, 7.6);
      const tf = clamp(1 - Math.abs(S.temp - 37) / 10, 0, 1), pf = pH >= 6.8 ? 1 : pH <= 6 ? .1 : .1 + .9 * (pH - 6) / .8;
      const act = tf * pf, gas = Math.min(S.feed, cap * 1.1) * act * 18;
      if (!S.scrub) S.health = Math.max(0, S.health - 1.3 * dt);
      const power = gas * 2 * (S.health / 100);
      const ok = power >= TARGET && pH >= 6.8 && pH <= 7.5 && S.scrub;
      if (ok) S.stable += dt;
      gPH.set(pH); gT.set(S.temp); gGas.set(gas); gP.set(power);
      health.set(S.health, Math.round(S.health) + '%', S.health < 40 ? 'bad' : S.health < 75 ? 'warn' : 'good');
      stable.set(S.stable / S.need * 100, Math.floor(S.stable) + ' / ' + S.need + ' s', 'good');
      feedOut.textContent = S.feed;
      if ((tick += dt) > .5) {
        tick = 0; S.hist.push(power); if (S.hist.length > 120) S.hist.shift(); draw();
        if (!alarm.dataset.hold) alarm.textContent = pH < 6.8 ? '🚨 pH is falling: acids are building up. The bacteria are being overfed.' : !S.scrub ? '🚨 H₂S alarm: the engine is corroding. Switch the scrubber on.' : Math.abs(S.temp - 37) > 3 ? '🌡️ The tank is ' + (S.temp < 37 ? 'too cold' : 'too hot') + ' for the bacteria.' : power < TARGET ? '⚡ Power is below target. Can the digester take a little more feed?' : '✅ Stable. Keep it steady!';
        alarm.dataset.tone = ok ? 'good' : 'bad';
      }
      api.model({success: pH >= 6.8, alarm: !ok});
      api.progress('Time ' + Math.ceil(S.limit - S.t) + ' s · stable ' + Math.floor(S.stable) + ' / ' + S.need + ' s', Math.min(5, 1 + Math.floor(S.stable / S.need * 4)), 5);
      if (S.stable >= S.need) end(true); else if (S.t >= S.limit || S.health <= 0) end(false);
    });
    function alarmMsg(text) { alarm.textContent = text; alarm.dataset.hold = '1'; api.sound('alarm'); setTimeout(() => delete alarm.dataset.hold, 3500); }
    function end(win) {
      S.over = true; stop(); api.model({alarm: false});
      const n = win ? (S.t < 80 ? 3 : S.t < 120 ? 2 : 1) : 0;
      api.sound(win ? 'win' : 'bad'); api.log(win ? 'Power restored' : 'Mission failed', win, '');
      api.finish(win ? `${stars(n)} Power restored in ${Math.round(S.t)} s · engine health ${Math.round(S.health)}%.` : `☆☆☆ ${S.health <= 0 ? 'The engine corroded: the H₂S was never scrubbed.' : 'Time ran out before the digester was stable.'}`,
        'A digester is alive: overfeeding makes acid, cold slows the bacteria, and H₂S damages engines. Steady feeding gives steady power.');
    }
    return {key(i) { btn[i]?.click(); }, state: () => ({locked: false, finished: S.over}), destroy: () => { S.over = true; stop(); api.model({alarm: false}); }};
  }

  /* =========================================================================
     4. POME MANAGER CHALLENGE · three-year card strategy
     ========================================================================= */
  function manager(root, api) {
    const budget = {small: 4, medium: 6, large: 9}[api.scenario] || 6;
    const CARDS = {
      cover: {icon: '⛺', name: 'Cover the ponds', cost: 2, fx: {climate: 18, people: 10}, stage: 'digester', text: 'Catch methane under a cover instead of letting it escape.'},
      uasb: {icon: '🦠', name: 'UASB digester', cost: 4, fx: {river: 18, climate: 15, people: 6}, stage: 'digester', text: 'A closed tank that cleans faster and captures biogas.'},
      engine: {icon: '⚡', name: 'Biogas engine', cost: 2, needs: ['cover', 'uasb'], income: 3, fx: {climate: 6}, stage: 'gas', text: 'Turns captured methane into electricity. Earns money every year.'},
      aeration: {icon: '💨', name: 'Aeration polishing', cost: 3, fx: {river: 20}, stage: 'polish', text: 'Air and bacteria finish the clean-up before discharge.'},
      membrane: {icon: '🔬', name: 'Water reuse (UF/RO)', cost: 4, needs: ['aeration'], income: 2, fx: {river: 8, people: 6}, stage: 'polish', text: 'Filters treated water so the mill can reuse it. Needs polishing first.'},
      compost: {icon: '🌱', name: 'EFB compost yard', cost: 2, income: 1, fx: {river: 4, people: 8, climate: 4}, stage: 'sludge', text: 'Sludge + empty fruit bunches → fertiliser for the palms.'},
      training: {icon: '🎓', name: 'Train the operators', cost: 1, fx: {people: 6}, stage: 'intake', text: 'Skilled staff keep digesters stable and spot problems early.'},
      lab: {icon: '🧪', name: 'Water-testing lab', cost: 1, fx: {river: 6}, stage: 'river', text: 'Regular tests catch pollution before the inspector does.'}
    };
    const EVENTS = [
      {icon: '🕵️', name: 'DOE inspection', run: s => s.has.lab || s.m.river >= 60 ? ['Passed! The river samples meet the limit.', {people: 8}] : ['Failed. The mill is fined for polluting the river.', {money: -15, people: -8}]},
      {icon: '💡', name: 'Electricity price rises', run: s => s.has.engine ? ['Your biogas engine saves money on the power bill.', {money: 10}] : ['The power bill goes up.', {money: -10}]},
      {icon: '👃', name: 'Neighbours complain about smell', run: s => s.has.cover || s.has.uasb ? ['Covered tanks keep the smell in. Complaint closed.', {people: 4}] : ['Open ponds smell. The village is unhappy.', {people: -15}]},
      {icon: '☀️', name: 'Dry season', run: s => s.has.membrane ? ['Reused water keeps the mill running.', {money: 10}] : ['River water is scarce; the mill buys water.', {money: -6}]},
      {icon: '🧯', name: 'Digester upset', run: s => !s.has.uasb ? ['Nothing to upset this year.', {}] : s.has.training ? ['Your trained crew spotted it early.', {river: 4}] : ['Untrained staff overfed the digester. It turned sour.', {river: -10, climate: -6}]},
      {icon: '🌴', name: 'Fertiliser price rises', run: s => s.has.compost ? ['Your compost saves money on fertiliser.', {money: 8}] : ['The estate pays more for fertiliser.', {money: -5}]}
    ];
    const S = {year: 1, coins: budget, m: {river: 40, climate: 30, money: 50, people: 50}, has: {}, hand: [], over: false, events: shuffle(EVENTS)};
    const meters = {river: meter('River', '🐟'), climate: meter('Climate', '🌍'), money: meter('Money', '💰'), people: meter('People', '👥')};
    const coins = h('div', {class: 'mgr-coins'}), yearEl = h('div', {class: 'mgr-year'});
    const hand = h('div', {class: 'mgr-hand'}), built = h('div', {class: 'mgr-built'});
    const endBtn = h('button', {class: 'g-cta', onclick: endYear}, '⏭ End the year');
    root.append(h('div', {class: 'g-hud'}, yearEl, coins), h('div', {class: 'g-meters four'}, Object.values(meters).map(x => x.root)), hand, h('div', {class: 'g-row'}, endBtn), built);
    const apply = fx => { for (const [k, v] of Object.entries(fx || {})) S.m[k] = clamp(S.m[k] + v, 0, 100); };
    function deal() {
      const pool = shuffle(Object.keys(CARDS).filter(k => !S.has[k]));
      S.hand = pool.slice(0, 4); render();
    }
    function play(i) {
      if (S.over) return;
      const id = S.hand[i], c = CARDS[id]; if (!c) return;
      if (c.needs && !c.needs.some(n => S.has[n])) { api.feedback('🔒 ' + c.name + ' needs ' + c.needs.map(n => CARDS[n].name).join(' or ') + ' first.', 'bad'); api.sound('bad'); return; }
      if (c.cost > S.coins) { api.feedback('Not enough budget. Save it for next year, or pick a cheaper card.', 'bad'); api.sound('bad'); return; }
      S.coins -= c.cost; S.has[id] = true; apply(c.fx); S.hand.splice(i, 1); api.focus(c.stage); api.sound('good');
      api.feedback('✔ Built: ' + c.name + '. ' + c.text, 'good'); api.log('Year ' + S.year + ': built ' + c.name, true, c.text);
      api.model({pathway: S.has.uasb || S.has.cover ? 'uasb' : 'pond'});
      render();
    }
    function endYear() {
      if (S.over) return;
      const income = Object.keys(S.has).reduce((n, k) => n + (CARDS[k].income || 0), 0);
      if (income) S.m.money = clamp(S.m.money + income * 4, 0, 100);
      const e = S.events[S.year - 1], [msg, fx] = e.run(S); apply(fx);
      const good = Object.values(fx).reduce((a, b) => a + b, 0) >= 0;
      api.feedback(`${e.icon} ${e.name}: ${msg}${income ? ' Income from your plant: +' + income * 4 + ' money.' : ''}`, good ? 'good' : 'bad');
      api.sound(good ? 'good' : 'bad'); api.log('Year ' + S.year + ' event: ' + e.name, good, msg);
      if (S.year === 3) return finish();
      S.year++; S.coins += budget; deal();
    }
    function render() {
      yearEl.textContent = '📅 Year ' + S.year + ' of 3';
      coins.textContent = '🪙 Budget ' + S.coins + ' (+' + budget + ' a year)';
      for (const [k, x] of Object.entries(meters)) x.set(S.m[k], Math.round(S.m[k]), S.m[k] < 35 ? 'bad' : S.m[k] < 55 ? 'warn' : 'good');
      hand.replaceChildren(...S.hand.map((id, i) => {
        const c = CARDS[id], locked = c.needs && !c.needs.some(n => S.has[n]);
        const fx = Object.entries(c.fx).map(([k, v]) => ({river: '🐟', climate: '🌍', money: '💰', people: '👥'}[k] + '+' + v)).concat(c.income ? ['💰+' + c.income * 4 + '/yr'] : []).join('  ');
        return h('button', {class: 'mgr-card' + (locked ? ' locked' : '') + (c.cost > S.coins ? ' poor' : ''), 'data-answer': i, onclick: () => play(i)},
          h('kbd', {}, String(i + 1)), h('span', {class: 'mgr-cost'}, '🪙' + c.cost), h('span', {class: 'mgr-icon'}, c.icon), h('b', {}, c.name), h('small', {}, c.text), h('em', {}, locked ? '🔒 needs ' + c.needs.map(n => CARDS[n].name).join(' / ') : fx));
      }));
      built.replaceChildren(h('span', {}, 'Your plant: '), ...(Object.keys(S.has).length ? Object.keys(S.has).map(k => h('i', {}, CARDS[k].icon + ' ' + CARDS[k].name)) : [h('i', {}, 'open ponds only')]));
      api.progress('Year ' + S.year + ' / 3 · ' + Object.keys(S.has).length + ' upgrades', S.year, 3);
    }
    function finish() {
      S.over = true; endBtn.disabled = true; render();
      const avg = (S.m.river + S.m.climate + S.m.money + S.m.people) / 4, low = Math.min(...Object.values(S.m));
      const n = low >= 55 ? 3 : low >= 40 ? 2 : 1;
      const path = (S.has.uasb || S.has.cover) && S.has.engine && (S.has.membrane || S.has.compost) ? 'an integrated recovery plant' : S.has.uasb || S.has.cover ? 'a biogas plant (UASB/covered ponds)' : 'conventional open ponds';
      api.sound(n >= 2 ? 'win' : 'bad');
      api.finish(`${stars(n)} You built ${path}. River ${S.m.river} · Climate ${S.m.climate} · Money ${S.m.money} · People ${S.m.people} (average ${Math.round(avg)}).`,
        n === 3 ? 'The board approves! You balanced the river, the climate, money and people, often by upgrading step by step.' : 'The board wants a better balance. A staged plan (cover or digester first, then the engine, then polishing and reuse) usually scores better.');
    }
    deal(); api.focus('intake');
    return {key: play, state: () => ({locked: false, finished: S.over}), destroy: () => { S.over = true; }};
  }

  /* =========================================================================
     5. QUIZ ARENA · timer, lives, combos
     ========================================================================= */
  const BANK = [
    ['What does POME stand for?', ['Palm oil mill effluent', 'Plant oil made easy', 'Palm orchard mineral earth', 'Pure oil mill energy'], 'POME is the wastewater from palm oil mills.', 'intake'],
    ['Why is raw POME harmful to a river?', ['Bacteria eating it use up the oxygen fish need', 'It is too cold', 'It has no colour', 'It contains too much oxygen'], 'High BOD means bacteria will use lots of dissolved oxygen.', 'river'],
    ['Hot POME leaves the mill at about…', ['80 °C', '10 °C', '37 °C', '150 °C'], 'It comes from steam sterilisation, so it is very hot.', 'intake'],
    ['Which gas in biogas burns to make electricity?', ['Methane (CH₄)', 'Oxygen (O₂)', 'Nitrogen (N₂)', 'Helium (He)'], 'Methane burns in the engine to drive a generator.', 'gas'],
    ['True or false: an open pond lets methane escape to the air.', ['True', 'False'], 'True. Methane is a strong greenhouse gas, so capturing it helps the climate.', 'digester'],
    ['A UASB digester works…', ['Without air', 'With lots of air', 'Only in sunlight', 'Only when frozen'], 'Anaerobic means “without air”. Those bacteria make biogas.', 'digester'],
    ['Why do we bubble air into the aeration basin?', ['Bacteria there need oxygen to clean the water', 'To make it fizzy to drink', 'To cool the mill', 'To make more biogas'], 'Aerobic bacteria use oxygen to break down what is left.', 'polish'],
    ['Which smell warns of hydrogen sulphide (H₂S)?', ['Rotten eggs', 'Roses', 'Fresh bread', 'No smell at all'], 'H₂S smells of rotten eggs and corrodes engines.', 'gas'],
    ['True or false: clear water is always clean water.', ['True', 'False'], 'False. Only a test (such as BOD) shows how polluted it is.', 'river'],
    ['What can the sludge become after composting with EFB?', ['Fertiliser for the palms', 'Cooking oil', 'Drinking water', 'Plastic'], 'Composted sludge returns nutrients to the plantation after a quality check.', 'sludge'],
    ['What does BOD measure?', ['How much oxygen bacteria need to break down the waste', 'How blue the water is', 'How deep the pond is', 'How fast the river flows'], 'BOD = biochemical oxygen demand.', 'river'],
    ['Why cool POME before the digester?', ['The bacteria work best around 37 °C', 'To freeze the oil', 'To make it heavier', 'It does not need cooling'], 'Too hot and the microbes stop working.', 'intake'],
    ['If the flow of POME doubles, the pollution load each day…', ['Doubles', 'Halves', 'Stays the same', 'Disappears'], 'Load = flow × concentration.', 'intake'],
    ['True or false: reusing treated water saves river water.', ['True', 'False'], 'True, as long as its quality suits the job.', 'polish'],
    ['Which is a resource we can recover from POME?', ['Biogas energy', 'Gold', 'Sea salt', 'Petrol'], 'Biogas, reused water and fertiliser can all be recovered.', 'gas'],
    ['What happens if a digester is overfed?', ['Acids build up and the pH falls', 'It makes more oxygen', 'It turns into ice', 'Nothing at all'], 'Too much food at once turns the digester sour.', 'digester'],
    ['Which group in Malaysia sets the limits for what mills discharge?', ['Department of Environment (DOE)', 'The football association', 'The weather office', 'The post office'], 'The DOE sets discharge limits such as BOD.', 'river'],
    ['Best first step before releasing treated water?', ['Test it against the limits', 'Check its colour only', 'Smell it', 'Release it at night'], 'Decisions need measurements.', 'river']
  ];
  function arena(root, api) {
    const qs = shuffle(BANK).slice(0, 10).map(([q, opts, why, stage]) => ({q, why, stage, options: shuffle(opts.map((label, i) => ({label, ok: i === 0})))}));
    const S = {i: 0, lives: 3, streak: 0, score: 0, best: +(localStorage.getItem('pome-arena-best') || 0), left: 12, locked: false, over: false};
    const hud = h('div', {class: 'g-hud arena-hud'}), timer = h('div', {class: 'arena-timer'}, h('i')), question = h('h3', {class: 'arena-q'}), opts = h('div', {class: 'arena-opts'}), combo = h('div', {class: 'arena-combo'});
    root.append(hud, timer, question, opts, combo);
    function show() {
      const q = qs[S.i]; S.left = 12; S.locked = false; api.focus(q.stage); api.feedback('');
      question.textContent = q.q;
      opts.replaceChildren(...q.options.map((o, i) => h('button', {class: 'arena-opt', 'data-answer': i, onclick: () => answer(i)}, h('kbd', {}, String(i + 1)), o.label)));
      paint();
    }
    function paint() {
      hud.replaceChildren(h('span', {}, '❤️'.repeat(S.lives) + '🖤'.repeat(3 - S.lives)), h('span', {}, 'Q ' + (S.i + 1) + ' / ' + qs.length), h('span', {}, '⭐ ' + S.score), h('span', {class: 'arena-best'}, '🏆 ' + S.best));
      const mult = S.streak >= 6 ? 3 : S.streak >= 3 ? 2 : 1;
      combo.textContent = S.streak >= 3 ? '🔥 Combo ×' + mult + ' · streak ' + S.streak : S.streak ? 'Streak ' + S.streak : '';
      combo.dataset.hot = String(S.streak >= 3);
      api.progress('Score ' + S.score + ' · lives ' + S.lives, S.i + 1, qs.length);
    }
    function answer(i) {
      if (S.locked || S.over) return;
      const q = qs[S.i], choice = q.options[i]; if (i >= 0 && !choice) return;
      S.locked = true;
      const ok = !!choice?.ok, mult = S.streak >= 6 ? 3 : S.streak >= 3 ? 2 : 1;
      [...opts.children].forEach((b, k) => { b.disabled = true; if (q.options[k].ok) b.dataset.outcome = 'success'; else if (k === i) b.dataset.outcome = 'review'; });
      if (ok) { const pts = (100 + Math.round(S.left * 10)) * mult; S.score += pts; S.streak++; api.feedback('✔ +' + pts + '  ' + q.why, 'good'); api.sound('good'); }
      else { S.lives--; S.streak = 0; api.feedback((i < 0 ? '⏰ Time up! ' : '✖ ') + q.why, 'bad'); api.sound('bad'); root.classList.add('shake'); setTimeout(() => root.classList.remove('shake'), 400); }
      api.model({success: ok}); api.log(q.q + ' → ' + (choice?.label || 'no answer'), ok, q.why); paint();
      setTimeout(() => { if (S.over) return; if (S.lives <= 0 || S.i === qs.length - 1) end(); else { S.i++; show(); } }, 2200);
    }
    const stop = loop(dt => {
      if (S.over || S.locked) return;
      S.left -= dt; timer.firstChild.style.width = clamp(S.left / 12 * 100, 0, 100) + '%'; timer.dataset.low = String(S.left < 4);
      if (S.left <= 0) answer(-1);
    });
    function end() {
      S.over = true; stop();
      const right = qs.slice(0, S.i + 1).length - (3 - S.lives);
      if (S.score > S.best) localStorage.setItem('pome-arena-best', S.score);
      const n = S.lives === 3 ? 3 : S.lives >= 1 ? 2 : 1;
      const rank = S.score >= 2400 ? 'Plant Hero' : S.score >= 1500 ? 'Shift Supervisor' : S.score >= 800 ? 'Operator' : 'Trainee';
      api.sound(n >= 2 ? 'win' : 'bad');
      api.finish(`${stars(n)} ${rank}! Score ${S.score}${S.score > S.best ? ' · new best!' : ''} · ${Math.max(0, right)} correct.`, 'Play again for a new mix of questions and try to keep a ×3 combo.');
    }
    show();
    return {key: answer, state: () => ({locked: S.locked, finished: S.over}), destroy: () => { S.over = true; stop(); }};
  }

  const HOWTO = {
    rescue: ['A storm is filling the pond with rain. Use the 🛢️ storage tank before it overflows into the river.', 'Alerts pop up. Pick the matching tool before each timer runs out.', 'Survive 90 seconds. Keys 1–4 (or 1–4 fingers on camera) use the tools.'],
    train: ['Put eight stations on three lines: water, gas and sludge.', 'Watch out: two tiles are traps that a real mill should never use.', 'Switch the plant on to test it. Fewer tries means more stars.'],
    biogas: ['Alarm! The digester is sick and the pH is falling.', 'Change the feed, add lime, set the heater and switch on the H₂S scrubber.', 'Keep the power above 650 kW with pH 6.8–7.5 for 40 seconds. More feed = more power, but too much turns the digester sour.'],
    manager: ['You run the mill for three years with a budget of coins.', 'Build upgrade cards. Some need another card first.', 'Each year a surprise event tests your plan. Keep all four meters high.'],
    arena: ['Ten questions, 12 seconds each, three lives.', 'Answer fast for bonus points. Three right in a row starts a combo.', 'Keys 1–4, a click, or 1–4 fingers on the camera.']
  };
  const factories = {rescue, train, biogas, manager, arena};
  window.Missions = {
    games,
    // Every game opens with a short briefing and a Start button (key 1 / one finger), so timers never run before the player is ready.
    mount(id, root, api) {
      const make = factories[id]; if (!make) throw new Error('Unknown game');
      const info = games.find(g => g.id === id);
      root.replaceChildren(); root.dataset.game = id;
      let inner = null;
      const go = h('button', {class: 'g-cta g-start', 'data-answer': 0, onclick: begin}, h('kbd', {}, '1'), '▶ Start');
      const intro = h('div', {class: 'g-intro'}, h('span', {class: 'g-intro-icon'}, info.icon), h('ol', {}, HOWTO[id].map(t => h('li', {}, t))), go);
      root.append(intro); api.progress('Ready', 1, 5); api.focus({rescue: 'intake', train: 'intake', biogas: 'digester', manager: 'intake', arena: 'river'}[id]);
      function begin() { if (inner) return; intro.remove(); api.sound('tick'); inner = make(root, api); }
      return {
        key(i) { if (!inner) { if (i === 0) begin(); return; } inner.key?.(i); },
        state: () => inner ? inner.state() : {locked: false, finished: false},
        destroy() { inner?.destroy?.(); }
      };
    }
  };
})();
