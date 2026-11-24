/* POME Lab classroom games. Scenario constraints and game counters are illustrative. */
(() => {
  'use strict';
  const games = [
    {id:'rescue', title:'POME Rescue', subtitle:'Protect the river through four incident decisions.'},
    {id:'train', title:'Build the Treatment Train', subtitle:'Commission six treatment and recovery stations.'},
    {id:'biogas', title:'Biogas Mission', subtitle:'Diagnose an upset and return the energy line to service.'},
    {id:'manager', title:'POME Manager Challenge', subtitle:'Negotiate a pathway that fits the mill and its people.'},
    {id:'arena', title:'Gesture Quiz Arena', subtitle:'Build a streak across five shuffled science challenges.'}
  ];
  const mills = {
    small:'A small mill has existing ponds, available land and little capital.',
    medium:'A medium mill has on-site electricity demand, limited technicians and a staged budget.',
    large:'A large mill has trained staff, investment funding and demand for reuse water.'
  };
  // Shuffle choices with their feedback and answer keys intact.
  function shuffle(items) {
    const copy = items.slice();
    for(let i=copy.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy;
  }
  function round(stage,title,prompt,correct,decoys,feedback) {
    return {stage,title,prompt,options:shuffle([correct,...decoys].map((label,i)=>({label,ok:i===0}))),feedback};
  }
  function rescue() {
    return [
      round('intake','Storm warning','A storm is forecast. Inflow is rising and freeboard is shrinking. What protects the river first?','Check available containment and pace inflow',['Bypass the final pond','Add freshwater to lower the concentration'],'Manage incoming volume and available storage to reduce overflow risk. Dilution leaves the pollution load in the system.'),
      round('river','Fish at the surface','A downstream observer reports distressed fish. Which paired readings best investigate organic pollution?','Dissolved oxygen and biochemical oxygen demand',['Water colour and pipe length','Methane volume and generator hours'],'Biodegradation can consume dissolved oxygen. DO and BOD help interpret this pathway alongside upstream and downstream observations.'),
      round('polish','Clear water dilemma','The overflow threat has passed. The water looks clear. Decide what happens at the outlet.','Hold pending appropriate effluent assessment',['Discharge based on clarity','Judge quality from biogas production'],'Appearance and energy recovery cannot establish discharge suitability. Check the parameters required for this outlet.'),
      round('sludge','Close the incident','Storm debris and separated solids remain. How should the crew close the response?','Contain solids and assess an appropriate treatment or disposal route',['Wash solids into the river','Declare all solids ready for plantation use'],'Managing captured solids prevents pollution from shifting to another environmental compartment.')
    ];
  }
  function train() {
    return [
      round('intake','Receive raw POME','The integrated mill receives hot, oily effluent. Select the first station.','Pretreatment and equalisation',['Biogas engine','Final reuse tank'],'Screen and condition incoming effluent before feeding biological treatment.'),
      round('digester','Unlock the carbon line','Conditioned POME is ready. Choose the station that converts part of its organic load into biogas.','Closed anaerobic digester',['Sludge compost bay','Water distribution pump'],'Anaerobic digestion produces gas and leaves liquid and solids requiring further management.'),
      round('gas','Connect the gas branch','Trace the gas outlet from the digester. Connect it to its next destination.','Collection, conditioning and controlled energy use',['Effluent discharge channel','Freshwater reservoir'],'Recovered gas needs appropriate handling and conditioning before energy use.'),
      round('polish','Reconnect the liquid branch','Follow digested effluent back along the liquid line. Choose the next treatment route.','Solids separation and appropriate aerobic polishing',['Return directly to production','Feed untreated liquid into the gas engine'],'Separate solids and treat remaining contaminants according to the intended outlet.'),
      round('sludge','Complete the solids branch','A side stream leaves the separator. Where should it go?','Controlled sludge processing and quality assessment',['Direct application on all fields','Discharge to the nearest watercourse'],'Recovery requires suitable sludge treatment, verified quality and an appropriate destination.'),
      round('river','Commission the outlet','The mill wants to reuse the polished water. Which check unlocks the outlet?','Verify quality against the intended water use',['Check whether the digester is full','Check the colour alone'],'Water reuse depends on fit-for-purpose quality, demand and reliable monitoring.')
    ];
  }
  function biogas() {
    return [
      round('digester','Load surge','The fruit-processing line accelerates. Feed strength rises and reactor performance changes. Pick a diagnostic.','Review COD loading, flow and reactor condition',['Estimate load from pipe colour','Assume gas capture efficiency increased'],'Flow and COD together describe organic loading. Compare them with operating records before changing feed.'),
      round('intake','Protect the digester','Equalisation capacity is available during a short peak. How should the operator use it?','Buffer incoming flow and regulate reactor feed',['Send the entire peak directly to the digester','Bypass all post-treatment'],'Equalisation can moderate short-term fluctuations within available storage and treatment capacity.'),
      round('gas','Gas recovery alarm','The collection meter falls while generation is expected to continue. What is a responsible first response?','Follow the site safety procedure and request trained inspection',['Assume all gas became electricity','Increase generator demand immediately'],'A meter change can indicate equipment, measurement or collection issues. Qualified inspection and safe handling take priority.'),
      round('gas','Prove the recovery','The line is cleared for service. Which record supports an energy claim?','Measured usable gas, electricity output and plant energy use',['Raw POME volume alone','The number of installed engines'],'Energy recovery depends on actual collection, conversion and plant demand. A nameplate rating alone is insufficient.')
    ];
  }
  function manager(scenario,plan) {
    const names=['Conventional ponds','UASB with aerobic post-treatment','Integrated resource recovery'];
    const pathIndex={small:0,medium:1,large:2}[scenario];
    const options=names.map((label,i)=>({label,ok:i===pathIndex,plan:i}));
    const conditions=['Confirm land, pond condition and monitoring capacity','Fund operator training, pretreatment and safe gas use','Confirm fit-for-purpose water quality and a sludge outlet'];
    const risks=['Methane release and pond overflow','Unstable feed and methane leakage','Reuse quality, maintenance demand and residual sludge'];
    return [
      {stage:'intake',title:'Choose the investment',prompt:mills[scenario]+' Choose the closest initial fit under these assumptions.',options,feedback:'The benchmark follows this particular mill brief. Alternative investments require an explicit plan to address their constraints.'},
      round(['river','digester','polish'][plan],'Defend the investment','Your board selected '+names[plan]+'. Choose a condition essential to this proposal.',conditions[plan],['Use nameplate capacity as proof of compliance','Assume all by-products have a buyer'],'Your board needs a practical implementation condition: '+conditions[plan]+'.'),
      round(['river','gas','sludge'][plan],'Account for the downside','Identify a material residual risk for '+names[plan]+'.',risks[plan],['All risks disappear once construction ends','Treatment makes sampling unnecessary'],'Include this risk in the monitoring and operating plan: '+risks[plan]+'.'),
      round('river','Board review','Management asks whether the investment should proceed. Pick the strongest recommendation.','Proceed conditionally with evidence, responsibilities and a review point',['Guarantee site compliance from simulation values','Select solely by the largest recovery estimate'],'A defensible decision connects the mill constraints, expected benefit, remaining risks and evidence needed at the site.')
    ];
  }
  function arena() {
    return shuffle([
      round('intake','Load detective','If flow doubles while influent COD stays constant, what happens to the incoming COD mass per day?','It doubles',['It halves','It is unchanged'],'Daily load is flow multiplied by concentration with the appropriate unit conversion.'),
      round('river','River watch','Why can high BOD harm aquatic life?','Microbial decomposition consumes dissolved oxygen',['BOD measures plankton size','It always removes nutrients'],'High oxygen demand can deplete dissolved oxygen in receiving water.'),
      round('gas','Methane match','Which pathway in Part A recovers biogas without planned water reuse?','UASB with aerobic post-treatment',['Open ponds with no capture','Full integrated recovery'],'The intermediate option captures biogas while focusing on effluent treatment.'),
      round('polish','Reuse check','Which fact best supports choosing to reuse polished effluent?','Its quality matches the specific use and there is demand',['It looks transparent','A new pump is available'],'Quality and a realistic end use determine whether water can substitute for freshwater.'),
      round('sludge','Resource or residue?','When can processed sludge become a useful resource?','When treatment, quality and the intended use are suitable',['As soon as it settles','Whenever there is unused land'],'Quality checks and an appropriate management route are essential for responsible recovery.')
    ]);
  }
  function start(id,scenario='medium') {
    if(!Object.hasOwn(mills,scenario)) scenario='medium';
    const factory={rescue,train,biogas,arena,manager:()=>manager(scenario,0)}[id];
    if(!factory) throw new Error('Unknown mission');
    let rounds=factory(), position=0, correct=0, streak=0, attempt=0;
    function view() {
      const r=rounds[position];
      if(!r) return {title:'Mission complete',prompt:'Review your results.',choices:[],stage:'river',progress:'Complete'};
      const meter={rescue:'Safeguards secured '+correct,biogas:'Checks passed '+correct,train:'Stations commissioned '+position,manager:'Board decisions '+position,arena:'Streak '+streak}[id];
      return {title:r.title,prompt:r.prompt,choices:r.options.map(o=>o.label),stage:r.stage,progress:(position+1)+' / '+rounds.length+' · '+meter};
    }
    function act(index) {
      const r=rounds[position], choice=r?.options[index];
      if(!choice) throw new RangeError('Choose an available action');
      const success=choice.ok;
      const retry=!success && id==='train';
      const feedback=(retry?'Station not connected. Try again. ':success?'':'Review this decision. ')+r.feedback;
      if(id==='manager' && position===0) {
        rounds=[r,...manager(scenario,choice.plan).slice(1)];
      }
      if(success) correct++;
      streak=success?streak+1:0;
      attempt++;
      if(!retry) position++;
      return {success,feedback,done:position===rounds.length,stage:r.stage,retry,attempt,
        ...(choice.plan===undefined?{}:{pathway:['pond','uasb','integrated'][choice.plan]})};
    }
    return {view,act};
  }
  window.Missions={games,start};
})();