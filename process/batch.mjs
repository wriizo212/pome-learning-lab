import * as T from './three.module.min.js';

// Merge rigid equipment in local coordinates. Each batch still belongs to one pickable station.
export function batchStations(groups,pickables,panels,movers){
 const removable=new Set(panels);pickables.length=0;panels.length=0;
 for(const group of groups){
  const batches=new Map();
  for(const mesh of [...group.children]){
   if(!mesh.isMesh||mesh.isInstancedMesh||movers.has(mesh)){if(mesh.isMesh)pickables.push(mesh);continue}
   const key=mesh.material.uuid+removable.has(mesh);
   if(!batches.has(key))batches.set(key,[]);batches.get(key).push(mesh);
  }
  for(const meshes of batches.values()){
   const positions=[],normals=[],uvs=[],indices=[];
   for(const mesh of meshes){
    mesh.updateMatrix();const geo=mesh.geometry.clone().applyMatrix4(mesh.matrix);
    const offset=positions.length/3;
    positions.push(...geo.attributes.position.array);normals.push(...geo.attributes.normal.array);uvs.push(...geo.attributes.uv.array);
    if(geo.index)for(const i of geo.index.array)indices.push(offset+i);
    else for(let i=0;i<geo.attributes.position.count;i++)indices.push(offset+i);
    group.remove(mesh);geo.dispose();
   }
   const geometry=new T.BufferGeometry();
   geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
   geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
   geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeBoundingSphere();
   const combined=new T.Mesh(geometry,meshes[0].material);combined.castShadow=combined.receiveShadow=true;
   group.add(combined);pickables.push(combined);if(removable.has(meshes[0]))panels.push(combined);
  }
 }
}
