/*
 Two helpers that keep the frame rate steady.

 warmShaders(): WebGL compiles a shader the first time an object is drawn. Units that
 start hidden (the integrated-recovery plant, HD hardware, molecules, the pond/digester
 swap) used to compile the moment they appeared, which froze the scene for a moment on
 every change. Compiling everything once at start-up, hidden objects included, removes
 those hitches. With KHR_parallel_shader_compile the driver links in the background.

 densityKnob(): a cheap runtime control for decorative instanced scenery (grass tufts,
 pebbles, palms, flowers). Drawing fewer instances lightens the GPU without lowering the
 resolution, so the image stays sharp while the frame rate recovers.
*/
export function warmShaders(renderer, scene, camera) {
  const hidden = [];
  scene.traverse(o => { if (!o.visible) { hidden.push(o); o.visible = true; } });
  try { renderer.compile(scene, camera); }
  catch (error) { console.info('Shader warm-up skipped:', error.message); }
  finally { for (const o of hidden) o.visible = false; }
}

export function densityKnob(scene, {min = 30} = {}) {
  const meshes = [];
  scene.traverse(o => { if (o.isInstancedMesh && o.count >= min) { o.userData.fullCount = o.count; meshes.push(o); } });
  let level = 1;
  return {
    get level() { return level; },
    set(f) {
      level = Math.max(.35, Math.min(1, f));
      for (const m of meshes) m.count = Math.max(1, Math.round(m.userData.fullCount * level));
    }
  };
}
