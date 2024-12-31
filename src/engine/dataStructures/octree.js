import { OctreeNode } from './nodes.js'
import * as _THREE from 'three'
import * as TSL from 'three/tsl'
import * as WG from 'three/webgpu'

const THREE = {..._THREE,...TSL,...WG}


export class Octree extends THREE.Object3D{
  constructor() {
    super()
  }


  init(worldObjects, minNodeSize) {
    const bounds = new THREE.Box3();
    worldObjects.forEach((obj) => bounds.union(obj.boundingBox));

    const boundsSize = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const maxSize = Math.max(...boundsSize.toArray());
    const sizeVec = new THREE.Vector3(maxSize, maxSize, maxSize).multiplyScalar(0.5);
    bounds.set(center.clone().sub(sizeVec), center.clone().add(sizeVec));

    this.rootNode = new OctreeNode(bounds, minNodeSize);
    this.addObjects(worldObjects);
}

  addObjects(worldObjects) {
      worldObjects.forEach((obj) => {
          obj.octreeCells = [];
          this.rootNode.addObject(obj);
      });
  }

  draw() {
      this.rootNode.draw(this);
  }
}

export function findNeighbors(currentObj, objs) {
  currentObj.octreeCells.forEach((cell) => {
      cell.objID.forEach((id) => {
          const neighbor = objs[id];
          if (currentObj !== neighbor && currentObj.boundingBox.intersectsBox(neighbor.boundingBox)) {
              currentObj.neighbors.add(neighbor.uuid);
          }
      });
  });
}