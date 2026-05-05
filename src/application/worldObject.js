import * as THREE from 'three'
import { OcTree } from '../engine/spatialObjects/spatialStructure.js'


export class WorldObject extends THREE.Mesh {

    constructor(){
        super()
    }

    initOctree( config,callBacks ){
        this.octree = new OcTree( config,callBacks)
        return this
    }

    insert( bounds, dynamic = false ){
        this.octree.insert({bounds,dynamic})  
        return this     
    }

    initPhysics( ){

    }

    onBeforeRender(){
        
    }
}