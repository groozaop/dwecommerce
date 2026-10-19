// ═══════════════════════════════════════════════════════
//  store3d.js
//  Phase 0 (scroll 0→15%): closed door, opens on scroll
//  Phase 1 (scroll 15→100%): camera walks through aisles
// ═══════════════════════════════════════════════════════

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

function init() {
    const canvas = document.getElementById('store-canvas');
    if (!canvas) return;

    // ── Renderer ──
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    // ── Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    scene.fog = new THREE.Fog(0x111111, 22, 55);

    // ── Camera — starts outside the door ──
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 80);
    camera.position.set(0, 1.7, 3.5); // standing outside, facing door
    camera.lookAt(0, 1.7, 0);

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    [-5, -22, -40, -58].forEach(z => {
        const pl = new THREE.PointLight(0xfff5cc, 1.4, 22);
        pl.position.set(0, 3.6, z);
        pl.castShadow = true;
        pl.shadow.mapSize.set(256, 256);
        scene.add(pl);
        const fix = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.08, 0.3),
            new THREE.MeshBasicMaterial({ color: 0xFFFFCC })
        );
        fix.position.set(0, 3.95, z);
        scene.add(fix);
    });

    // Exterior light (illuminates door from outside)
    const extLight = new THREE.PointLight(0xFFE500, 1.8, 12);
    extLight.position.set(0, 3, 4);
    scene.add(extLight);

    // ── Helpers ──
    const AISLE_LENGTH = 80;
    const AISLE_WIDTH  = 6;
    const WALL_H       = 4;

    function staticBox(w, h, d, color, x, y, z, shadow = false) {
        const m = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshLambertMaterial({ color })
        );
        m.position.set(x, y, z);
        if (shadow) { m.receiveShadow = true; m.castShadow = true; }
        scene.add(m);
        return m;
    }

    // ── Structure ──
    staticBox(AISLE_WIDTH, 0.05, AISLE_LENGTH, 0xf5f0e8, 0, 0,      -AISLE_LENGTH / 2, true);
    staticBox(AISLE_WIDTH, 0.05, AISLE_LENGTH, 0xffffff, 0, WALL_H, -AISLE_LENGTH / 2);
    staticBox(0.1, WALL_H, AISLE_LENGTH, 0x1a1a1a, -AISLE_WIDTH / 2, WALL_H / 2, -AISLE_LENGTH / 2, true);
    staticBox(0.1, WALL_H, AISLE_LENGTH, 0x1a1a1a,  AISLE_WIDTH / 2, WALL_H / 2, -AISLE_LENGTH / 2, true);
    for (let z = 0; z > -AISLE_LENGTH; z -= 8)
        staticBox(AISLE_WIDTH, 0.06, 0.08, 0xFFE500, 0, 0.01, z);
    staticBox(AISLE_WIDTH, WALL_H, 0.2, 0xFFE500, 0, WALL_H / 2, -AISLE_LENGTH + 1);

    // ── DOOR (3D, in scene at z=0.1) ──
    // Frame
    staticBox(0.15, WALL_H + 0.15, 0.15, 0x222222, -AISLE_WIDTH / 2, WALL_H / 2, 0.1); // left post
    staticBox(0.15, WALL_H + 0.15, 0.15, 0x222222,  AISLE_WIDTH / 2, WALL_H / 2, 0.1); // right post
    staticBox(AISLE_WIDTH + 0.3, 0.15, 0.15, 0x222222, 0, WALL_H + 0.07, 0.1);          // top bar

    // Door sign above frame
    const signC = document.createElement('canvas');
    signC.width = 512; signC.height = 128;
    const sctx = signC.getContext('2d');
    sctx.fillStyle = '#FFE500';
    sctx.fillRect(0, 0, 512, 128);
    sctx.strokeStyle = '#000'; sctx.lineWidth = 6;
    sctx.strokeRect(3, 3, 506, 122);
    sctx.fillStyle = '#000';
    sctx.font = 'bold 32px Arial';
    sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
    sctx.fillText('DWARKADHISH E-COMMERCE', 256, 44);
    sctx.font = '22px Arial';
    sctx.fillText('GeM Registered Reseller', 256, 90);
    const doorSign = new THREE.Mesh(
        new THREE.PlaneGeometry(AISLE_WIDTH - 0.4, 0.9),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(signC), side: THREE.DoubleSide })
    );
    doorSign.position.set(0, WALL_H + 0.6, 0.1);
    scene.add(doorSign);

    // Left door panel — pivots from left edge
    const doorPanelGeo = new THREE.BoxGeometry(AISLE_WIDTH / 2 - 0.1, WALL_H - 0.1, 0.08);
    // Shift geometry so pivot is at left edge
    doorPanelGeo.translate((AISLE_WIDTH / 2 - 0.1) / 2, 0, 0);

    const doorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const doorHandleMat = new THREE.MeshLambertMaterial({ color: 0xFFE500 });

    const doorLeft = new THREE.Group();
    doorLeft.position.set(-AISLE_WIDTH / 2 + 0.1, WALL_H / 2, 0.1);
    const doorLeftMesh = new THREE.Mesh(doorPanelGeo, doorMat);
    doorLeft.add(doorLeftMesh);
    // Handle on left panel (right side of panel)
    const handleL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), doorHandleMat);
    handleL.position.set(AISLE_WIDTH / 2 - 0.25, 0, 0.07);
    doorLeft.add(handleL);
    scene.add(doorLeft);

    // Right door panel — pivots from right edge
    const doorPanelGeoR = new THREE.BoxGeometry(AISLE_WIDTH / 2 - 0.1, WALL_H - 0.1, 0.08);
    doorPanelGeoR.translate(-(AISLE_WIDTH / 2 - 0.1) / 2, 0, 0);

    const doorRight = new THREE.Group();
    doorRight.position.set(AISLE_WIDTH / 2 - 0.1, WALL_H / 2, 0.1);
    const doorRightMesh = new THREE.Mesh(doorPanelGeoR, doorMat);
    doorRight.add(doorRightMesh);
    const handleR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), doorHandleMat);
    handleR.position.set(-(AISLE_WIDTH / 2 - 0.25), 0, 0.07);
    doorRight.add(handleR);
    scene.add(doorRight);

    // ── Texture atlas ──
    const ATLAS_COLS = 8, ATLAS_ROWS = 8;
    const CELL_W = 256, CELL_H = 128;
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width  = ATLAS_COLS * CELL_W;
    atlasCanvas.height = ATLAS_ROWS * CELL_H;
    const atx = atlasCanvas.getContext('2d');

    const ALL_BRANDS = [
        { brand:'Dell',       item:'Laptop',      bg:'#1a1a2e', fg:'#ffffff' },
        { brand:'HP',         item:'Laptop',      bg:'#003087', fg:'#ffffff' },
        { brand:'Lenovo',     item:'ThinkPad',    bg:'#e2231a', fg:'#ffffff' },
        { brand:'Asus',       item:'Laptop',      bg:'#00539b', fg:'#ffffff' },
        { brand:'LG',         item:'Monitor',     bg:'#1f1f1f', fg:'#ffffff' },
        { brand:'Samsung',    item:'Monitor',     bg:'#1428a0', fg:'#ffffff' },
        { brand:'Acer',       item:'Monitor',     bg:'#83b81a', fg:'#ffffff' },
        { brand:'BenQ',       item:'Display',     bg:'#1f1f1f', fg:'#ffffff' },
        { brand:'TP-Link',    item:'Router',      bg:'#00b0f0', fg:'#000000' },
        { brand:'Cisco',      item:'Switch',      bg:'#1ba0d7', fg:'#ffffff' },
        { brand:'Netgear',    item:'WiFi',        bg:'#6d2077', fg:'#ffffff' },
        { brand:'D-Link',     item:'Router',      bg:'#0066cc', fg:'#ffffff' },
        { brand:'Seagate',    item:'HDD',         bg:'#2e7d32', fg:'#ffffff' },
        { brand:'WD',         item:'SSD',         bg:'#1565c0', fg:'#ffffff' },
        { brand:'Stanley',    item:'Hand Tools',  bg:'#ffcc00', fg:'#000000' },
        { brand:'Taparia',    item:'Wrench',      bg:'#e63946', fg:'#ffffff' },
        { brand:'Bosch',      item:'Power Tools', bg:'#2196f3', fg:'#ffffff' },
        { brand:'JCB',        item:'Spanner',     bg:'#ffcc00', fg:'#000000' },
        { brand:'Makita',     item:'Grinder',     bg:'#f57c00', fg:'#ffffff' },
        { brand:'Hitachi',    item:'Saw',         bg:'#212121', fg:'#ffffff' },
        { brand:'B&D',        item:'Drill',       bg:'#ffd600', fg:'#000000' },
        { brand:'ESAB',       item:'Welder',      bg:'#e65100', fg:'#ffffff' },
        { brand:'Ador',       item:'Welder',      bg:'#1a237e', fg:'#ffffff' },
        { brand:'Fluke',      item:'Multimeter',  bg:'#880e4f', fg:'#ffffff' },
        { brand:'Meco',       item:'Tester',      bg:'#004d40', fg:'#ffffff' },
        { brand:'Rishabh',    item:'Clamp Meter', bg:'#bf360c', fg:'#ffffff' },
        { brand:'Mitutoyo',   item:'Caliper',     bg:'#37474f', fg:'#ffffff' },
        { brand:'Exide',      item:'Battery',     bg:'#c62828', fg:'#ffffff' },
        { brand:'Luminous',   item:'UPS',         bg:'#1565c0', fg:'#ffffff' },
        { brand:'APC',        item:'UPS',         bg:'#006064', fg:'#ffffff' },
        { brand:'Microtek',   item:'Inverter',    bg:'#4a148c', fg:'#ffffff' },
        { brand:'Havells',    item:'Wire',        bg:'#e65100', fg:'#ffffff' },
        { brand:'Finolex',    item:'Cable',       bg:'#1b5e20', fg:'#ffffff' },
        { brand:'Polycab',    item:'Wire',        bg:'#0d47a1', fg:'#ffffff' },
        { brand:'RR Kabel',   item:'Cable',       bg:'#b71c1c', fg:'#ffffff' },
        { brand:'Philips',    item:'LED',         bg:'#f9a825', fg:'#000000' },
        { brand:'Wipro',      item:'Light',       bg:'#1565c0', fg:'#ffffff' },
        { brand:'Syska',      item:'LED',         bg:'#e53935', fg:'#ffffff' },
        { brand:'Bajaj',      item:'Fitting',     bg:'#2e7d32', fg:'#ffffff' },
        { brand:'Motwane',    item:'Tester',      bg:'#4e342e', fg:'#ffffff' },
        { brand:'Godrej',     item:'Desk',        bg:'#5d4037', fg:'#ffffff' },
        { brand:'Featherlite',item:'Chair',       bg:'#37474f', fg:'#ffffff' },
        { brand:'Durian',     item:'Table',       bg:'#4e342e', fg:'#ffffff' },
        { brand:'Nilkamal',   item:'Chair',       bg:'#4a148c', fg:'#ffffff' },
        { brand:'Zuari',      item:'Desk',        bg:'#1a237e', fg:'#ffffff' },
        { brand:'Spacewood',  item:'Table',       bg:'#880e4f', fg:'#ffffff' },
        { brand:'3M',         item:'Mask N95',    bg:'#e3f2fd', fg:'#000000' },
        { brand:'Kimberly',   item:'Gloves',      bg:'#fce4ec', fg:'#000000' },
        { brand:'Ansell',     item:'Gloves',      bg:'#f3e5f5', fg:'#000000' },
        { brand:'Stryker',    item:'Instrument',  bg:'#e8eaf6', fg:'#000000' },
        { brand:'B.Braun',    item:'Surgical',    bg:'#fafafa', fg:'#000000' },
        { brand:'Omron',      item:'BP Monitor',  bg:'#ffebee', fg:'#000000' },
        { brand:'Rossmax',    item:'Oximeter',    bg:'#e8f5e9', fg:'#000000' },
        { brand:'Niscomed',   item:'Glucometer',  bg:'#fff8e1', fg:'#000000' },
    ];

    const brandIndex = {};
    ALL_BRANDS.forEach((b, i) => {
        const col = i % ATLAS_COLS, row = Math.floor(i / ATLAS_COLS);
        const px = col * CELL_W, py = row * CELL_H;
        atx.fillStyle = b.bg; atx.fillRect(px, py, CELL_W, CELL_H);
        atx.strokeStyle = b.fg; atx.lineWidth = 3;
        atx.strokeRect(px + 2, py + 2, CELL_W - 4, CELL_H - 4);
        atx.fillStyle = b.fg;
        atx.font = 'bold 26px Arial'; atx.textAlign = 'center'; atx.textBaseline = 'middle';
        atx.fillText(b.brand, px + CELL_W / 2, py + CELL_H * 0.38);
        atx.font = '18px Arial';
        atx.fillText(b.item, px + CELL_W / 2, py + CELL_H * 0.68);
        brandIndex[b.brand] = i;
    });

    const atlasTexture = new THREE.CanvasTexture(atlasCanvas);

    function brandUV(idx) {
        return {
            offset: new THREE.Vector2((idx % ATLAS_COLS) / ATLAS_COLS, 1 - (Math.floor(idx / ATLAS_COLS) + 1) / ATLAS_ROWS),
            repeat: new THREE.Vector2(1 / ATLAS_COLS, 1 / ATLAS_ROWS)
        };
    }

    // ── Aisles ──
    const AISLES = [
        { z:-5,  label:'IT & COMPUTERS',   color:0x90B2FF, rows:[
            ['Dell','HP','Lenovo','Asus','LG','Samsung'],
            ['Acer','BenQ','TP-Link','Cisco','Netgear','D-Link'],
            ['Seagate','WD','Fluke','Meco','Bosch','Stanley'],
        ]},
        { z:-18, label:'INDUSTRIAL TOOLS', color:0xFF90E8, rows:[
            ['Stanley','Taparia','Bosch','JCB','Makita','Hitachi'],
            ['B&D','ESAB','Ador','Fluke','Meco','Rishabh'],
            ['Mitutoyo','Bosch','Stanley','Taparia','Makita','JCB'],
        ]},
        { z:-31, label:'ELECTRICAL',        color:0xB8FF9F, rows:[
            ['Exide','Luminous','APC','Microtek','Havells','Finolex'],
            ['Polycab','RR Kabel','Philips','Wipro','Syska','Bajaj'],
            ['Motwane','Fluke','Rishabh','Meco','Exide','Luminous'],
        ]},
        { z:-44, label:'FURNITURE',         color:0xFFE500, rows:[
            ['Godrej','Featherlite','Durian','Nilkamal','Zuari','Spacewood'],
            ['Godrej','Featherlite','Durian','Nilkamal','Zuari','Spacewood'],
            ['Godrej','Featherlite','Durian','Nilkamal','Zuari','Spacewood'],
        ]},
        { z:-57, label:'MEDICAL SUPPLIES',  color:0xFF6B35, rows:[
            ['3M','Kimberly','Ansell','Stryker','B.Braun','Omron'],
            ['Rossmax','Niscomed','3M','Kimberly','Ansell','Stryker'],
            ['B.Braun','Omron','Rossmax','Niscomed','3M','Kimberly'],
        ]},
    ];

    const SHELF_YS = [0.5, 1.3, 2.1];
    const PROD_W = 0.30, PROD_H = 0.26, PROD_D = 0.20;
    const prodGeo = new THREE.BoxGeometry(PROD_W, PROD_H, PROD_D);
    const dummy   = new THREE.Object3D();

    AISLES.forEach(aisle => {
        const shelfMat = new THREE.MeshLambertMaterial({ color: aisle.color });
        [-1, 1].forEach(side => {
            const x = side * (AISLE_WIDTH / 2 - 0.5);
            staticBox(0.08, WALL_H - 0.2, 3.8, 0x2a2a2a, x, WALL_H / 2, aisle.z);
            SHELF_YS.concat([2.9]).forEach(sy => {
                const sm = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.05, 3.7), shelfMat);
                sm.position.set(x + side * -0.46, sy, aisle.z);
                scene.add(sm);
            });

            const total = SHELF_YS.reduce((s, _, ri) => s + (aisle.rows[ri]?.length || 0), 0);
            if (!total) return;

            const uvOffsets = new Float32Array(total * 2);
            const uvRepeats = new Float32Array(total * 2);
            let idx = 0;

            SHELF_YS.forEach((sy, rowIdx) => {
                const row = aisle.rows[rowIdx] || [];
                const span = 3.2, step = row.length > 1 ? span / (row.length - 1) : 0;
                row.forEach((brandName, i) => {
                    const pz = aisle.z + span / 2 - i * step;
                    const py = sy + PROD_H / 2 + 0.06;
                    const bIdx = brandIndex[brandName] ?? 0;
                    const { offset, repeat } = brandUV(bIdx);
                    dummy.position.set(x + side * -0.46, py, pz);
                    dummy.updateMatrix();

                    uvOffsets[idx * 2]     = offset.x;
                    uvOffsets[idx * 2 + 1] = offset.y;
                    uvRepeats[idx * 2]     = repeat.x;
                    uvRepeats[idx * 2 + 1] = repeat.y;
                    idx++;
                });
            });

            const geo = prodGeo.clone();
            geo.setAttribute('uvOffset', new THREE.InstancedBufferAttribute(uvOffsets, 2));
            geo.setAttribute('uvRepeat', new THREE.InstancedBufferAttribute(uvRepeats, 2));

            const instMesh = new THREE.InstancedMesh(geo, new THREE.ShaderMaterial({
                uniforms: { atlas: { value: atlasTexture } },
                vertexShader: `
                    attribute vec2 uvOffset; attribute vec2 uvRepeat;
                    varying vec2 vUv; varying vec3 vNormal;
                    void main() {
                        vUv = uvOffset + uv * uvRepeat;
                        vNormal = normalMatrix * normal;
                        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position,1.0);
                    }`,
                fragmentShader: `
                    uniform sampler2D atlas;
                    varying vec2 vUv; varying vec3 vNormal;
                    void main() {
                        float diff = max(dot(vNormal, normalize(vec3(0.5,1.0,0.8))),0.0)*0.5+0.5;
                        gl_FragColor = vec4(texture2D(atlas,vUv).rgb*diff,1.0);
                    }`,
            }), total);

            // Re-populate instance matrices
            idx = 0;
            SHELF_YS.forEach((sy, rowIdx) => {
                const row = aisle.rows[rowIdx] || [];
                const span = 3.2, step = row.length > 1 ? span / (row.length - 1) : 0;
                row.forEach((_, i) => {
                    const pz = aisle.z + span / 2 - i * step;
                    const py = sy + PROD_H / 2 + 0.06;
                    dummy.position.set(x + side * -0.46, py, pz);
                    dummy.updateMatrix();
                    instMesh.setMatrixAt(idx++, dummy.matrix);
                });
            });

            instMesh.instanceMatrix.needsUpdate = true;
            scene.add(instMesh);
        });

        // Aisle sign
        const sc = document.createElement('canvas');
        sc.width = 512; sc.height = 128;
        const sctx2 = sc.getContext('2d');
        const hex = '#' + aisle.color.toString(16).padStart(6, '0');
        sctx2.fillStyle = hex; sctx2.fillRect(0, 0, 512, 128);
        sctx2.strokeStyle = '#000'; sctx2.lineWidth = 6;
        sctx2.strokeRect(3, 3, 506, 122);
        sctx2.fillStyle = '#000'; sctx2.font = 'bold 36px Arial';
        sctx2.textAlign = 'center'; sctx2.textBaseline = 'middle';
        sctx2.fillText(aisle.label, 256, 64);
        const sign = new THREE.Mesh(
            new THREE.PlaneGeometry(3.2, 0.8),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), side: THREE.DoubleSide })
        );
        sign.position.set(0, WALL_H - 0.5, aisle.z);
        scene.add(sign);
    });

    // ══════════════════════════════════════════════════
    //  SCROLL LOGIC
    //  progress 0→1 over the full wrapper height
    //  DOOR_PHASE: 0.0 → DOOR_END  (door opens)
    //  WALK_PHASE: DOOR_END → 1.0  (camera walks in)
    // ══════════════════════════════════════════════════
    const DOOR_END   = 0.15;   // first 15% of scroll = door phase
    const TRAVEL     = AISLE_LENGTH - 6;
    const overlayItems = document.querySelectorAll('.store-section-overlay');

    // Max door open angle
    const MAX_DOOR_ANGLE = Math.PI * 0.55; // ~100°

    function onScroll() {
        const wrapper  = document.getElementById('threejs-wrapper');
        const rect     = wrapper.getBoundingClientRect();
        const wrapH    = wrapper.offsetHeight;
        const viewH    = window.innerHeight;
        const progress = Math.max(0, Math.min(1, -rect.top / (wrapH - viewH)));

        if (progress <= DOOR_END) {
            // ── Door phase ──
            const doorP = progress / DOOR_END; // 0→1

            // Door panels swing open
            doorLeft.rotation.y  =  doorP * MAX_DOOR_ANGLE;
            doorRight.rotation.y = -doorP * MAX_DOOR_ANGLE;

            // Camera slowly moves toward door (z: 3.5 → 0.5)
            camera.position.z = 3.5 - doorP * 3.0;
            camera.position.y = 1.7;
            camera.lookAt(0, 1.7, -5);

        } else {
            // ── Walk phase ──
            // Ensure door is fully open
            doorLeft.rotation.y  =  MAX_DOOR_ANGLE;
            doorRight.rotation.y = -MAX_DOOR_ANGLE;

            const walkP = (progress - DOOR_END) / (1 - DOOR_END); // 0→1
            camera.position.z = 0.5 - walkP * TRAVEL;
            camera.position.y = 1.7 + Math.sin(walkP * TRAVEL * 1.5) * 0.04;
            camera.lookAt(0, 1.7, camera.position.z - 10);
        }

        // Overlay panels
        overlayItems.forEach(el => {
            const trigger = parseFloat(el.dataset.trigger);
            const until   = el.dataset.until ? parseFloat(el.dataset.until) : trigger + 0.18;
            const visible = progress >= trigger && progress < until;
            el.style.opacity   = visible ? '1' : '0';
            el.style.transform = visible
                ? 'translateX(-50%) translateY(0)'
                : 'translateX(-50%) translateY(20px)';
        });

        // Progress bar
        const docH = document.documentElement.scrollHeight - viewH;
        document.getElementById('scroll-progress').style.width =
            (docH > 0 ? (window.scrollY / docH) * 100 : 0) + '%';

        document.querySelector('.nb-navbar').classList.toggle('scrolled', window.scrollY > 80);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ── Resize ──
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ── Render loop ──
    (function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    })();
}

if (document.readyState === 'complete') init();
else window.addEventListener('load', init);
