import * as THREE from 'three';
import { describe, it, expect, beforeEach } from 'vitest';
import { Node } from '../src/engine/dataStructures/nodes.js';


describe('Node class', () => {
  let node;
  let mesh;

  beforeEach(() => {
    const params = { someParam: 'value' };
    const state = 'inactive';
    node = new Node(params, state);
    
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    mesh = new THREE.Mesh(geometry, material);
  });

  it('constructor initializes correctly', () => {
    expect(node.params).toEqual({ someParam: 'value' });
    expect(node.state).toBe('inactive');
    expect(node._children).toEqual([]);
  });

  it('add() adds a child and sets visibility based on state', () => {
    node.add(mesh);
    expect(node.children.length).toBe(1);
    expect(node.children[0]).toBe(mesh);
    expect(mesh.material.visible).toBe(false);

    node.state = 'active';
    const newMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    node.add(newMesh);
    expect(newMesh.material.visible).toBe(true);
  });

  it('attach() attaches a child and sets visibility based on state', () => {
    node.attach(mesh);
    expect(node.children.length).toBe(1);
    expect(node.children[0]).toBe(mesh);
    expect(mesh.material.visible).toBe(false);

    node.state = 'active';
    const newMesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    node.attach(newMesh);
    expect(newMesh.material.visible).toBe(true);
  });

  it('mesh() returns the first child', () => {
    expect(node.mesh()).toBeUndefined();
    node.add(mesh);
    expect(node.mesh()).toBe(mesh);
  });

  it('showMesh() activates the state and makes the mesh visible', () => {
    node.add(mesh);
    expect(mesh.material.visible).toBe(false);

    node.showMesh();
    expect(mesh.material.visible).toBe(true);
    expect(node.state).toBe('active');
  });

  it('hideMesh() deactivates the state and makes the mesh invisible', () => {
    node.state = 'active';
    node.add(mesh);
    node.showMesh(); // Ensure mesh is visible first

    node.hideMesh();
    expect(mesh.material.visible).toBe(false);
    expect(node.state).toBe('inactive');
  });
});
