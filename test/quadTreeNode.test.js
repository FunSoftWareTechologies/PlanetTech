import * as THREE from 'three';
import { describe, it, expect, beforeEach,vi } from 'vitest';
import { QuadTreeNode,MeshNode,SpatialNode} from '../src/engine/dataStructures/nodes.js';


 
  
  describe('QuadTreeNode class', () => {
    let quadTreeNode;
    let meshNode;
    let spatialNode;
  
    beforeEach(() => {
      const sharderParameters = { param1: 'value1' };
      quadTreeNode = new QuadTreeNode(sharderParameters);
  
      meshNode = new MeshNode();
  
      const spatialParams = {
        size: 100,
        offset: [0, 0, 0],
        direction: 'z',
        depth: 0,
        index: '0',
        controller: { config: { radius: 50 } },
      };
      spatialNode = new SpatialNode(spatialParams, true);
  
      // Mock children of the spatial node
      spatialNode._children = [
        new QuadTreeNode(sharderParameters),
        new QuadTreeNode(sharderParameters),
      ];
  
      spatialNode._children.forEach(child => {
        child.getMeshNode = vi.fn().mockResolvedValue(new MeshNode());
        child.getSpatialNode = vi.fn().mockReturnValue(new SpatialNode(spatialParams, true));
      });
    });
  
    it('constructor initializes correctly', () => {
      expect(quadTreeNode.sharderParameters).toEqual({ param1: 'value1' });
    });
  
    it('add() correctly assigns meshNode and spatialNode', () => {
      quadTreeNode.add(meshNode);
      expect(quadTreeNode.getMeshNode()).toBe(meshNode);
  
      quadTreeNode.add(spatialNode);
      expect(quadTreeNode.getSpatialNode()).toBe(spatialNode);
    });
  
    it('setMeshNode() and setSpatialNode() set private properties correctly', () => {
      quadTreeNode.setMeshNode(meshNode);
      expect(quadTreeNode.getMeshNode()).toBe(meshNode);
  
      quadTreeNode.setSpatialNode(spatialNode);
      expect(quadTreeNode.getSpatialNode()).toBe(spatialNode);
    });
  
    it('hideChildren() hides children correctly', async () => {
      quadTreeNode.setMeshNode(meshNode);
      quadTreeNode.setSpatialNode(spatialNode);
  
      const hideMeshSpy = vi.spyOn(meshNode, 'hideMesh');
      const spatialHideMeshSpy = vi.spyOn(spatialNode, 'hideMesh');
  
      await quadTreeNode.hideChildren();
  
      expect(hideMeshSpy).toHaveBeenCalled();
      expect(spatialHideMeshSpy).toHaveBeenCalled();
  
      spatialNode._children.forEach(child => {
        const childMeshNode = child.getMeshNode.mock.results[0].value;
        const childSpatialNode = child.getSpatialNode();
  
        expect(childMeshNode.hideMesh).toHaveBeenCalled();
        expect(childSpatialNode.hideMesh).toHaveBeenCalled();
      });
    });
  
    it('showChildren() shows children correctly', async () => {
      quadTreeNode.setMeshNode(meshNode);
      quadTreeNode.setSpatialNode(spatialNode);
  
      const showMeshSpy = vi.spyOn(meshNode, 'showMesh');
      const spatialShowMeshSpy = vi.spyOn(spatialNode, 'showMesh');
  
      await quadTreeNode.showChildren();
  
      expect(showMeshSpy).toHaveBeenCalled();
      expect(spatialShowMeshSpy).toHaveBeenCalled();
  
      spatialNode._children.forEach(child => {
        const childMeshNode = child.getMeshNode.mock.results[0].value;
        const childSpatialNode = child.getSpatialNode();
  
        expect(childMeshNode.showMesh).toHaveBeenCalled();
        expect(childSpatialNode.showMesh).toHaveBeenCalled();
      });
    });
  });
  