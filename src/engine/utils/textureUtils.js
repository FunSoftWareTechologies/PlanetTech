import * as THREE from 'three';
import {norm} from './boundingBoxUtils.js'

export const createTexture = (imageBitmap) => {
    if (imageBitmap) {
        const map = new THREE.CanvasTexture(imageBitmap);
        map.needsUpdate = true;
        map.onUpdate = function () {
        imageBitmap.close();
        };
        return map;
    }
};

export const createUVObject = () => {
    let uv = { scale: 1, offset: new THREE.Vector2(0, 0) };

return {
    update: function (node, scale = 1, Offset = new THREE.Vector2(0, 0)) {
    const { offSets, testscaling } = calculateUV(node, scale, Offset);
    uv.scale = testscaling;
    uv.offset = uv.offset.copy(offSets);
    return this;
    },

    getScale: function () { return uv.scale; },

    getOffset: function () { return uv.offset; },

    setScaleForTexture: function (texture) { texture.repeat.set(this.getScale(), this.getScale())},

    setOffsetForTexture: function (texture) { texture.offset.copy(this.getOffset()); },
};
};

export const calculateUV = (node, scale, Offset) => {
    let maxLevelSize = node.params.levelArchitecture.config.maxLevelSize;
    const w = node.params.size;
    const d = node.params.levelArchitecture.config.dimensions * scale;
    const testscaling = w / (maxLevelSize * d);

    const halfScale = testscaling / 2;

    const texturePosition = correctTexturePosition(node)

    const position = new THREE.Vector3(...texturePosition);
  
    const nxj = norm(position.x, (maxLevelSize * d) / 2, -(maxLevelSize * d) / 2);
    const nyj = norm(position.y, (maxLevelSize * d) / 2, -(maxLevelSize * d) / 2);
    const offSets = new THREE.Vector2(nxj - halfScale, nyj - halfScale).sub(Offset);

    return { offSets, testscaling };
};



export const correctTexturePosition = (node) => {
    const { offset, direction } = node.params;
    const newOffset = [...offset];

    const swapAndModify = (index1, index2, negateIndex) => {
        [newOffset[index1], newOffset[index2]] = [newOffset[index2], newOffset[index1]];
        if (negateIndex !== undefined) newOffset[negateIndex] *= -1;
        return newOffset;
    };

    switch (direction) {
        case '+z':
            return newOffset;

        case '-z':
            newOffset[0] *= -1;
            return newOffset;

        case '+x':
            return swapAndModify(0, 2, 0);

        case '-x':
            return swapAndModify(0, 2);

        case '+y':
            return swapAndModify(1, 2, 1);

        case '-y':
            return swapAndModify(1, 2);

        default:
            throw new Error(`Unknown direction: ${direction}`);
    }
};


export const loader = (meshNode,mesh, uv, src, levelArchitecture, promiseResolve)=>{

    new THREE.ImageBitmapLoader().load( src, (imageBitmap ) =>{
    
        const texture = new THREE.CanvasTexture( imageBitmap );
    
        texture.needsUpdate = true;

        texture.onUpdate = function () {

        imageBitmap.close();

        };

        meshNode.add(mesh)

        levelArchitecture.trigger('afterMeshCreation',meshNode,{uv,texture}) 

        promiseResolve(meshNode);      
 
    })
  
  }


export const cubeloader = (meshNode,mesh, uv, srcs, levelArchitecture, promiseResolve) => {

    loader(meshNode,mesh,uv,srcs[meshNode.params.direction],levelArchitecture, promiseResolve)

}

 
export const setTextures = (params) => {
    const {meshNode,  mesh, srcs, levelArchitecture, promiseResolve } = params;
    const uv  = createUVObject().update(meshNode);
    cubeloader(meshNode,mesh, uv, srcs, levelArchitecture, promiseResolve);
  };