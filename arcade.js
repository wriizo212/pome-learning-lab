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
  let active, session, pending, history, finished;
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
  window.PomeMission = {
    choose, next(){if(pending && !finished) el('next').click();},
    state(){return {locked:!!pending, finished};},
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
  el('orbit').onclick = () => {
    model.spin(orbit = !orbit);
    el('orbit').textContent = orbit ? 'Stop orbit' : 'Auto-orbit';
  };
  el('motion').onclick = () => {
    model.update({paused: paused = !paused});
    el('motion').textContent = paused ? 'Resume motion' : 'Pause motion';
  };
  function start(id) {
    window.stopCamera?.(true);
    active = Missions.games.find(game => game.id === id);
    session = Missions.start(id, el('scenario').value);
    history = [];
    model.update({success:null,pathway:'uasb'});
    finished = false;
    el('record').hidden = true;
    el('reflection').value = '';
    el('games').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.id === id)));
    render();
  }
  function render() {
    pending = null;
    window.pauseCameraSelection?.(false);
    const round = session.view();
    el('progress').textContent = active.title + ' · ' + round.progress;
    const [step, total] = round.progress.match(/\d+/g).slice(0,2).map(Number);
    track.replaceChildren(...Array.from({length:total}, (_, index) => {
      const segment = document.createElement('span');
      segment.className = index < step - 1 ? 'complete' : index === step - 1 ? 'current' : '';
      return segment;
    }));
    el('mission').textContent = round.title;
    el('brief').textContent = round.prompt;
    el('feedback').textContent = '';
    el('next').hidden = true;
    el('actions').replaceChildren(...round.choices.map((choice, index) => {
      const button = document.createElement('button');
      const key = document.createElement('b');
      button.className = 'option';
      button.dataset.answer = index;
      key.textContent = 'ABCD'[index];
      button.append(key, document.createTextNode(choice));
      button.onclick = () => choose(index);
      return button;
    }));
    model.update({ mode: active.id, stage: round.stage });
    stationPicker.value = round.stage;
    el('inspect').textContent = sites[round.stage];
  }
  function choose(index) {
    if (!session || pending || finished) return;
    const round = session.view();
    if (!round.choices[index]) return;
    pending = session.act(index);
    window.pauseCameraSelection?.(true);
    history.push({ title: round.title, choice: round.choices[index], ...pending });
    el('actions').querySelectorAll('button').forEach((button, i) => {
      button.disabled = true;
      if (i === index) button.dataset.outcome = pending.success ? 'success' : 'review';
    });
    el('feedback').className = 'result';
    el('feedback').textContent = pending.feedback;
    model.update({ mode: active.id, stage: pending.stage, success: pending.success, ...(pending.pathway ? {pathway:pending.pathway} : {}) });
    if (audible && audio?.state === 'running') {
      const tone = audio.createOscillator(), volume = audio.createGain();
      tone.frequency.value = pending.success ? 660 : 240;
      volume.gain.setValueAtTime(.055, audio.currentTime);
      volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .22);
      tone.connect(volume).connect(audio.destination);
      tone.start(); tone.stop(audio.currentTime + .23);
    }
    el('next').textContent = pending.done ? 'View mission record' : 'Continue';
    el('next').hidden = false;
    el('next').focus({ preventScroll:true });
  }
  function finish() {
    finished = true;
    window.stopCamera?.(true);
    el('record').hidden = false;
    el('next').hidden = true;
    el('summary').textContent = active.title + ' · ' + el('scenario').selectedOptions[0].text + ' · ' + history.filter(turn => turn.success).length + ' successful actions in ' + history.length + ' attempts.';
    el('log').replaceChildren(...history.map(turn => {
      const item = document.createElement('li');
      item.textContent = turn.choice + ' — ' + turn.feedback;
      return item;
    }));
    el('record').scrollIntoView();
  }
  Missions.games.forEach(game => {
    const button = document.createElement('button');
    const title = document.createElement('strong');
    title.textContent = game.title;
    const description = document.createElement('small');
    description.textContent = game.subtitle;
    button.append(title, description);
    button.title = game.subtitle;
    button.dataset.id = game.id;
    button.onclick = () => start(game.id);
    el('games').append(button);
  });
  el('next').onclick = () => pending?.done ? finish() : render();
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
      import('./mill-gpu.mjs?v=shift9')
    ]).then(([three, assets]) => {
      const enhanced=assets.mount(three,el('plant'),inspect);
      renderer.destroy();renderer=enhanced;renderer.update(modelState);renderer.spin(autoOrbit);
    }).catch(error=>console.info('Using lightweight plant renderer.',error.message));
  }
})();