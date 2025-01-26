import * as THREE from 'three'


export class QuadGeometry extends THREE.BufferGeometry {

	constructor( 
		width = 1, 
		height = 1, 
		widthSegments = 1, 
		heightSegments = 1, 
	) {

		super();

		this.type = 'QuadGeometry';

		this.parameters = {
			width: width,
			height: height,
			widthSegments: widthSegments,
			heightSegments: heightSegments
		};

	}

    _setMatrix({matrix = new THREE.Matrix4() }){
        this._matrix = matrix
    }

    _setOffset({offset = [0,0,0]}){
        this._offset = offset
    }

    _build(){
        const width_half = this.parameters.width / 2;
		const height_half = this.parameters.height / 2;

		const gridX = Math.floor( this.parameters.widthSegments );
		const gridY = Math.floor( this.parameters.heightSegments );

		const gridX1 = gridX + 1;
		const gridY1 = gridY + 1;

		const segment_width = this.parameters.width / gridX;
		const segment_height = this.parameters.height / gridY;

        const indices  = [];
		const vertices = [];
		const normals  = [];
		const uvs = [];

        this._matrix.premultiply(new THREE.Matrix4().makeTranslation(...this._offset));

        const _W = new THREE.Vector3();
        const _D = new THREE.Vector3();

        for ( let iy = 0; iy < gridY1; iy ++ ) {

			const y = iy * segment_height - height_half;

			for ( let ix = 0; ix < gridX1; ix ++ ) {

				const x = ix * segment_width - width_half;

				_W.set(x, - y, 0)

				_W.applyMatrix4( this._matrix );

				vertices.push( _W.x, _W.y, _W.z );

				normals.push( 0, 0, 1 );

				uvs.push( ix / gridX );
				uvs.push( 1 - ( iy / gridY ) );

			}

		}

		for ( let iy = 0; iy < gridY; iy ++ ) {

			for ( let ix = 0; ix < gridX; ix ++ ) {

				const a = ix + gridX1 * iy;
				const b = ix + gridX1 * ( iy + 1 );
				const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
				const d = ( ix + 1 ) + gridX1 * iy;

				indices.push( a, b, d );
				indices.push( b, c, d );

			}
		}
		this.setIndex( indices );
		this.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		this.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
		this.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
    }

	_threadingBuild(buffers){
		const width_half  = this.parameters.width / 2;
		const height_half = this.parameters.height / 2;

		const gridX = Math.floor( this.parameters.widthSegments );
		const gridY = Math.floor( this.parameters.heightSegments );

		const gridX1 = gridX + 1;
		const gridY1 = gridY + 1;

		const segment_width = this.parameters.width / gridX;
		const segment_height = this.parameters.height / gridY;


		this._matrix.premultiply(new THREE.Matrix4().makeTranslation(...this._offset));

		const _W = new THREE.Vector3();
		const _D = new THREE.Vector3();

		let vertexIndex = 0;
		let normalIndex = 0;
		let uvIndex = 0;
		let indexPointer = 0;

		for (let iy = 0; iy < gridY1; iy++) {
			const y = iy * segment_height - height_half;

			for (let ix = 0; ix < gridX1; ix++) {
				const x = ix * segment_width - width_half;

				_W.set(x, -y, 0);
				_W.applyMatrix4(this._matrix);

				// Add vertex position
				buffers.positionBuffer[vertexIndex++] = _W.x;
				buffers.positionBuffer[vertexIndex++] = _W.y;
				buffers.positionBuffer[vertexIndex++] = _W.z;

				// Add normal (static in this case)
				buffers.normalBuffer[normalIndex++] = 0;
				buffers.normalBuffer[normalIndex++] = 0;
				buffers.normalBuffer[normalIndex++] = 1;

				// Add UV coordinates
				buffers.uvBuffer[uvIndex++] = ix / gridX;
				buffers.uvBuffer[uvIndex++] = 1 - iy / gridY;
			}
		}

		for ( let iy = 0; iy < gridY; iy ++ ) {

			for ( let ix = 0; ix < gridX; ix ++ ) {

				const a = ix + gridX1 * iy;
				const b = ix + gridX1 * ( iy + 1 );
				const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
				const d = ( ix + 1 ) + gridX1 * iy;

				buffers.indexBuffer[indexPointer++] = a;
				buffers.indexBuffer[indexPointer++] = b;
				buffers.indexBuffer[indexPointer++] = d;

				buffers.indexBuffer[indexPointer++] = b;
				buffers.indexBuffer[indexPointer++] = c;
				buffers.indexBuffer[indexPointer++] = d;

			}
		}

		this.setIndex(  Array.from(buffers.indexBuffer)  );
		this.setAttribute( 'position', new THREE.Float32BufferAttribute( buffers.positionBuffer , 3 ) );
		this.setAttribute( 'normal', new THREE.Float32BufferAttribute(  buffers.normalBuffer , 3 ) );
		this.setAttribute( 'uv', new THREE.Float32BufferAttribute(  buffers.uvBuffer , 2 ) );

	}

