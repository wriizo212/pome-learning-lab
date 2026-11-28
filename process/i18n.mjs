/*
 Bahasa Melayu / English switch for SMK learners.
 Walks the page's text (and placeholders, aria-labels, titles) and swaps every string found
 in the dictionary; a MutationObserver catches text that modules render later. Patterns
 handle strings with numbers. The original English is kept, so switching back is exact.
 Facilitator material (Learning guide body) and live 3D dialogue stay in English.
 Other modules can call window.pomeT(text) and listen for the "pome-lang" event.
*/
const KEY='pome-lang';
let lang;try{lang=localStorage.getItem(KEY)||'ms'}catch{lang='ms'}
const D=new Map(Object.entries({
 // Header and navigation
 'Simulator':'Simulator','Compare':'Bandingkan','Your decision':'Keputusan anda','Learning guide':'Panduan pembelajaran','Play Mill Arcade':'Main Mill Arcade',
 '/ Environmental decision studio':'/ Studio keputusan alam sekitar',
 // Hero
 'Palm oil effluent':'Efluen kilang','treatment lab':'kelapa sawit',
 'Test three treatment pathways for a Malaysian mill and trace what happens to its water, biogas and sludge.':'Uji tiga cara merawat sisa kilang sawit di Malaysia dan jejaki apa yang berlaku kepada air, biogas dan enap cemarnya.',
 'Illustrated mill landscape':'Ilustrasi landskap kilang',
 // Scenario panel
 'Design your scenario':'Reka senario anda','Mill context':'Saiz kilang','Mill size':'Saiz kilang','Treatment pathway':'Cara rawatan',
 'Choose the mill and the treatment':'Pilih kilang dan cara rawatan','Change one thing at a time':'Ubah satu perkara pada satu masa',
 'Small mill':'Kilang kecil','Medium mill':'Kilang sederhana','Large mill':'Kilang besar',
 'Small mill · constrained investment':'Kilang kecil · bajet terhad','Medium mill · gradual upgrade':'Kilang sederhana · naik taraf berperingkat','Large mill · recovery investment':'Kilang besar · pelaburan pemulihan',
 '💰 Small budget':'💰 Bajet kecil','🗺️ Land available':'🗺️ Ada tanah lapang','👷 Few trained staff':'👷 Sedikit pekerja terlatih','💰 Budget in stages':'💰 Bajet berperingkat','⚡ Needs energy on site':'⚡ Perlu tenaga di kilang','👷 Some trained staff':'👷 Ada pekerja terlatih','💰 Big budget':'💰 Bajet besar','👷 Skilled engineers':'👷 Jurutera mahir','💧 Can use recovered water':'💧 Boleh guna air kitar semula',
 'Limited investment and staff. Land availability and effluent performance still need assessment.':'Bajet dan pekerja terhad. Tanah dan mutu air buangan masih perlu dinilai.',
 'Staged investment, on-site energy demand and moderate operating capacity.':'Pelaburan berperingkat, perlukan tenaga di kilang dan kemampuan operasi sederhana.',
 'Long-term investment and skilled staff, with potential demand for recovered resources.':'Pelaburan jangka panjang dan pekerja mahir, dengan permintaan untuk sumber yang dipulihkan.',
 'Conventional ponds':'Kolam konvensional','Pollution control':'Kawal pencemaran','UASB + aerobic treatment':'UASB + rawatan aerobik','Pollution control + biogas':'Kawal pencemaran + biogas','Integrated recovery':'Pemulihan bersepadu','Energy + water + nutrients':'Tenaga + air + nutrien',
 '💰 Cheap · 🗺️ Lots of land · 💨 Methane escapes':'💰 Murah · 🗺️ Tanah luas · 💨 Metana terlepas','💰💰 Medium · ⚡ Biogas power · 👷 Trained staff':'💰💰 Sederhana · ⚡ Tenaga biogas · 👷 Pekerja terlatih','💰💰💰 Costly · ⚡ Power · 💧 Water reuse · 🌱 Fertiliser':'💰💰💰 Mahal · ⚡ Tenaga · 💧 Guna semula air · 🌱 Baja',
 'POME flow':'Aliran POME','Influent COD':'COD masuk','Methane capture':'Tangkapan metana','Water reuse fraction':'Pecahan guna semula air',
 'How much POME the mill sends out each day. A bigger mill makes more.':'Berapa banyak POME yang dikeluarkan kilang setiap hari. Kilang besar menghasilkan lebih banyak.',
 'COD shows how dirty the water is: how much oxygen it would take to break the waste down. Higher = dirtier.':'COD menunjukkan betapa kotornya air: berapa banyak oksigen diperlukan untuk mengurai sisa. Lebih tinggi = lebih kotor.',
 'Of the biogas the bacteria make, how much the cover catches. The rest escapes as methane, a strong greenhouse gas.':'Daripada biogas yang dihasilkan bakteria, berapa banyak yang ditangkap oleh penutup. Selebihnya terlepas sebagai metana, gas rumah hijau yang kuat.',
 'How much treated water is cleaned further and used again in the mill instead of taking river water.':'Berapa banyak air terawat yang dibersihkan lagi dan diguna semula di kilang, bukannya mengambil air sungai.',
 'Weaker than usual raw POME':'Lebih lemah daripada POME mentah biasa','Typical raw POME: very strong':'POME mentah biasa: sangat kuat','Extremely strong POME':'POME yang amat kuat',
 'Ponds have no cover, so there is nothing to catch.':'Kolam tiada penutup, jadi tiada apa yang dapat ditangkap.','Pick UASB or Integrated recovery to capture methane.':'Pilih UASB atau Pemulihan bersepadu untuk menangkap metana.',
 'Reuse needs membrane polishing.':'Guna semula air perlukan penapisan membran.','Only Integrated recovery can reuse water.':'Hanya Pemulihan bersepadu boleh guna semula air.',
 '🧪 Water leaving':'🧪 Air keluar','🔥 Methane caught':'🔥 Metana ditangkap','💧 Water reused':'💧 Air diguna semula','mg/L COD':'mg/L COD','m³/day':'m³/hari',
 'Run 1':'Larian 1','Run 2':'Larian 2','Run 3':'Larian 3',
 'Keep everything as it is and save. This is your starting point.':'Biarkan semua seperti asal dan simpan. Ini titik permulaan anda.',
 'Change only Influent COD (dirtier or cleaner POME), then save. What happens to the water leaving the plant?':'Ubah COD masuk sahaja (POME lebih kotor atau lebih bersih), kemudian simpan. Apa jadi kepada air yang keluar dari loji?',
 'Now change only the treatment pathway, then save. Which one recovers the most?':'Sekarang ubah cara rawatan sahaja, kemudian simpan. Yang mana paling banyak memulihkan sumber?',
 '↺ Reset':'↺ Set semula','Save run':'Simpan larian','Three runs saved!':'Tiga larian disimpan!',
 // Process model and results
 'Interactive process model':'Model proses interaktif','Select a treatment stage':'Pilih peringkat rawatan','Trace the journey of POME':'Jejaki perjalanan POME',
 'Click any plant component to explore its purpose, outputs and operational limitations. This is a conceptual process model, not an engineering layout.':'Klik mana-mana bahagian loji untuk melihat fungsi, hasil dan hadnya. Ini model konsep, bukan pelan kejuruteraan.',
 'Organic load entering':'Beban organik masuk','Illustrative residual COD':'COD baki (anggaran)','mg/L · not a compliance result':'mg/L · bukan keputusan pematuhan','Captured methane potential':'Potensi metana ditangkap','m³/day · illustrative yield':'m³/hari · hasil anggaran','Potential water substitution':'Potensi air diganti','m³/day · quality dependent':'m³/hari · bergantung pada mutu',
 'Educational model: fixed illustrative removal and yield assumptions. No prediction of actual plant performance or legal compliance.':'Model pendidikan: guna andaian tetap untuk penyingkiran dan hasil. Bukan ramalan prestasi loji sebenar atau pematuhan undang-undang.',
 'Save scenario for comparison':'Simpan senario untuk dibandingkan','Reset inputs':'Set semula input',
 // 3D controls (labels outside the canvas)
 'Inspect':'Lihat','Plant overview':'Gambaran loji','Pond overview':'Gambaran kolam','Cutaway':'Keratan','Pause flow':'Jeda aliran','Resume flow':'Sambung aliran','Molecules':'Molekul','Reset view':'Set semula pandangan','Quality':'Kualiti',
 '▶ Play as a worker':'▶ Main sebagai pekerja','Play as a worker':'Main sebagai pekerja','Sound off':'Bunyi tutup','Sound on':'Bunyi buka','Camera view':'Pandangan kamera','Orbit model':'Orbit model','First person':'Orang pertama','Third person':'Orang ketiga','Play as':'Main sebagai','Fullscreen':'Skrin penuh','Task tags':'Label tugas','Movement & gestures':'Pergerakan & gerak isyarat','Start gesture camera':'Mula kamera gerak isyarat',
 '🌧️ Storm test':'🌧️ Ujian ribut','CH₄ bubbles':'Gelembung CH₄','Conventional ponds · open to the air':'Kolam konvensional · terbuka kepada udara',
 // Compare
 'Evaluate the trade-offs':'Nilai kebaikan dan keburukan','Different mills.':'Kilang berbeza.','Different decisions.':'Keputusan berbeza.',
 'Lower initial investment and simpler operation. Larger land demand, odour and overflow risks, and uncontrolled methane can remain.':'Kos awal lebih rendah dan operasi lebih mudah. Tetapi perlukan tanah luas, ada risiko bau dan limpahan, dan metana tidak terkawal.',
 'Question:':'Soalan:','How would you demonstrate adequate treatment and manage remaining emissions?':'Bagaimana anda membuktikan rawatan mencukupi dan mengurus pelepasan yang tinggal?',
 'UASB + biogas':'UASB + biogas','Compact anaerobic treatment with gas recovery and aerobic post-treatment. Requires suitable pretreatment, stable loading and trained operators.':'Rawatan anaerobik yang padat dengan pemulihan gas dan rawatan aerobik selepasnya. Perlukan prarawatan yang sesuai, beban stabil dan operator terlatih.',
 'What happens if gas capture or the biological process performs poorly?':'Apa berlaku jika tangkapan gas atau proses biologi tidak berfungsi dengan baik?',
 'Adds water polishing and planned sludge recovery. Requires investment, energy, maintenance and quality checks for each recovered product.':'Menambah penapisan air dan pemulihan enap cemar. Perlukan pelaburan, tenaga, penyelenggaraan dan semakan mutu bagi setiap hasil.',
 'Are there practical users for the recovered water, energy and nutrients?':'Adakah sesiapa yang benar-benar akan menggunakan air, tenaga dan nutrien yang dipulihkan?',
 'Your saved experiments':'Eksperimen yang disimpan','Scenario / pathway':'Senario / cara rawatan','Flow':'Aliran','Residual COD':'COD baki','Methane':'Metana','Water reuse':'Guna semula air',
 'Save scenarios in the simulator to compare your experiments.':'Simpan senario dalam simulator untuk membandingkan eksperimen anda.','Export learning record':'Eksport rekod pembelajaran','Clear comparisons':'Kosongkan perbandingan',
 // Decision tab
 'Apply your judgement':'Gunakan pertimbangan anda','Make the call.':'Buat keputusan.','Defend the conditions.':'Pertahankan syaratnya.','The mill manager’s brief':'Taklimat pengurus kilang',
 'A medium-sized Malaysian mill can fund a staged upgrade. It has demand for on-site energy but limited specialist staff. There is no confirmed use for reclaimed water or compost.':'Sebuah kilang sederhana di Malaysia mampu membiayai naik taraf secara berperingkat. Kilang perlukan tenaga tetapi kurang pekerja pakar. Belum ada pengguna yang pasti untuk air kitar semula atau kompos.',
 'Recommend a pathway and identify what must be in place before implementation.':'Cadangkan satu cara rawatan dan nyatakan apa yang mesti disediakan sebelum ia dilaksanakan.',
 'Keep conventional ponds':'Kekalkan kolam konvensional','Stage a UASB + biogas upgrade':'Naik taraf berperingkat kepada UASB + biogas','Install full integrated recovery':'Pasang pemulihan bersepadu sepenuhnya',
 'Your evidence-based recommendation':'Cadangan anda berdasarkan bukti','Use two comparison criteria, one limitation and one implementation condition. More than one answer can be defensible.':'Gunakan dua sebab perbandingan, satu kelemahan dan satu syarat pelaksanaan. Lebih daripada satu jawapan boleh diterima.',
 'Check my reasoning structure':'Semak struktur hujah saya','This checks structure only; it does not grade scientific accuracy or use AI.':'Ini hanya menyemak struktur; ia tidak menilai ketepatan sains dan tidak menggunakan AI.',
 'I recommend… because… The main limitation is… Implementation should require…':'Saya cadangkan… kerana… Kelemahan utamanya ialah… Sebelum dilaksanakan, kilang perlu…',
 'Check your understanding':'Semak kefahaman anda','1. Why is high BOD a concern in receiving water?':'1. Mengapa BOD yang tinggi membimbangkan dalam air sungai?',
 'It can increase microbial oxygen demand.':'Ia boleh meningkatkan keperluan oksigen oleh mikrob.','It guarantees nutrients have been removed.':'Ia menjamin nutrien telah dibuang.','It means the water is suitable for reuse.':'Ia bermaksud air sesuai diguna semula.',
 '2. Does captured biogas prove that final effluent meets discharge requirements?':'2. Adakah biogas yang ditangkap membuktikan air buangan akhir memenuhi had pelepasan?',
 'Yes, gas capture is sufficient.':'Ya, tangkapan gas sudah mencukupi.','No, final effluent needs applicable quality assessment.':'Tidak, air buangan akhir perlu diuji mutunya.',
 '3. What is necessary before reusing sludge as a soil amendment?':'3. Apa yang perlu dilakukan sebelum enap cemar diguna semula sebagai baja tanah?',
 'Assume all organic sludge is safe.':'Anggap semua enap cemar organik selamat.','Verify treatment, quality and suitability for the intended use.':'Pastikan rawatan, mutu dan kesesuaiannya untuk kegunaan itu.','Reveal feedback':'Tunjuk maklum balas',
 // Briefing (Start here)
 'Start here · mission briefing':'Mula di sini · taklimat misi','POME: wastewater problem or useful resource?':'POME: masalah air sisa atau sumber berguna?','Hide briefing ▴':'Sembunyi taklimat ▴','Open briefing ▾':'Buka taklimat ▾',
 'The problem':'Masalahnya','The big question':'Soalan besar','The solution':'Penyelesaiannya','Your mission':'Misi anda','← Back':'← Kembali','Start the simulator ↓':'Mula simulator ↓','See it in 3D →':'Lihat dalam 3D →',
 'Next: The big question →':'Seterusnya: Soalan besar →','Next: The solution →':'Seterusnya: Penyelesaiannya →','Next: Your mission →':'Seterusnya: Misi anda →',
 'What is POME, and why is it a problem?':'Apakah POME, dan mengapa ia menjadi masalah?','POME (palm oil mill effluent) is the dirty wastewater left after palm oil is made.':'POME (efluen kilang kelapa sawit) ialah air sisa kotor yang tinggal selepas minyak sawit dihasilkan.',
 'Very hot':'Sangat panas','About 80–90 °C when it leaves the mill':'Kira-kira 80–90 °C semasa keluar dari kilang','Acidic and oily':'Berasid dan berminyak','Full of oil, fibre and rotting plant matter':'Penuh minyak, serat dan bahan tumbuhan yang reput','A lot of it':'Sangat banyak','About 0.6 m³ for every tonne of fruit bunches*':'Kira-kira 0.6 m³ bagi setiap tan tandan buah*',
 'Most mills use open ponds. Tap each card to see what goes wrong:':'Kebanyakan kilang guna kolam terbuka. Tekan setiap kad untuk lihat masalahnya:',
 'Methane escapes':'Metana terlepas','Bad smell':'Bau busuk','Needs lots of land':'Perlukan tanah yang luas','Hard to keep the river safe':'Sukar memastikan sungai selamat',
 'Open ponds let methane (CH₄) bubble into the air. Methane traps much more heat than CO₂, so it speeds up climate change.':'Kolam terbuka membiarkan metana (CH₄) naik ke udara. Metana memerangkap haba jauh lebih banyak daripada CO₂, jadi ia mempercepat perubahan iklim.',
 'Hydrogen sulphide (H₂S) smells like rotten eggs and drifts to nearby homes.':'Hidrogen sulfida (H₂S) berbau seperti telur busuk dan sampai ke rumah berdekatan.',
 'A chain of ponds holds POME for a long time, so it needs a very large area.':'Rangkaian kolam menyimpan POME dalam masa yang lama, jadi ia perlukan kawasan yang sangat luas.',
 'Ponds struggle to meet strict BOD limits, and heavy rain can make them overflow into the river.':'Kolam sukar mencapai had BOD yang ketat, dan hujan lebat boleh menyebabkannya melimpah ke sungai.',
 'Should the mill':'Patutkah kilang','just clean the water':'hanya membersihkan air',', or':', atau','clean it and recover useful things':'membersihkannya dan memulihkan bahan berguna','from it?':'daripadanya?',
 'There is no wrong answer yet. Choose what you think now; you will test it in the simulator.':'Belum ada jawapan salah. Pilih pendapat anda sekarang; anda akan mengujinya dalam simulator.',
 '🧽 Just clean the water':'🧽 Hanya bersihkan air','♻️ Clean it and recover resources':'♻️ Bersihkan dan pulihkan sumber','🤔 It depends on the mill':'🤔 Bergantung pada kilang',
 'The solution: five steps that turn waste into resources':'Penyelesaian: lima langkah menukar sisa menjadi sumber','Tap a step to learn what happens, then see it in the 3D plant.':'Tekan satu langkah untuk mengetahui apa berlaku, kemudian lihat dalam loji 3D.',
 'Clean and cool':'Bersih dan sejukkan','Digest and catch biogas':'Cerna dan tangkap biogas','Make energy':'Jana tenaga','Polish the water':'Gilap air','Turn sludge into fertiliser':'Tukar enap cemar menjadi baja',
 'Oil to sell · heat':'Minyak untuk dijual · haba','Biogas':'Biogas','Electricity · BioCNG':'Elektrik · BioCNG','Water to reuse':'Air untuk diguna semula','Fertiliser':'Baja',
 'Your mission':'Misi anda','Do these five tasks in order. Each button takes you to the right place.':'Buat lima tugasan ini mengikut urutan. Setiap butang membawa anda ke tempat yang betul.',
 'Look at raw POME':'Lihat POME mentah','Open the inlet in 3D and see what comes from the mill.':'Buka bahagian masuk dalam 3D dan lihat apa yang datang dari kilang.','Compare the three ways':'Bandingkan tiga cara','Try Conventional ponds, then UASB + aerobic, then Integrated recovery.':'Cuba Kolam konvensional, kemudian UASB + aerobik, kemudian Pemulihan bersepadu.',
 'Catch the biogas':'Tangkap biogas','Pick Integrated recovery and move the Methane capture slider.':'Pilih Pemulihan bersepadu dan gerakkan gelangsar Tangkapan metana.','Save water':'Jimatkan air','Move the Water reuse slider and watch the result change.':'Gerakkan gelangsar Guna semula air dan lihat keputusan berubah.','Make your decision':'Buat keputusan anda','Answer the mill manager in the Your decision tab.':'Jawab pengurus kilang dalam tab Keputusan anda.',
 '* From the group\'s Part A poster; check the source before using it as evidence.':'* Daripada poster Part A kumpulan; semak sumbernya sebelum digunakan sebagai bukti.',
 // Lesson mode and tests (built by lesson.mjs)
 'Investigate':'Siasat','Explore':'Teroka','Experiment':'Eksperimen','Decide':'Putuskan','Reflect':'Refleksi'
}));
// Strings with numbers.
const P=[
 [/^≈ ([\d,]+) tanker lorries a day \(if one lorry holds 15 m³\)$/,'≈ $1 lori tangki sehari (jika satu lori memuatkan 15 m³)'],
 [/^(\d+)% of the methane still escapes$/,'$1% metana masih terlepas'],
 [/^(\d+)% of the water is reused instead of discharged$/,'$1% air diguna semula, bukan dibuang'],
 [/^m³\/day · ≈ ([\d,]+) kWh\*$/,'m³/hari · ≈ $1 kWh*'],
 [/^Step (\d) of 4$/,'Langkah $1 daripada 4'],
 [/^([\d,]+) m³\/day$/,'$1 m³/hari'],
 [/^You changed (\d) things \((.*)\)\. Change one at a time so you know what caused the result\.$/,'Anda mengubah $1 perkara ($2). Ubah satu sahaja supaya anda tahu puncanya.'],
 [/^Mission progress:$/,'Kemajuan misi:'],
 [/^Scenario (\d+) saved\. Open Compare to review your experiments\.$/,'Senario $1 disimpan. Buka Bandingkan untuk menyemak eksperimen anda.']
];
const back=new Map();for(const [en,ms] of D)back.set(ms,en);
function translate(text,to){const lead=text.match(/^\s*/)[0],trail=text.match(/\s*$/)[0],core=text.trim();if(!core)return null;
 if(to==='ms'){const hit=D.get(core);if(hit!==undefined)return lead+hit+trail;for(const [re,rep] of P)if(re.test(core))return lead+core.replace(re,rep)+trail;return null}
 return null}
