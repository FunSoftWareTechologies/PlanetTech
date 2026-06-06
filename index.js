
/*import  * as PixelMachine      from  '@funsoftware/pixelmachine'
import  * as SpatialPrimitives  from  '@funsoftware/spatialprimitives'
import  * as VirtualTexture    from  '@funsoftware/virtualtexture'
 
export const LIBRARY = {
    PixelMachine,
    SpatialPrimitives,
    VirtualTexture
}*/


export * from './src/lib/materials/worldMaterial.js'
export * from './src/lib/meshes/worldMesh.js'
export * from './src/lib/textures/virtualTexture/virtualTexture.js'

import {VTDebugger}   from  '@funsoftware/virtualtexture'


export const EXTENTIONS = {
    VirtualTexture:{ VTDebugger }
}