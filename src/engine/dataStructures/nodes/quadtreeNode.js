import * as THREE from 'three'
 

export class SpatialNode extends THREE.Object3D{

            constructor(bounds, level, transformMatrix, direction, index) {
                super();
                this.bounds          = bounds;
                this.level           = level;
                this.transformMatrix = transformMatrix;
                this.direction       = direction;
                this.index           = index;
                this.children        = [];
                this.isSubdivided    = false;
                this.disposeTimer    = null;
                this.worldBox        = this._buildWorldBox();
            }

            generateKey (position) {
              const { index, direction } = this;
              const { x, y, z } = position;
              return `${index}_${direction}_${Math.round(x)}_${Math.round(y)}_${Math.round(z)}`;
            }

            _buildWorldBox() {

            }

        }


 