const originals=new WeakMap(),written=new WeakMap(),attrOrig=new WeakMap(),ATTRS=['placeholder','aria-label','title'];
const skip=el=>el&&(el.closest?.('script,style,textarea,#learn .panel,[data-noi18n]'));
function apply(root=document.body){
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
 while((n=walker.nextNode())){if(skip(n.parentElement))continue;doText(n)}
 root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(doAttrs);if(root.nodeType===1)doAttrs(root);
}
function doText(n){
 if(lang==='ms'){if(originals.has(n)&&n.nodeValue===translate(originals.get(n),'ms'))return;const t=translate(n.nodeValue,'ms');if(t!==null&&t!==n.nodeValue){originals.set(n,n.nodeValue);written.set(n,t);n.nodeValue=t}}
 else if(originals.has(n)){const o=originals.get(n);originals.delete(n);written.set(n,o);if(n.nodeValue!==o)n.nodeValue=o}
}
function doAttrs(el){if(!el.getAttribute||el.closest?.('script,style,#learn .panel,[data-noi18n]'))return;let store=attrOrig.get(el);
 for(const a of ATTRS){const v=el.getAttribute(a);if(v==null)continue;
  if(lang==='ms'){const t=translate(v,'ms');if(t!==null&&t!==v){store??=(attrOrig.set(el,{}),attrOrig.get(el));store[a]=v;el.setAttribute(a,t)}}
  else if(store?.[a]!=null){el.setAttribute(a,store[a]);delete store[a]}}}
