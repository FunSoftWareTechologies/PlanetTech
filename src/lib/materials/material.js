import * as THREE from 'three'



    let vertexShader = /* glsl */`
      #include <common>
      
      #include <logdepthbuf_pars_vertex>

      #include <batching_pars_vertex>
 

      //inject uniforms
 

      void vertMain(){}

      void main() {

        #include <batching_vertex>   
 
        vec4 world = batchingMatrix * vec4(position, 1.0);

        //inject
 
        vertMain();

        gl_Position = projectionMatrix * modelViewMatrix * world;

        #include <logdepthbuf_vertex>
      }
    `;
 
    let fragmentShader = /* glsl */`
      #include <common>
      #include <logdepthbuf_pars_fragment>

      void fragMain(){}

      void main() {

        #include <logdepthbuf_fragment>

        vec4 worldColor = vec4(0.,0.,0.,1.);

        fragMain();

        gl_FragColor = worldColor;
      }
    `;
 

export class QuadMaterial extends THREE.ShaderMaterial{
  constructor( params = {}){

    const _params = Object.assign({
      vertMain : 'void vertMain(){}', 
      fragMain : 'void fragMain(){}', 
      uniforms : {}
    },params)

    vertexShader   = vertexShader.replace('void vertMain(){}',_params.vertMain )
    fragmentShader = fragmentShader.replace('void fragMain(){}',_params.fragMain )

    super({
      fragmentShader ,
      vertexShader , 
      uniforms:_params.uniforms
    })
  }
}


export class SphereMaterial extends THREE.ShaderMaterial{

  constructor( params = {} ){

    const _params = Object.assign({
      vertMain : 'void vertMain(){}', 
      fragMain : 'void fragMain(){}', 
      uniforms : {radius:{value:0}}
    },params)

    vertexShader   = vertexShader.replace('//inject uniforms',`uniform float radius;`)
    vertexShader   = vertexShader.replace('//inject',`world = vec4(normalize(world.xyz) * radius, 1.0);`)
    vertexShader   = vertexShader.replace('void vertMain(){}',_params.vertMain )
    fragmentShader = fragmentShader.replace('void fragMain(){}',_params.fragMain )

    super({
      fragmentShader ,
      vertexShader , 
      uniforms:_params.uniforms
    })
  }
}