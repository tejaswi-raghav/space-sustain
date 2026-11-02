'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Entity, Viewer } from 'cesium';
import { DISTRICTS, DOWNTOWN, DUBAI_ORBIT, districtById, type DistrictId, type LayerId, type SceneId } from '@/lib/districts';

type CesiumModule = typeof import('cesium');
type BuildingFeature = {
  id: string;
  properties: { osm_id: string; name: string; height_m: number; height_source: string; footprint_area_m2: number; district: string };
  geometry: { type: 'Polygon'; coordinates: number[][][] };
};
type BuildingCollection = { type: 'FeatureCollection'; retrieved_at: string; features: BuildingFeature[] };
export type BuildingSelection = { id: string; osmId: string; name: string; district: string; roofAreaM2: number; heightM: number; heightSource: string; coordinates: number[][] };
export type CameraTelemetry = { latitude: number; longitude: number; altitudeM: number; heading: number };
export type GlobeStatus = 'loading' | 'ready' | 'webgl-error';
export type TokenStatus = 'checking' | 'missing' | 'active' | 'error';

export default function GlobeCanvas({
  target, flightKey = 0, mode = 'story', layers = [], futureMode = false,
  onDistrictSelect, onBuildingSelect, onCameraChange, onStatusChange, onTokenStatusChange, onFlightComplete,
}: {
  target: SceneId; flightKey?: number; mode?: 'story' | 'control'; layers?: LayerId[]; futureMode?: boolean;
  onDistrictSelect?: (id: DistrictId) => void;
  onBuildingSelect?: (building: BuildingSelection) => void;
  onCameraChange?: (telemetry: CameraTelemetry) => void;
  onStatusChange?: (status: GlobeStatus) => void;
  onTokenStatusChange?: (status: TokenStatus) => void;
  onFlightComplete?: (target: SceneId) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const cesiumRef = useRef<CesiumModule | null>(null);
  const loadedRef = useRef<Map<string, Entity[]>>(new Map());
  const buildingRef = useRef<Map<string, BuildingSelection>>(new Map());
  const overlayRef = useRef<Entity[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const targetRef = useRef<SceneId>(target);
  const flightSequenceRef = useRef(0);
  const lastCameraReportRef = useRef(0);
  const latestRef = useRef({ target, layers, futureMode, mode, onDistrictSelect, onBuildingSelect, onCameraChange, onStatusChange, onTokenStatusChange, onFlightComplete });
  const [status, setStatus] = useState<GlobeStatus>('loading');
  latestRef.current = { target, layers, futureMode, mode, onDistrictSelect, onBuildingSelect, onCameraChange, onStatusChange, onTokenStatusChange, onFlightComplete };

  const reportStatus = useCallback((next: GlobeStatus) => { setStatus(next); latestRef.current.onStatusChange?.(next); }, []);

  const refreshOverlays = useCallback(() => {
    const viewer = viewerRef.current;
    const C = cesiumRef.current;
    if (!viewer || !C) return;
    for (const entity of overlayRef.current) viewer.entities.remove(entity);
    overlayRef.current = [];
    const { layers: enabled, futureMode: proposed, target: activeTarget } = latestRef.current;
    const currentId = activeTarget === 'orbit' ? 'downtown' : activeTarget;
    const district = currentId === 'downtown' ? DOWNTOWN : districtById(currentId as DistrictId);
    for (const [districtId, entities] of loadedRef.current) {
      entities.forEach((entity, index) => {
        entity.show = activeTarget !== 'orbit' && districtId === currentId;
        if (!entity.polygon) return;
        const meta = buildingRef.current.get(entity.id);
        const isSelected = entity.id === selectedIdRef.current;
        const solarSample = enabled.includes('solar') && (meta?.roofAreaM2 ?? 0) > 450 && index % 3 === 0;
        const coolRoof = proposed && index % 7 === 0;
        const color = isSelected ? (enabled.includes('solar') ? '#e5ad63' : '#65dff2') : solarSample ? '#b8824a' : coolRoof ? '#d8e8e5' : '#164d5b';
        entity.polygon.material = new C.ColorMaterialProperty(C.Color.fromCssColorString(color).withAlpha(isSelected ? .92 : solarSample || coolRoof ? .86 : .67));
        entity.polygon.outlineColor = new C.ConstantProperty(C.Color.fromCssColorString(isSelected ? '#fff0d9' : '#84b4bd').withAlpha(isSelected ? .95 : .48));
      });
    }
    if (activeTarget === 'orbit') { viewer.scene.requestRender(); return; }
    const add = (entity: Entity) => overlayRef.current.push(entity);
    if (enabled.includes('heat')) {
      for (const [dx, dy, radius] of [[-.003, .002, 430], [.003, -.002, 300], [.001, .003, 210]]) {
        add(viewer.entities.add({ position: C.Cartesian3.fromDegrees(district.longitude + dx, district.latitude + dy), ellipse: { semiMajorAxis: radius, semiMinorAxis: radius * .72, height: 0, material: C.Color.fromCssColorString('#eb9b76').withAlpha(.18), outline: true, outlineColor: C.Color.fromCssColorString('#e7a47d').withAlpha(.38) } }));
      }
    }
    if (enabled.includes('vegetation') || proposed) {
      for (const [dx, dy, radius] of [[-.0022, -.0018, 100], [.0025, .0015, 72], [-.0006, .003, 55]]) {
        add(viewer.entities.add({ position: C.Cartesian3.fromDegrees(district.longitude + dx, district.latitude + dy), ellipse: { semiMajorAxis: radius, semiMinorAxis: radius * .62, height: 0, material: C.Color.fromCssColorString(proposed ? '#64e8ba' : '#4db899').withAlpha(proposed ? .55 : .28), outline: true, outlineColor: C.Color.fromCssColorString('#8ed9b8').withAlpha(.75) } }));
      }
    }
    if (enabled.includes('growth')) {
      add(viewer.entities.add({ position: C.Cartesian3.fromDegrees(district.longitude, district.latitude), ellipse: { semiMajorAxis: 610, semiMinorAxis: 475, height: 0, material: C.Color.fromCssColorString('#a9b9df').withAlpha(.045), outline: true, outlineColor: C.Color.fromCssColorString('#a9b9df').withAlpha(.8) } }));
    }
    if (proposed) {
      add(viewer.entities.add({ polyline: { positions: C.Cartesian3.fromDegreesArray([district.longitude - .003, district.latitude - .002, district.longitude + .003, district.latitude + .002]), width: 4, material: C.Color.fromCssColorString('#67dde6').withAlpha(.85), clampToGround: true } }));
      const selected = selectedIdRef.current ? buildingRef.current.get(selectedIdRef.current) : undefined;
      if (selected && selected.district === currentId) {
        const points = selected.coordinates.slice(0, -1);
        const center = points.reduce(([lon, lat], point) => [lon + point[0], lat + point[1]], [0, 0]).map((value) => value / points.length);
        add(viewer.entities.add({ polygon: { hierarchy: C.Cartesian3.fromDegreesArray(selected.coordinates.flat()), height: selected.heightM + .7, extrudedHeight: selected.heightM + 1.9, material: C.Color.fromCssColorString('#e5ad63').withAlpha(.8), outline: true, outlineColor: C.Color.fromCssColorString('#fff1d4') } }));
        add(viewer.entities.add({ position: C.Cartesian3.fromDegrees(center[0], center[1], selected.heightM + 18), label: { text: 'PROPOSED ARRAY / CONCEPT', font: '600 11px monospace', fillColor: C.Color.fromCssColorString('#ffdfa5'), showBackground: true, backgroundColor: C.Color.fromCssColorString('#10161b').withAlpha(.9), backgroundPadding: new C.Cartesian2(9, 6), disableDepthTestDistance: Number.POSITIVE_INFINITY } }));
      }
    }
    viewer.scene.requestRender();
  }, []);

  const loadBuildings = useCallback(async (id: string) => {
    const viewer = viewerRef.current;
    const C = cesiumRef.current;
    if (!viewer || !C || loadedRef.current.has(id)) return;
    loadedRef.current.set(id, []);
    try {
      const response = await fetch(`/data/${id}-buildings.geojson`);
      if (!response.ok) throw new Error(`OSM snapshot ${response.status}`);
      const collection = await response.json() as BuildingCollection;
      if (viewer.isDestroyed()) return;
      const entities: Entity[] = [];
      for (const feature of collection.features) {
        const ring = feature.geometry.coordinates[0];
        if (!ring || ring.length < 4) continue;
        const idValue = `building:${id}:${feature.properties.osm_id}`;
        const entity = viewer.entities.add({
          id: idValue,
          name: feature.properties.name,
          polygon: {
            hierarchy: C.Cartesian3.fromDegreesArray(ring.flat()),
            height: 0,
            extrudedHeight: feature.properties.height_m,
            material: C.Color.fromCssColorString('#58757b').withAlpha(.43),
            outline: true,
            outlineColor: C.Color.fromCssColorString('#9db6b8').withAlpha(.2),
          },
        });
        entities.push(entity);
        buildingRef.current.set(idValue, {
          id: idValue, osmId: feature.properties.osm_id, name: feature.properties.name,
          district: id, roofAreaM2: feature.properties.footprint_area_m2,
          heightM: feature.properties.height_m, heightSource: feature.properties.height_source,
          coordinates: ring,
        });
      }
      loadedRef.current.set(id, entities);
      if (latestRef.current.mode === 'control' && latestRef.current.target === id && !selectedIdRef.current && entities.length) {
        const selection = buildingRef.current.get(entities[0].id);
        if (selection) { selectedIdRef.current = selection.id; latestRef.current.onBuildingSelect?.(selection); }
      }
      refreshOverlays();
    } catch (error) {
      loadedRef.current.delete(id);
      console.warn('OSM building snapshot could not load', error);
    }
  }, [refreshOverlays]);

  const flyTo = useCallback((destination: SceneId, duration?: number) => {
    const viewer = viewerRef.current;
    const C = cesiumRef.current;
    if (!viewer || !C) return;
    if (targetRef.current !== destination) selectedIdRef.current = null;
    targetRef.current = destination;
    const sequence = ++flightSequenceRef.current;
    const place = destination === 'orbit' ? DUBAI_ORBIT : destination === 'downtown' ? DOWNTOWN : districtById(destination);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const flightDuration = reduced ? 0 : duration ?? (destination === 'orbit' ? 3.4 : 3.1);
    const complete = () => {
      if (sequence !== flightSequenceRef.current) return;
      viewer.scene.requestRender();
      latestRef.current.onFlightComplete?.(destination);
    };
    if (destination === 'orbit') {
      viewer.camera.flyTo({
        destination: C.Cartesian3.fromDegrees(place.longitude, place.latitude, place.altitude),
        orientation: { heading: C.Math.toRadians(place.heading), pitch: C.Math.toRadians(place.pitch), roll: 0 },
        duration: flightDuration,
        complete,
      });
    } else {
      const finalFlight = () => {
        if (sequence !== flightSequenceRef.current) return;
        viewer.camera.flyToBoundingSphere(
          new C.BoundingSphere(C.Cartesian3.fromDegrees(place.longitude, place.latitude, 0), 1),
          { offset: new C.HeadingPitchRange(C.Math.toRadians(place.heading), C.Math.toRadians(place.pitch), place.altitude), duration: flightDuration, complete },
        );
      };
      if (latestRef.current.mode === 'story' && destination === 'downtown' && !reduced && viewer.camera.positionCartographic.height > 600_000) {
        viewer.camera.flyTo({
          destination: C.Cartesian3.fromDegrees(54.55, 25.55, 2_650_000),
          orientation: { heading: C.Math.toRadians(18), pitch: C.Math.toRadians(-78), roll: 0 },
          duration: 1.5,
          complete: () => {
            if (sequence !== flightSequenceRef.current) return;
            viewer.camera.flyTo({
              destination: C.Cartesian3.fromDegrees(55.15, 25.25, 165_000),
              orientation: { heading: C.Math.toRadians(24), pitch: C.Math.toRadians(-62), roll: 0 },
              duration: 1.55,
              complete: finalFlight,
            });
          },
        });
      } else finalFlight();
    }
    if (destination !== 'orbit') {
      const first = loadedRef.current.get(destination)?.[0];
      const selection = first && buildingRef.current.get(first.id);
      if (selection && latestRef.current.mode === 'control') {
        selectedIdRef.current = selection.id;
        latestRef.current.onBuildingSelect?.(selection);
      }
      void loadBuildings(destination);
    }
    refreshOverlays();
  }, [loadBuildings, refreshOverlays]);

  useEffect(() => {
    if (!containerRef.current || !creditsRef.current) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    let orbitalTimer: ReturnType<typeof setInterval> | undefined;
    let viewer: Viewer | undefined;
    (async () => {
      (window as Window & { CESIUM_BASE_URL?: string }).CESIUM_BASE_URL = '/cesium/';
      const C = await import('cesium');
      if (cancelled || !containerRef.current || !creditsRef.current) return;
      cesiumRef.current = C;
      viewer = new C.Viewer(containerRef.current, {
        baseLayer: false,
        terrainProvider: new C.EllipsoidTerrainProvider(),
        animation: false, timeline: false, baseLayerPicker: false, fullscreenButton: false,
        geocoder: false, homeButton: false, infoBox: false, navigationHelpButton: false,
        sceneModePicker: false, selectionIndicator: false,
        creditContainer: creditsRef.current,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
      });
      viewerRef.current = viewer;
      const currentViewer = viewer;
      const earthLayer = currentViewer.imageryLayers.addImageryProvider(new C.WebMapTileServiceImageryProvider({
        url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpeg',
        layer: 'BlueMarble_NextGeneration', style: 'default', format: 'image/jpeg',
        tileMatrixSetID: 'GoogleMapsCompatible_Level8', maximumLevel: 8,
        credit: new C.Credit('NASA GIBS / Blue Marble Next Generation'),
      }));
      earthLayer.brightness = 1.05;
      earthLayer.contrast = 1.08;
      earthLayer.saturation = 1.12;
      const streetLayer = currentViewer.imageryLayers.addImageryProvider(new C.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }));
      streetLayer.show = false;
      streetLayer.brightness = .5;
      streetLayer.contrast = 1.48;
      streetLayer.saturation = .38;
      currentViewer.scene.globe.baseColor = C.Color.fromCssColorString('#071522');
      currentViewer.scene.backgroundColor = C.Color.fromCssColorString('#05070a');
      currentViewer.scene.globe.showGroundAtmosphere = true;
      currentViewer.scene.globe.enableLighting = true;
      currentViewer.scene.globe.dynamicAtmosphereLighting = true;
      currentViewer.scene.globe.atmosphereSaturationShift = -.18;
      currentViewer.scene.fog.enabled = true;
      currentViewer.clock.currentTime = C.JulianDate.fromIso8601('2026-11-03T09:00:00Z');
      currentViewer.clock.shouldAnimate = false;
      currentViewer.scene.screenSpaceCameraController.minimumZoomDistance = 170;
      currentViewer.scene.screenSpaceCameraController.maximumZoomDistance = 16_000_000;
      currentViewer.scene.screenSpaceCameraController.enableTilt = true;
      currentViewer.camera.setView({ destination: C.Cartesian3.fromDegrees(DUBAI_ORBIT.longitude, DUBAI_ORBIT.latitude, DUBAI_ORBIT.altitude), orientation: { heading: 0, pitch: -C.Math.PI_OVER_TWO, roll: 0 } });
      for (const district of DISTRICTS) {
        currentViewer.entities.add({
          id: `district:${district.id}`,
          position: C.Cartesian3.fromDegrees(district.longitude, district.latitude, 65),
          point: { pixelSize: 10, color: C.Color.fromCssColorString('#72e7ee'), outlineColor: C.Color.fromCssColorString('#07131d'), outlineWidth: 3, disableDepthTestDistance: Number.POSITIVE_INFINITY },
          label: { text: district.name.toUpperCase(), font: '600 11px monospace', fillColor: C.Color.fromCssColorString('#e6fbfc'), showBackground: true, backgroundColor: C.Color.fromCssColorString('#08141d').withAlpha(.86), backgroundPadding: new C.Cartesian2(8, 5), pixelOffset: new C.Cartesian2(0, -28), disableDepthTestDistance: Number.POSITIVE_INFINITY, distanceDisplayCondition: new C.DistanceDisplayCondition(0, 400_000) },
        });
      }
      currentViewer.screenSpaceEventHandler.setInputAction((movement: { position: InstanceType<typeof C.Cartesian2> }) => {
        const picked = currentViewer.scene.pick(movement.position) as { id?: Entity } | undefined;
        const id = picked?.id?.id;
        if (!id) return;
        if (id.startsWith('district:')) latestRef.current.onDistrictSelect?.(id.slice(9) as DistrictId);
        if (id.startsWith('building:')) {
          const building = buildingRef.current.get(id);
          if (building) {
            selectedIdRef.current = id;
            latestRef.current.onBuildingSelect?.(building);
            refreshOverlays();
            const points = building.coordinates.slice(0, -1);
            const [longitude, latitude] = points.reduce(([lon, lat], point) => [lon + point[0], lat + point[1]], [0, 0]).map((value) => value / points.length);
            currentViewer.camera.flyToBoundingSphere(
              new C.BoundingSphere(C.Cartesian3.fromDegrees(longitude, latitude, building.heightM), 1),
              { offset: new C.HeadingPitchRange(C.Math.toRadians(28), C.Math.toRadians(-42), Math.max(480, Math.sqrt(building.roofAreaM2) * 4)), duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1.8 },
            );
          }
        }
      }, C.ScreenSpaceEventType.LEFT_CLICK);
      const reportCamera = () => {
        const pos = currentViewer.camera.positionCartographic;
        latestRef.current.onCameraChange?.({ latitude: C.Math.toDegrees(pos.latitude), longitude: C.Math.toDegrees(pos.longitude), altitudeM: pos.height, heading: C.Math.toDegrees(currentViewer.camera.heading) });
      };
      currentViewer.camera.changed.addEventListener(() => {
        const altitude = currentViewer.camera.positionCartographic.height;
        const streetVisible = altitude < 250_000;
        if (streetLayer.show !== streetVisible) {
          streetLayer.show = streetVisible;
          currentViewer.scene.requestRender();
        }
        if (Date.now() - lastCameraReportRef.current < 350) return;
        lastCameraReportRef.current = Date.now();
        reportCamera();
      });
      currentViewer.camera.moveEnd.addEventListener(reportCamera);
      resizeObserver = new ResizeObserver(() => { if (!currentViewer.isDestroyed()) { currentViewer.resize(); currentViewer.scene.requestRender(); } });
      resizeObserver.observe(containerRef.current);
      if (latestRef.current.mode === 'story' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        orbitalTimer = setInterval(() => {
          if (targetRef.current === 'orbit' && !currentViewer.isDestroyed()) {
            currentViewer.camera.rotateRight(.000045);
            currentViewer.scene.requestRender();
          }
        }, 80);
      }
      reportStatus('ready');
      flyTo(latestRef.current.target, latestRef.current.target === 'orbit' ? 0 : 3.5);
      latestRef.current.onTokenStatusChange?.(process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ? 'checking' : 'missing');
      const token = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN?.trim();
      if (token) {
        C.Ion.defaultAccessToken = token;
        try {
          const tileset = await C.createOsmBuildingsAsync();
          if (!cancelled && !currentViewer.isDestroyed()) {
            currentViewer.scene.primitives.add(tileset);
            currentViewer.scene.requestRender();
            latestRef.current.onTokenStatusChange?.('active');
          }
        } catch (error) {
          console.warn('Cesium ion 3D Tiles unavailable; using OSM building snapshot', error);
          latestRef.current.onTokenStatusChange?.('error');
        }
      }
    })().catch((error) => { console.error('Cesium initialization failed', error); if (!cancelled) reportStatus('webgl-error'); });
    return () => {
      cancelled = true;
      if (orbitalTimer) clearInterval(orbitalTimer);
      resizeObserver?.disconnect();
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      cesiumRef.current = null;
      loadedRef.current.clear();
      buildingRef.current.clear();
      overlayRef.current = [];
    };
  // Initialization must happen once; prop changes are handled below via refs and effects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (viewerRef.current) flyTo(target); }, [target, flightKey, flyTo]);
  useEffect(() => { if (viewerRef.current) refreshOverlays(); }, [layers, futureMode, refreshOverlays]);

  return <div className={`globe-shell globe-${mode}`}>
    <div ref={containerRef} className="globe-viewer" role="application" aria-label="Interactive three-dimensional globe of Dubai. Drag to orbit and scroll to zoom." />
    <div ref={creditsRef} className="globe-credits" />
    {status === 'loading' && <div className="globe-loading"><span className="loading-orbit" /><span>INITIALIZING EARTH ENGINE</span></div>}
    {status === 'webgl-error' && <div className="globe-failure"><strong>3D view unavailable</strong><p>Enable WebGL in your browser and reload. The project requires a modern graphics-capable browser.</p></div>}
  </div>;
}