	_restGeometry(centerdPosition){
        this.computeBoundingBox();
        this.boundingBox.getCenter(centerdPosition);
        this.center();
 	}

	copy( source ) {

		super.copy( source );

		this.parameters = Object.assign( {}, source.parameters );

		return this;

	}

	static fromJSON( data ) {

		return new QuadGeometry( data.width, data.height, data.widthSegments, data.heightSegments );

	}

}


export class NormalizedQuadGeometry extends QuadGeometry {
    constructor(		
        width = 1, 
		height = 1, 
		widthSegments = 1, 
		heightSegments = 1,
        radius = 1 
    ){

        super(width,height,widthSegments,heightSegments)

        this.parameters.radius = radius

        this.type = 'NormalizedQuadGeometry';

    }

    _build(){
        const width_half = this.parameters.width / 2;
		const height_half = this.parameters.height / 2;

		const gridX = Math.floor( this.parameters.widthSegments );
		const gridY = Math.floor( this.parameters.heightSegments );

		const gridX1 = gridX + 1;
		const gridY1 = gridY + 1;

		const segment_width = this.parameters.width / gridX;
		const segment_height = this.parameters.height / gridY;

        const uvs = [];
        const indices  = [];
		const vertices = [];
		const normals  = [];
        const directionVectors = [];


        this._matrix.premultiply(new THREE.Matrix4().makeTranslation(...this._offset));

        const _W = new THREE.Vector3();
        const _D = new THREE.Vector3();

        for ( let iy = 0; iy < gridY1; iy ++ ) {

			const y = iy * segment_height - height_half;

			for ( let ix = 0; ix < gridX1; ix ++ ) {

				const x = ix * segment_width - width_half;

				_W.set(x, - y, 0)

				_W.applyMatrix4( this._matrix );

                _W.normalize()

                _D.copy(_W)

                _W.multiplyScalar(this.parameters.radius)
                
                _W.add(_D)

				vertices.push( _W.x, _W.y, _W.z );

				normals.push( 0, 0, 1 );

                directionVectors.push(_D.x, _D.y, _D.z)

				uvs.push( ix / gridX );
				uvs.push( 1 - ( iy / gridY ) );

			}

		}

		for ( let iy = 0; iy < gridY; iy ++ ) {

			for ( let ix = 0; ix < gridX; ix ++ ) {

				const a = ix + gridX1 * iy;
				const b = ix + gridX1 * ( iy + 1 );
				const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
				const d = ( ix + 1 ) + gridX1 * iy;

				indices.push( a, b, d );
				indices.push( b, c, d );

			}

		}

 
			this.setIndex( indices );
			this.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
			this.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
			this.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
			//this.setAttribute( 'directionVectors', new THREE.Float32BufferAttribute( directionVectors, 3 ) );

    }


