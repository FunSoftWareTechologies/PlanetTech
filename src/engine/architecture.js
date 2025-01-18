import * as _THREE from 'three'
import * as TSL from 'three/tsl'
import * as WG from 'three/webgpu'

const THREE = {..._THREE,...TSL,...WG}

export class Architecture {

  constructor(config = {}) {
    let shardedData = {
      maxLevelSize:1,
      minLevelSize:1,
      minPolyCount:1,
      maxPolyCount:undefined,
      dimensions:1,
      arrybuffers:{},
      scale: 1,
      lodDistanceOffset: 1,
      displacmentScale:1,
      material: new THREE.MeshBasicMaterial({ color: new THREE.Color( 0xffffff )}),
      callBacks:{
        afterMeshNodeCreation:    (node) => undefined,
        afterSpatialNodeCreation: (node) => undefined,
        afterMeshCreation:        (node,payload) => undefined,
        setTextures:              (  ) => undefined,
      },
     }
    this.config = Object.assign( shardedData, config )
  }

  levels(numOflvls) {
    var levelsArray      = [];
    var polyPerLevel     = [];
    let maxLevelVertexCount   = []
    let maxLevelIndexCount    = []
    var maxLevelInstanceCount = [];
    var value        = this.config.maxLevelSize
    var min          = this.config.minLevelSize
    var minPoly      = this.config.minPolyCount
    var dimensions   = (this.config.dimensions ** 2)
     
    for (let i = 0; i < numOflvls; i++) {
        levelsArray           .push( value   )
        polyPerLevel          .push( minPoly )
        maxLevelInstanceCount .push( dimensions * 6)
        maxLevelVertexCount   .push(((minPoly+1)*(minPoly+1))*(dimensions* 6))
        maxLevelIndexCount    .push(((minPoly**2)*6)*(dimensions * 6))

        value   = ( value / 2   )
        minPoly = ( minPoly * 2 )
        dimensions = dimensions * 4
    }

    this.config['levels'] = {
      numOflvls,
      levelsArray,
      polyPerLevel,
      maxLevelIndexCount,
      maxLevelVertexCount,
      maxLevelInstanceCount,

    }

    this.config['maxPolyCount'] = polyPerLevel[polyPerLevel.length - 1]
  }

  createArrayBuffers(){
    for ( var i = 0; i < this.config.levels.numOflvls;  i++ ) {
      const size  = this.config.levels.levelsArray [i]
      const poly  = this.config.levels.polyPerLevel[i]
      this.config.arrybuffers[size] = {
        geometryData:{
          parameters: {
            width: size,
            height:size,
            widthSegments: poly,
            heightSegments:poly
          },
          byteLengthUv:       (poly+1) * (poly+1) * 2 * 4,
          byteLengthPosition: (poly+1) * (poly+1) * 3 * 4,
          byteLengthNormal:   (poly+1) * (poly+1) * 3 * 4,
          byteLengthIndex:    poly * poly * 6 * 4,
        }
      }
    }
  } 

  setCallBacks(callBacks){
    this.config.callBacks = Object.assign(this.config.callBacks,callBacks) 
  }
}
