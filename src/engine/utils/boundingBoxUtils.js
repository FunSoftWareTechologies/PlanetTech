import * as THREE from 'three';
 

export const box3Mesh = (boundingBox, color) => new THREE.Box3Helper(boundingBox, color);

 
export const project = (normalizedCenter, radius, center) => {
  let W = new THREE.Vector3();
  normalizedCenter.sub(center).normalize();
  W.copy(normalizedCenter);
  normalizedCenter.multiplyScalar(radius);
  normalizedCenter.add(center).add(W);
  return normalizedCenter
};

export const createLocations = (size, offset, axis) => {
  const halfSize = size;
  let points;

  switch (axis) {
    case 'z':
      points = [
        [ halfSize + offset[0],  halfSize + offset[1], offset[2]], // A
        [-halfSize + offset[0],  halfSize + offset[1], offset[2]], // B
        [ halfSize + offset[0], -halfSize + offset[1], offset[2]], // C
        [-halfSize + offset[0], -halfSize + offset[1], offset[2]], // D
      ];
      break;
    case 'x':
      points = [
        [offset[0],  halfSize + offset[1],  halfSize + offset[2]], // A
        [offset[0],  halfSize + offset[1], -halfSize + offset[2]], // B
        [offset[0], -halfSize + offset[1],  halfSize + offset[2]], // C
        [offset[0], -halfSize + offset[1], -halfSize + offset[2]], // D
      ];
      break;
    case 'y':
      points = [
        [ halfSize + offset[0], offset[1],  halfSize + offset[2]], // A
        [-halfSize + offset[0], offset[1],  halfSize + offset[2]], // B
        [ halfSize + offset[0], offset[1], -halfSize + offset[2]], // C
        [-halfSize + offset[0], offset[1], -halfSize + offset[2]], // D
      ];
      break;
    default:
      return [];
  }

  const [A, B, C, D] = points;
  const averages = [
    [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2],
    [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2, (A[2] + C[2]) / 2],
    [(C[0] + D[0]) / 2, (C[1] + D[1]) / 2, (C[2] + D[2]) / 2],
    [(D[0] + B[0]) / 2, (D[1] + B[1]) / 2, (D[2] + B[2]) / 2],
  ];

  return { points, averages };
};

export const coordinate = (idx) => ['NE', 'NW', 'SE', 'SW'][idx];

export const isWithinBounds = (distance, primitive, size) => {
  return distance < primitive.levelArchitecture.config.lodDistanceOffset * size && size > primitive.levelArchitecture.config.minLevelSize;
};

export const generateKey = (node) => `${node.params.index}_${node.params.direction}_${node.position.x}_${node.position.y}_${node.params.size}`;

export const norm = (val, max, min) => (val - min) / (max - min);