 
import { isWithinBounds } from '../utils.js'
 
export class QuadTree {

  constructor() {

    this.rootNodes = []

  }
  
  insert(OBJECT3D,primitive,quadTreeNode){

    let spatialNode = quadTreeNode.getSpatialNode()

    let distance = spatialNode.position.distanceTo(OBJECT3D.position)
  
    if ( isWithinBounds(distance, primitive, spatialNode.params.size) ) {
  
        if (quadTreeNode._children.length === 0)  quadTreeNode.subdivide(primitive) 
 
          quadTreeNode._children.forEach(child=>this.insert(OBJECT3D,primitive,child))

     }
  }

  visibleNodes(OBJECT3D, primitive, rootNodeQuadTreeNode) {
    
    const nodes = [];

    const traverse = (quadTreeNode) => {

        let spatialNode = quadTreeNode.getSpatialNode()

        const distance = spatialNode.position.distanceTo(OBJECT3D.position);

        if (isWithinBounds(distance, primitive, spatialNode.params.size)) {

          quadTreeNode._children.forEach(traverse);

        } else {

            nodes.push(quadTreeNode);

        }

    };

    traverse(rootNodeQuadTreeNode);

    return nodes;
  }


  update(OBJECT3D, primitive) {
      
    const visibleQuadTreeNodes = new Set();

    this.rootNodes.forEach((quadTreeNode) => this.#_update(OBJECT3D, primitive, quadTreeNode, visibleQuadTreeNodes))
    
    for (const [key, value] of primitive.quadTreeCollections.entries()) {

      if (!visibleQuadTreeNodes.has(key)) {
        
        value.showChildren()

      } 
    } 
  }


 #_update(OBJECT3D, primitive, quadTreeNode, visibleQuadTreeNodes) {
    
    this.insert(OBJECT3D, primitive, quadTreeNode);

    const visibleNodes = this.visibleNodes(OBJECT3D, primitive, quadTreeNode);

    for (const node of visibleNodes) {

      const key = node.getSpatialNode().nodekey;
  
      if (!primitive.quadTreeCollections.has(key)) {

        primitive._createMeshNodes({quadTreeNode:node,initialState:'inactive'})

        primitive.addNode(key,node)

        visibleQuadTreeNodes.add(key);

      } else {

        visibleQuadTreeNodes.add(key);

        //todo
        if (quadTreeNode.getSpatialNode().nodekey === key) {
  
          let value = primitive.quadTreeCollections.get(key)
  
          value.hideChildren()
          
        }
      }
    }
  }
}