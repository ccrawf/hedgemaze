import * as THREE from 'three'

export const initLighting = (scene, { disableShadows }) => {
  scene.add(new THREE.AmbientLight(0x272727, 1, 100, 50))

}
