export const QUIZ_POWERS={
 gesture:{title:'1–4 Jari',icon:'✋',hint:'1 jari = A · 2 = B · 3 = C · 4 = D. Tahan masa yang dipilih; ibu jari turut dikira.'},
 face:{title:'Gerak Kepala',icon:'🙂',hint:'Pandang tengah 1 saat. Pusing kiri = A · kanan = B · angkat dagu = C · tunduk = D. Tahan masa yang dipilih.'},
 orb:{title:'Magic Orb',icon:'🔮',hint:'Halakan telunjuk ke kad jawapan dan tahan orb selama masa yang dipilih.'},
 fire:{title:'Fireball',icon:'🔥',hint:'Sasar kad dengan telunjuk dahulu, kemudian cubit ibu jari + telunjuk selama masa yang dipilih.'}
};
// A pinch moves the index fingertip: retain the aimed card during the shot.
export class FireAim{
 constructor(){this.reset()}
 reset(){this.target=null;this.at=0;this.pinched=false}
 update(target,pinched,now,isValid=t=>!!t){
  if(!pinched){this.pinched=false;if(isValid(target)){this.target=target;this.at=now}else if(now-this.at>1800)this.target=null;return isValid(target)?target:null}
  if(!this.pinched){this.pinched=true;if(!isValid(this.target)||now-this.at>1800)this.target=isValid(target)?target:null}
  return isValid(this.target)?this.target:null;
 }
}