let busy=false;
const mo=new MutationObserver(list=>{if(busy)return;busy=true;try{for(const m of list){if(m.type==='characterData'){const n=m.target;if(written.get(n)===n.nodeValue)continue;if(!skip(n.parentElement)){originals.delete(n);doText(n)}}else for(const node of m.addedNodes){if(node.nodeType===3){if(!skip(node.parentElement))doText(node)}else if(node.nodeType===1&&!skip(node))apply(node)}}}finally{busy=false}});
function setLang(next){lang=next;try{localStorage.setItem(KEY,lang)}catch{}document.documentElement.lang=lang==='ms'?'ms':'en';busy=true;apply();busy=false;btn.textContent=lang==='ms'?'EN':'BM';btn.title=lang==='ms'?'Switch to English':'Tukar ke Bahasa Melayu';window.dispatchEvent(new CustomEvent('pome-lang',{detail:lang}))}
window.pomeLang=()=>lang;
window.pomeT=(en,ms)=>lang==='ms'?(ms??translate(en,'ms')?.trim()??en):en;
// Switch button in the header.
const btn=document.createElement('button');btn.className='lang-switch';btn.type='button';btn.onclick=()=>setLang(lang==='ms'?'en':'ms');
(document.querySelector('header nav')||document.querySelector('header'))?.append(btn);
mo.observe(document.body,{subtree:true,childList:true,characterData:true});
setLang(lang);
