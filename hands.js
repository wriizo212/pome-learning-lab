/* POME Lab · voluntary camera controls, local inference via MediaPipe. */
(() => {
  'use strict';
  const sdk = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const model = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

  // World coordinates preserve joint angles as the player rotates their hand.
  function countFingers(points) {
    if (!points || points.length !== 21) return 0;
    const distance = (a,b) => Math.hypot(a.x-b.x, a.y-b.y, a.z-b.z);
    const raised = [5,9,13,17].map(base => {
      const knuckle = points[base], joint = points[base+1], tip = points[base+3];
      const a = distance(knuckle,joint), b = distance(joint,tip), c = distance(knuckle,tip);
      return a*b > 0 && (a*a+b*b-c*c)/(2*a*b) < -0.75 &&
        distance(points[0],tip) > 1.13*distance(points[0],joint);
    });
    const pattern = raised.map(Number).join('');
    return ({1000:1,1100:2,1110:3})[pattern] || 0;
  }

  function createHold(onChoice) {
    let candidate = 0, since = 0, locked = false, neutral = null, previous = null;
    return (count, now) => {
      if (previous !== null && now-previous > 350) { candidate = 0; neutral = null; }
      previous = now;
      if (locked) {
        neutral = count ? null : neutral ?? now;
        if (neutral !== null && now-neutral >= 400) locked = false;
        return {progress:0, text:'Lower your fingers before your next choice.'};
      }
      if (count !== candidate || !count) { candidate = count; since = now; }
      const progress = count ? Math.min(1,(now-since)/2000) : 0;
      if (progress >= 1) { locked = true; candidate = 0; neutral = null; onChoice(count); }
      return {progress,text: count ? (progress === 1 ? 'Choice '+count+' confirmed.' : 'Holding choice '+count+'…') : 'Show your index finger, then add middle and ring fingers for 2 or 3.'};
    };
  }

  function mount(container,onChoice) {
    container.innerHTML = '<div style="display:grid;gap:.55rem"><button type="button">Enable gesture camera</button><small>Optional · Hand tracking runs on this device. Camera frames stay in this browser. The model downloads when enabled.</small><video hidden muted playsinline style="width:100%;max-width:270px;aspect-ratio:4/3;object-fit:cover;border-radius:12px;transform:scaleX(-1)"></video><progress hidden max="1" value="0" aria-label="Gesture hold progress" style="width:100%;accent-color:#c9f47d"></progress><small role="status" aria-live="polite">Camera off. Use buttons or keys 1–3.</small></div>';
    const button = container.querySelector('button'), video = container.querySelector('video');
    const progress = container.querySelector('progress'), status = container.querySelector('[role=status]');
    let session = 0, active = false, detector, stream, frame = 0;
    const release = source => source?.getTracks().forEach(track => track.stop());
    function stop(message = 'Camera off. Use buttons or keys 1–3.') {
      session++;
      active = false;
      cancelAnimationFrame(frame);
      release(stream); stream = null;
      video.pause(); video.srcObject = null; video.hidden = true;
      detector?.close(); detector = null;
      progress.hidden = true; progress.value = 0;
      status.textContent = message; button.textContent = 'Enable gesture camera';
      window.removeEventListener('pagehide',hide);
      document.removeEventListener('visibilitychange',visibility);
    }
    const hide = () => stop();
    const visibility = () => { if (document.hidden) stop(); };
    async function start() {
      const token = ++session;
      active = true; button.textContent = 'Cancel camera';
      window.addEventListener('pagehide',hide);
      document.addEventListener('visibilitychange',visibility);
      status.textContent = 'Loading the hand-tracking model…';
      let phase = 'model';
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Error('unsupported');
        const {FilesetResolver,HandLandmarker} = await import(sdk+'/vision_bundle.mjs');
        if (token !== session) return;
        const wasm = await FilesetResolver.forVisionTasks(sdk+'/wasm');
        if (token !== session) return;
        const handModel = await HandLandmarker.createFromOptions(wasm,{baseOptions:{modelAssetPath:model},numHands:1,runningMode:'VIDEO'});
        if (token !== session) { handModel.close(); return; }
        detector = handModel; phase = 'camera';
        status.textContent = 'Allow camera access to see the hand preview.';
        const camera = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:480},height:{ideal:360}},audio:false});
        if (token !== session) { release(camera); return; }
        stream = camera; video.srcObject = camera; video.hidden = false; await video.play();
        if (token !== session) return;
        camera.getVideoTracks()[0]?.addEventListener('ended',() => { if(token===session) stop('Camera disconnected. Use buttons or keys 1–3.'); },{once:true});
        button.textContent = 'Stop camera'; progress.hidden = false;
        let lastTime = -1, lastFrame = -1000;
        const hold = createHold(onChoice);
        function tick(now) {
          if (token !== session) return;
          if (!container.isConnected || !container.getClientRects().length) { stop(); return; }
          if (video.readyState >= 2 && lastTime !== video.currentTime && now-lastFrame >= 75) {
            try {
              lastTime = video.currentTime; lastFrame = now;
              const result = detector.detectForVideo(video,now);
              const state = hold(countFingers(result.worldLandmarks[0]),now);
              if (token !== session) return;
              progress.value = state.progress;
              if (status.textContent !== state.text) status.textContent = state.text;
            } catch { stop('Tracking interrupted. Retry the camera or use keys 1–3.'); return; }
          }
          frame = requestAnimationFrame(tick);
        }
        frame = requestAnimationFrame(tick);
      } catch(error) {
        if (token !== session) return;
        const reason = error.message === 'unsupported' ? 'This browser cannot access a camera here.' :
          phase === 'model' ? 'Hand tracking could not load. Check your connection.' :
          error.name === 'NotAllowedError' ? 'Camera permission was declined.' : 'The camera is unavailable.';
        stop(reason+' You can still play with buttons or keys 1–3.');
      }
    }
    button.onclick = () => active ? stop() : start();
    return {stop:hide};
  }
  window.Gesture = {mount};
})();