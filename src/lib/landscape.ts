import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Repo } from './github';

/** The scene is an optional view. Exact values and keyboard actions live in the adjacent list. */
export function createLandscape(
  host: HTMLElement,
  items: { repo: Repo; owner: number }[],
  metric: string,
  onSelect: (repo: Repo) => void,
) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.setClearColor(0xeae7f0, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('tabindex', '-1');
  host.prepend(canvas);
  const camera = new THREE.PerspectiveCamera(
    35,
    host.clientWidth / host.clientHeight,
    0.1,
    100,
  );
  const initial = new THREE.Vector3(13, 13, 18).multiplyScalar(
    host.clientWidth < 600 ? 1.7 : 1,
  );
  camera.position.copy(initial);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.8, 0);
  controls.enableDamping = false;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI * 0.44;
  controls.minPolarAngle = Math.PI * 0.12;
  controls.rotateSpeed = 0.55;
  controls.update();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb4a6c0, 2.7));
  const light = new THREE.DirectionalLight(0xffffff, 3.7);
  light.position.set(-6, 15, 9);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, {
    left: -16,
    right: 16,
    top: 14,
    bottom: -14,
    near: 0.1,
    far: 45,
  });
  light.shadow.normalBias = 0.03;
  light.shadow.bias = -0.0002;
  scene.add(light);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.ShadowMaterial({ color: 0x3c2547, opacity: 0.13 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.15;
  ground.receiveShadow = true;
  scene.add(ground);
  const meshes: THREE.Mesh[] = [];
  const pickables: THREE.Mesh[] = [];
  const materials = [
    new THREE.MeshStandardMaterial({
      color: 0xc36653,
      roughness: 0.6,
      metalness: 0.04,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x318b7e,
      roughness: 0.6,
      metalness: 0.04,
    }),
  ];
  const value = (r: Repo) =>
    metric === 'forks'
      ? r.forks_count
      : metric === 'size'
        ? r.size
        : r.stargazers_count;
  const max = Math.max(1, ...items.map((x) => Math.log1p(value(x.repo))));
  const groups = [
    items.filter((x) => x.owner === 0),
    items.filter((x) => x.owner === 1),
  ];
  groups.forEach((group, owner) => {
    const center = owner === 0 ? -4.2 : 4.2;
    const plinth = new THREE.Mesh(
      new RoundedBoxGeometry(7.4, 0.16, 6.8, 2, 0.08),
      new THREE.MeshStandardMaterial({
        color: owner === 0 ? 0xe6d6d4 : 0xd2e0dd,
        roughness: 0.9,
      }),
    );
    plinth.position.set(center, -0.02, 0);
    plinth.receiveShadow = true;
    scene.add(plinth);
    meshes.push(plinth);
    group.forEach(({ repo }, i) => {
      const height = 0.13 + (Math.log1p(value(repo)) / max) * 4;
      const mesh = new THREE.Mesh(
        new RoundedBoxGeometry(0.86, height, 0.86, 2, 0.045),
        materials[owner],
      );
      mesh.position.set(
        center + ((i % 6) - 2.5) * 1.1,
        height / 2 + 0.08,
        (Math.floor(i / 6) - 2) * 1.12,
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { repo, owner, height };
      scene.add(mesh);
      meshes.push(mesh);
      pickables.push(mesh);
    });
  });
  let disposed = false,
    visible = true,
    frame = 0;
  function render() {
    if (disposed || !visible) return;
    renderer.render(scene, camera);
  }
  function requestRender() {
    if (frame || disposed) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      render();
    });
  }
  controls.addEventListener('change', requestRender);
  const resize = new ResizeObserver(() => {
    if (disposed) return;
    camera.aspect = host.clientWidth / host.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(host.clientWidth, host.clientHeight);
    render();
  });
  resize.observe(host);
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible) requestRender();
  });
  observer.observe(host);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const tooltip = host.querySelector<HTMLElement>('#scene-tooltip')!;
  let hovered: THREE.Mesh | undefined;
  let start = { x: 0, y: 0 };
  function find(event: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      (-(event.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(pickables)[0]?.object as
      THREE.Mesh | undefined;
  }
  function move(event: PointerEvent) {
    if (event.buttons) return;
    const next = find(event);
    if (hovered !== next) {
      if (hovered) hovered.scale.set(1, 1, 1);
      hovered = next;
      if (hovered) hovered.scale.set(1.07, 1.02, 1.07);
      canvas.style.cursor = hovered ? 'pointer' : 'grab';
      requestRender();
    }
    if (hovered) {
      const repo = hovered.userData.repo as Repo;
      tooltip.replaceChildren();
      const title = document.createElement('strong');
      title.textContent = repo.full_name;
      const valueLabel = document.createElement('small');
      valueLabel.textContent = `${value(repo).toLocaleString('en')} ${metric === 'size' ? 'KB' : metric} · click to explore`;
      tooltip.append(title, valueLabel);
      tooltip.hidden = false;
      const r = host.getBoundingClientRect();
      tooltip.style.left = `${Math.max(12, Math.min(event.clientX - r.left + 14, host.clientWidth - tooltip.offsetWidth - 12))}px`;
      tooltip.style.top = `${Math.max(45, Math.min(event.clientY - r.top - 60, host.clientHeight - tooltip.offsetHeight - 45))}px`;
    } else tooltip.hidden = true;
  }
  function down(event: PointerEvent) {
    start = { x: event.clientX, y: event.clientY };
    tooltip.hidden = true;
  }
  function up(event: PointerEvent) {
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5) {
      const mesh = find(event);
      if (mesh) onSelect(mesh.userData.repo);
    }
  }
  function leave() {
    tooltip.hidden = true;
    if (hovered) {
      hovered.scale.set(1, 1, 1);
      hovered = undefined;
      requestRender();
    }
  }
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointerleave', leave);
  requestRender();
  return {
    reset() {
      camera.position.copy(initial);
      controls.target.set(0, 0.8, 0);
      controls.update();
      requestRender();
    },
    zoom(factor: number) {
      const offset = camera.position.clone().sub(controls.target);
      offset.multiplyScalar(factor);
      offset.setLength(THREE.MathUtils.clamp(offset.length(), 12, 40));
      camera.position.copy(controls.target).add(offset);
      controls.update();
      requestRender();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      controls.dispose();
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointerleave', leave);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const mats = Array.isArray(object.material)
            ? object.material
            : [object.material];
          mats.forEach((m) => m.dispose());
        }
      });
      light.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
