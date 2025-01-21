import { ThreadController } from './../threading/controller.js';
import { QuadGeometry } from './../geometry.js';

export const threadingInit = (geometryClass, workersSRC) => {
  const blob = new Blob(
    [workersSRC(geometryClass.name, [QuadGeometry, (geometryClass === QuadGeometry) ? '' : geometryClass])],
    { type: 'application/javascript' }
  );
  const threadController = new ThreadController(new Worker(URL.createObjectURL(blob), { type: 'module' }));
  return threadController;
};