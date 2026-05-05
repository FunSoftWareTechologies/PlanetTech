import * as THREE from 'three'

export function getMinLevelSize(size, levels){ return size / Math.pow(2, levels - 1) }



export class Blueprint {

  constructor(params) { this.init(params) }

  init(params){

    const size         = params.size         = params.size         ||  1
    const resolution   = params.resolution   = params.resolution   ||  1
    const dimension    = params.dimension    = params.dimension    ||  1
    const levels       = params.levels       = params.levels       ||  1
     
    const nodeCreated  = params.nodeCreated  = params.nodeCreated  || ((node,payLoad)=>{})
    const nodeDestroid = params.nodeDestroid = params.nodeDestroid || ((node,payLoad)=>{})
    const nodeUpdated  = params.nodeUpdated  = params.nodeUpdated  || ((node,payLoad)=>{})

     this.config = {
      maxLevelSize:size,
      minLevelSize:getMinLevelSize(size, levels),
      minResolution:resolution,
      maxResolution:undefined,
      dimensions:dimension,
      arraybuffers:{},
      scale: new THREE.Vector3(1, 1, 1),
      lodDistanceOffset: 1,
      displacmentScale:1,
      nodeCreated,
      nodeDestroid,
      nodeUpdated
     } 

    this.levels(levels);
    this.createArrayBuffers();
  }

  levels(numOflvls) {
    var levelsArray           = [];
    var resolutionPerLevel    = [];
    var maxLevelInstanceCount = [];
    var value         = this.config.maxLevelSize
    var min           = this.config.minLevelSize
    var minResolution = this.config.minResolution
    var dimensions    = (this.config.dimensions ** 2)
     
    for (let i = 0; i < numOflvls; i++) {
      levelsArray           .push( value )
      resolutionPerLevel    .push( minResolution )
      maxLevelInstanceCount .push( dimensions )

      value         /= 2
      minResolution *= 2
      dimensions    *= 4
    }

    this.config['levels'] = {
      numOflvls,
      levelsArray,
      resolutionPerLevel,
      maxLevelInstanceCount,
    }

    this.config['maxResolution'] = resolutionPerLevel[resolutionPerLevel.length - 1]
  }



  createArrayBuffers(){
    for ( var i = 0; i < this.config.levels.numOflvls;  i++ ) {
      const size  = this.config.levels.levelsArray [i]
      const resolution  = this.config.levels.resolutionPerLevel[i]
      this.config.arraybuffers[size] = {
         geometryData:{
          parameters: {
            width: size,
            height:size,
            widthSegments: resolution,
            heightSegments:resolution
          },
          byteFlags: {
            byteLengthUv:       (resolution+1) * (resolution+1) * 2 * 4,
            byteLengthPosition: (resolution+1) * (resolution+1) * 3 * 4,
            byteLengthNormal:   (resolution+1) * (resolution+1) * 3 * 4,
            byteLengthIndex:    resolution * resolution * 6 * 4
          },
          geometry:new THREE.PlaneGeometry(
              size,
              size,
              resolution,
              resolution
            )
        }
      }
    }
  }
  
  getFaceData(idx, x, y, z){
  
    const func = [

      function initPositiveZ(x, y, z){
        return {pos: new THREE.Vector3(x, -y, z) , direction:'+z', rot: new THREE.Euler(0, 0, 0)}
      },

      function initNegativeZ(x, y, z){
        return {pos: new THREE.Vector3(x, -y, -z) , direction:'-z', rot: new THREE.Euler(0, Math.PI, 0)}
      },

      function initPositiveX(x, y, z){
        return {pos: new THREE.Vector3(z, -y, -x) , direction:'+x', rot: new THREE.Euler(0,  Math.PI / 2, 0)}
      },

      function initNegativeX(x, y, z){
        return {pos: new THREE.Vector3(-z, -y, -x) , direction:'-x', rot: new THREE.Euler(0, -Math.PI / 2, 0)}
      },

      function initPositiveY(x, y, z){
        return {pos: new THREE.Vector3(y, z, x) , direction:'+y', rot: new THREE.Euler(-Math.PI / 2, 0, 0)}
      },

      function initNegativeY(x, y, z){
        return {pos: new THREE.Vector3(y, -z, x) , direction:'-y', rot: new THREE.Euler( Math.PI / 2, 0, 0)}
      }
    ]

    const { maxLevelSize: w, dimensions: d, scale: s} = this.config;

    const k_ = (w / 2) ;

    const result = func[idx](x, y, z)

    const {pos, direction, rot} = result

    const matrix     = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromEuler(rot);
    matrix.compose(pos, quaternion, s);

    const rootBounds = new THREE.Box3(
        new THREE.Vector3(-k_, -k_, 0),
        new THREE.Vector3( k_,  k_, 0)
    );



    return {pos, direction, matrix, rootBounds}

  } 



}