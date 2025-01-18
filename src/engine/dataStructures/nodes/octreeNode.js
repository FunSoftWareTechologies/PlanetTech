import * as _THREE from 'three'
import * as TSL from 'three/tsl'
import * as WG from 'three/webgpu'
import { Node } from './baseNode.js'
const THREE = {..._THREE,...TSL,...WG}


export class OctreeNode extends Node{
    constructor(bounds, minNodeSize) {
        super()
        this.objIDs = [];
        this.nodeBounds = bounds;
        this.minSize = minNodeSize;
  
        // Calculate bounds for child nodes
        const boundsSize = this.nodeBounds.getSize(new THREE.Vector3());
        const halfSize = boundsSize.y / 2;
        const quarterSize = boundsSize.y / 4;
        const childSize = new THREE.Vector3(halfSize, halfSize, halfSize);
        const center = this.nodeBounds.getCenter(new THREE.Vector3());
  
        // Generate child bounds
        this.childBounds = Array(8)
            .fill(null)
            .map((_, i) => {
                const offset = new THREE.Vector3(
                    ((i & 1) === 0 ? -1 : 1) * quarterSize,
                    ((i & 2) === 0 ? 1 : -1) * quarterSize,
                    ((i & 4) === 0 ? -1 : 1) * quarterSize
                );
                const childCenter = center.clone().add(offset);
                return new THREE.Box3().setFromCenterAndSize(childCenter, childSize);
            });
  
        this.children = [];
    }
  
    addObject(obj) {
        this.divideAndAdd(obj);
    }
  
    divideAndAdd(obj) {
        const box = obj.boundingBox;
  
        const boundsSize = this.nodeBounds.getSize(new THREE.Vector3());
        if (boundsSize.y <= this.minSize) {
            this.objIDs.push(obj.uuid);
            obj.octreeCells.push({ objID: this.objIDs, nodeBounds: this.nodeBounds });
            return;
        }
  
        if (this.children.length === 0) {
            this.children = Array(8).fill(null);
        }
  
        let isDivided = false;
        this.childBounds.forEach((childBound, i) => {
            if (childBound.intersectsBox(box)) {
                if (!this.children[i]) {
                    this.children[i] = new OctreeNode(childBound, this.minSize);
                }
                this.children[i].divideAndAdd(obj);
                isDivided = true;
            }
        });
  
        if (!isDivided) {
            this.children = [];
        }
    }
  
    draw(octTree) {
      octTree.add(new THREE.Box3Helper(this.nodeBounds, 'green'));
        this.children.forEach((child) => {
            if (child) child.draw(octTree);
        });
    }
  }
  
  
  