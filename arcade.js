(() => {
  const el = id => document.getElementById(id);
  const sites = {
    intake: 'Intake · Hot raw POME (about 80 °C) arrives from the mill. Floating fibre and shell are raked off, oil droplets float to the top, and water, dissolved organics (COD) and ammonium flow on to the digester.',
    digester: 'Digester · Inside the covered tank, microbes break organic matter down to acetate, then methanogens turn it into biogas (CH₄ + CO₂, with a trace of H₂S). Open ponds make the same gas but let it escape to the air.',
    polish: 'Polishing · Diffusers bubble air through the basin. Bacterial flocs use the dissolved O₂ to oxidise leftover organics to CO₂ + H₂O and to turn ammonium into nitrate. Check final quality for its intended destination.',
    gas: 'Energy unit · The engine burns biogas with air (CH₄ + 2O₂ → CO₂ + 2H₂O) and drives a generator that feeds the mill grid. Gas the engine cannot use is burnt safely at the flare.',
    sludge: 'Sludge yard · Waste sludge drains through sand and gravel and dries in the sun. The cake is shovelled out and composted, and the warm compost heaps steam. Check quality before considering beneficial use.',
    river: 'Receiving river · Clean discharge keeps dissolved O₂ high, so fish and reeds thrive. Organic pollution feeds bacteria that use up that oxygen, so the fish disappear and scum forms.'
  };
  let active, game, history = [], finished = false, result = null;
  const stationPicker = document.createElement('select');
  stationPicker.setAttribute('aria-label', 'Inspect a plant unit');
  stationPicker.add(new Option('Inspect a unit…', ''));
  Object.entries(sites).forEach(([id, description]) => {
    stationPicker.add(new Option(description.split(' · ')[0], id));
  });
  function inspect(id) {
    stationPicker.value = id;
    el('inspect').textContent = sites[id] || 'Select a plant unit to inspect it.';
    model.update({stage:id});
  }
  const modelState = {};
  let renderer = Plant.mount(el('plant'), inspect);
  let autoOrbit = false;
  const model = {
    update(change){Object.assign(modelState,change);renderer.update(change);},
    zoom(value){renderer.zoom(value);},
    reset(){autoOrbit=false;renderer.reset();},
    spin(value){autoOrbit=value;renderer.spin(value);}
  };
  stationPicker.onchange = () => inspect(stationPicker.value);
  const cameraBar = document.createElement('div');
  cameraBar.className = 'camera-bar';
  cameraBar.append(stationPicker);
  for (const [title, glyph, run] of [
    ['Zoom out','−',() => model.zoom(-.12)],
    ['Zoom in','+',() => model.zoom(.12)],
    ['Reset view','↺',() => {model.reset(); orbit=false; el('orbit').textContent='Auto-orbit';}]
  ]) {
    const control = document.createElement('button');
    control.textContent = glyph;
    control.title = title;
    control.setAttribute('aria-label', title);
    control.onclick = run;
    cameraBar.append(control);
  }
  el('plant').after(cameraBar);
  const track = document.createElement('div');
  track.className = 'mission-track';
  track.setAttribute('aria-hidden','true');
  el('progress').after(track);
  // The game area replaces the old answer list; games build their own controls inside it.
  const stage = el('actions');
  stage.className = 'game-stage';
  // Keyboard 1-4 and the camera gestures both arrive here.
  function choose(index) { if (!finished) game?.key?.(index); }
  window.PomeMission = {
    choose, next(){ if (!el('next').hidden) el('next').click(); },
    state(){ const s = game?.state?.() || {}; return {locked: !!s.locked, finished: finished || !!s.finished}; },
    rotate(x,y){renderer.rotate(x,y);}, zoom: model.zoom
  };
  let audio, audible = false, orbit = false, paused = false;
  el('sound').onclick = () => {
    audible = !audible;
    if (audible && window.AudioContext) {
      audio ||= new AudioContext();
      audio.resume().catch(() => {});
    }
    el('sound').textContent = audible ? 'Sound on' : 'Sound off';
  };
  // Short synthesised effects, distinct for each kind of event.
  const SOUNDS = {good:[[660,.09],[880,.12]], bad:[[240,.18]], tick:[[520,.04]], alarm:[[740,.08],[520,.08],[740,.08]], win:[[523,.1],[659,.1],[784,.1],[1047,.22]]};
  function sound(kind) {
    if (!audible || audio?.state !== 'running') return;
    let t = audio.currentTime;
    for (const [freq, len] of SOUNDS[kind] || SOUNDS.tick) {
      const tone = audio.createOscillator(), volume = audio.createGain();
      tone.type = kind === 'alarm' ? 'square' : kind === 'bad' ? 'sawtooth' : 'triangle';
      tone.frequency.value = freq;
      volume.gain.setValueAtTime(.05, t);
      volume.gain.exponentialRampToValueAtTime(.001, t + len);
      tone.connect(volume).connect(audio.destination);
      tone.start(t); tone.stop(t + len + .02); t += len * .9;
    }
  }
  el('orbit').onclick = () => {
    model.spin(orbit = !orbit);
    el('orbit').textContent = orbit ? 'Stop orbit' : 'Auto-orbit';
  };
  el('motion').onclick = () => {
    model.update({paused: paused = !paused});
    el('motion').textContent = paused ? 'Resume motion' : 'Pause motion';
  };
  const api = {
    get scenario(){ return el('scenario').value; },
    model(change){ model.update({mode: active.id, ...change}); },
    focus(id){ if (!sites[id]) return; stationPicker.value = id; el('inspect').textContent = sites[id]; model.update({mode: active.id, stage: id}); },
    sound,
    feedback(text, tone){ const f = el('feedback'); f.textContent = text; f.className = 'result' + (tone ? ' ' + tone : ''); f.hidden = !text; },
    progress(label, step, total){
      el('progress').textContent = active.title + ' · ' + label;
      track.replaceChildren(...Array.from({length: total}, (_, index) => {
        const segment = document.createElement('span');
        segment.className = index < step - 1 ? 'complete' : index === step - 1 ? 'current' : '';
        return segment;
      }));
    },
    log(choice, success, feedback){ history.push({choice, success, feedback}); },
    finish(summary, lesson){
      if (finished) return;
      finished = true; result = {summary, lesson};
      window.stopCamera?.(true);
      const banner = document.createElement('div');
      banner.className = 'game-over';
      banner.innerHTML = '<b></b><p></p>';
      banner.querySelector('b').textContent = summary;
      banner.querySelector('p').textContent = lesson || '';
      stage.prepend(banner);
      el('next').textContent = 'View mission record';
      el('next').hidden = false;
      el('next').focus({preventScroll:true});
    }
  };
  function start(id) {
    window.stopCamera?.(true);
    game?.destroy?.();
    active = Missions.games.find(g => g.id === id);
    history = []; finished = false; result = null;
    model.update({success:null, pathway:'uasb', mode:id});
    el('record').hidden = true;
    el('reflection').value = '';
    el('next').hidden = true;
    api.feedback('');
    el('games').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.id === id)));
    el('mission').textContent = active.icon + ' ' + active.title;
    el('brief').textContent = active.subtitle;
    stage.closest('article').dataset.game = id;
    game = Missions.mount(id, stage, api);
  }
  function finish() {
    el('record').hidden = false;
    el('next').hidden = true;
    el('summary').textContent = active.title + ' · ' + el('scenario').selectedOptions[0].text + ' · ' + (result?.summary || '');
    el('log').replaceChildren(...history.map(turn => {
      const item = document.createElement('li');
      item.textContent = (turn.success ? '✔ ' : '✖ ') + turn.choice + (turn.feedback ? ' — ' + turn.feedback : '');
      return item;
    }));
    el('record').scrollIntoView();
  }
  Missions.games.forEach(g => {
    const button = document.createElement('button');
    const icon = document.createElement('span');
    icon.className = 'game-icon';
    icon.textContent = g.icon;
    const title = document.createElement('strong');
    title.textContent = g.title;
    const description = document.createElement('small');
    description.textContent = g.subtitle;
    button.append(icon, title, description);
    button.title = g.subtitle;
    button.dataset.id = g.id;
    button.onclick = () => start(g.id);
    el('games').append(button);
  });
  el('next').onclick = () => finished ? finish() : null;
  el('again').onclick = () => start(active.id);
  el('print').onclick = () => window.print();
  el('scenario').onchange = () => start(active.id);
  document.addEventListener('keydown', event => {
    if (el('modal').open || !el('cameraHelp').hidden || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select')) return;
    if (/^[1-4]$/.test(event.key)) choose(Number(event.key) - 1);
  });
  start(Missions.games[0].id);
  if(location.protocol !== 'file:') {
    Promise.all([
      import('./process/three.module.min.js'),
      import('./mill-gpu.mjs?v=shift14')
    ]).then(([three, assets]) => {
      const enhanced=assets.mount(three,el('plant'),inspect);
      renderer.destroy();renderer=enhanced;renderer.update(modelState);renderer.spin(autoOrbit);
    }).catch(error=>console.info('Using lightweight plant renderer.',error.message));
  }
})();
