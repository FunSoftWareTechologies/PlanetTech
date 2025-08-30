import * as THREE from 'three'

export class PlanetMaterial extends THREE.ShaderMaterial {

  constructor(parameters) {
    super();

    this.uniforms = {
      resolution: { value: parameters.resolution || 256 },
      // textures
      cubeNormal: { value: parameters.cubeNormal },
      cubeDisplacements: { value: parameters.cubeDisplacements },
      cubeColor: { value: parameters.cubeColor },
      // check if textures are provided
      hasNormals: { value: parameters.cubeNormal ? true : false },
      hasColors:  { value: parameters.cubeColor ? true : false },
    };

    this.vertexShader =`
        varying vec3 vPosition;
        uniform samplerCube cubeDisplacements;  

        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`

    this.fragmentShader = `
        varying vec3 vPosition;
        uniform samplerCube cubeNormal;  
        uniform samplerCube cubeDisplacements;  
        uniform samplerCube cubeColor;  

        uniform bool hasNormals;
        uniform bool hasColors;

        vec4 baseColor; 
        vec4 baseNormal; 

        void main() {
            baseColor  = vec4(1.0); 
            baseNormal = vec4(1.0); 
            if(hasNormals){ baseNormal = textureCube(cubeNormal, vPosition );}
            if(hasColors){ baseColor  = textureCube(cubeColor,  vPosition );}
            gl_FragColor = baseColor;
        }`
   }

  onBeforeRender( ){
    this.uniforms.hasNormals.value = this.uniforms.cubeNormal ? true : false
    this.uniforms.hasColors.value = this.uniforms.cubeColor ? true : false
  }
}