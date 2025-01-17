import { float, Loop, mx_noise_float, Fn} from 'three/tsl';
import * as THREE from 'three/tsl'


export const FBM = Fn(([position,_unifroms])=>{

    let G = _unifroms.G.toVar()//THREE.pow(2.,-.6).toVar();

    var amplitude = _unifroms.amplitude.toVar()//float(1.0).toVar();

    var frequency = _unifroms.frequency.toVar()//float(1.0).toVar();

    var height    = _unifroms.height.toVar() //float(1.5/8).toVar();

    var iteration = _unifroms.iteration.toVar() //float(50.).toVar()

    var normalization  = _unifroms.normalization.toVar()//float(0.0).toVar();

    var lacunarity     = _unifroms.lacunarity.toVar() //float(1.4).toVar();

    var exponentiation =  _unifroms.exponentiation.toVar() //float(5.).toVar();

    var total = float(0.).toVar();

    Loop( { type: 'float', start: float( 0 ), end: iteration, condition: '<' }, ( { i } ) => {

      const noise =  mx_noise_float(position.mul(frequency)).mul(0.5).add(0.5)

      total.addAssign( noise.mul(amplitude) );

      normalization.addAssign( amplitude);

      amplitude.mulAssign( G );

      frequency.mulAssign( lacunarity );

    } );

   total.divAssign(normalization)

   let totalOut = THREE.pow(total, exponentiation).mul(height)

   return totalOut
  })