	_threadingBuild(buffers){
		const width_half  = this.parameters.width / 2;
		const height_half = this.parameters.height / 2;

		const gridX = Math.floor( this.parameters.widthSegments );
		const gridY = Math.floor( this.parameters.heightSegments );

		const gridX1 = gridX + 1;
		const gridY1 = gridY + 1;

		const segment_width = this.parameters.width / gridX;
		const segment_height = this.parameters.height / gridY;


		this._matrix.premultiply(new THREE.Matrix4().makeTranslation(...this._offset));

		const _W = new THREE.Vector3();
		const _D = new THREE.Vector3();

		let vertexIndex = 0;
		let normalIndex = 0;
		let uvIndex = 0;
		let indexPointer = 0;
		let dirVectIndex = 0;

		for (let iy = 0; iy < gridY1; iy++) {
			const y = iy * segment_height - height_half;

			for (let ix = 0; ix < gridX1; ix++) {
				const x = ix * segment_width - width_half;

				_W.set(x, - y, 0)

				_W.applyMatrix4( this._matrix );

                _W.normalize()

                _D.copy(_W)

                _W.multiplyScalar(this.parameters.radius)
                
                _W.add(_D)

				// Add vertex position
				buffers.positionBuffer[vertexIndex++] = _W.x;
				buffers.positionBuffer[vertexIndex++] = _W.y;
				buffers.positionBuffer[vertexIndex++] = _W.z;

				// Add normal (static in this case)  //todo
				buffers.normalBuffer[normalIndex++] = _D.x;
				buffers.normalBuffer[normalIndex++] = _D.y;
				buffers.normalBuffer[normalIndex++] = _D.z;

				// Add UV coordinates  
				buffers.uvBuffer[uvIndex++] = ix / gridX;
				buffers.uvBuffer[uvIndex++] = 1 - iy / gridY;

				//todo
				//buffers.dirVectBuffer[dirVectIndex++] = _D.x;
				//buffers.dirVectBuffer[dirVectIndex++] = _D.y;
				//buffers.dirVectBuffer[dirVectIndex++] = _D.z;
			}
		}

		for ( let iy = 0; iy < gridY; iy ++ ) {

			for ( let ix = 0; ix < gridX; ix ++ ) {

				const a = ix + gridX1 * iy;
				const b = ix + gridX1 * ( iy + 1 );
				const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
				const d = ( ix + 1 ) + gridX1 * iy;

				buffers.indexBuffer[indexPointer++] = a;
				buffers.indexBuffer[indexPointer++] = b;
				buffers.indexBuffer[indexPointer++] = d;

				buffers.indexBuffer[indexPointer++] = b;
				buffers.indexBuffer[indexPointer++] = c;
				buffers.indexBuffer[indexPointer++] = d;

			}
		}


		this.setIndex(  Array.from(buffers.indexBuffer)   );
		this.setAttribute( 'position', new THREE.Float32BufferAttribute( buffers.positionBuffer , 3 ) );
		this.setAttribute( 'normal', new THREE.Float32BufferAttribute(  buffers.normalBuffer , 3 ) );
		this.setAttribute( 'uv', new THREE.Float32BufferAttribute(  buffers.uvBuffer, 2 ) );
		//this.setAttribute( 'directionVectors', new THREE.Float32BufferAttribute( buffers.dirVectBuffer , 3 ) );
	}


    static fromJSON( data ) {

		return new NormalizedQuadGeometry( data.width, data.height, data.widthSegments, data.heightSegments, data.radius );

	}
}


export const geometrySelector = (primitive) =>{

    let geometryClass     = QuadGeometry  
    let additionalPayload = { }
    if (primitive.constructor.__type === 'Sphere'){
       geometryClass     =  NormalizedQuadGeometry 
       additionalPayload = { radius: primitive.levelArchitecture.config.radius }
    }

	return {
		geometryClass,
		additionalPayload
	}
}