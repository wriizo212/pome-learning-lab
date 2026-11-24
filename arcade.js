(() => {
  const el = id => document.getElementById(id);
  const sites = {
    intake: 'Intake · Screening and equalisation prepare the incoming POME.',
    digester: 'Digester · Anaerobic treatment breaks down organic matter and produces biogas.',
    polish: 'Polishing · Check final water quality for its intended destination.',
    gas: 'Energy unit · Captured biogas can supply mill energy after suitable conditioning.',
    sludge: 'Sludge yard · Check treatment and quality before considering beneficial use.',
    river: 'Receiving river · Organic pollution can reduce oxygen available to aquatic life.'
  };
  let active, session, pending, history, finished;
  const model = Plant.mount(el('plant'), id => { el('inspect').textContent = sites[id] || id; });
  const gesture = Gesture.mount(el('camera'), number => choose(number - 1));
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
    gesture.stop();
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
    const round = session.view();
    el('progress').textContent = active.title + ' · ' + round.progress;
    el('mission').textContent = round.title;
    el('brief').textContent = round.prompt;
    el('feedback').textContent = '';
    el('next').hidden = true;
    el('actions').replaceChildren(...round.choices.map((choice, index) => {
      const button = document.createElement('button');
      const key = document.createElement('b');
      key.textContent = String(index + 1);
      button.append(key, document.createTextNode(choice));
      button.onclick = () => choose(index);
      return button;
    }));
    model.update({ mode: active.id, stage: round.stage });
  }
  function choose(index) {
    if (!session || pending || finished) return;
    const round = session.view();
    if (!round.choices[index]) return;
    pending = session.act(index);
    history.push({ title: round.title, choice: round.choices[index], ...pending });
    el('actions').querySelectorAll('button').forEach(button => button.disabled = true);
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
    gesture.stop();
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
    button.textContent = game.title;
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
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select')) return;
    if (/^[123]$/.test(event.key)) choose(Number(event.key) - 1);
  });
  start(Missions.games[0].id);
})();