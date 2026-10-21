/* 소복 블록(복셀) 렌더러
 * - 부엌: 마인크래프트식 아이소메트릭 큐브. 이미지 파일 없이 캔버스로 그린다.
 * - 친구: 나노블럭처럼 정면에서 본 블록 캐릭터. 얼굴은 앞면에 스티커처럼 그린다.
 * 마크업 약속
 *   <div data-voxel-room><canvas class="voxel-room-canvas"></canvas> ...[data-anchor="x,y,z"]... </div>
 *   <canvas data-voxel-char="hachiware"></canvas>
 * app.js는 렌더 후 window.SobokVoxel.hydrate(root)를 호출한다. */
(function (root) {
  'use strict';

  /* ---------- 공통 ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rgbOf = hex => { const h = hex.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const css = (c, f) => `rgb(${clamp(Math.round(c[0] * f), 0, 255)},${clamp(Math.round(c[1] * f), 0, 255)},${clamp(Math.round(c[2] * f), 0, 255)})`;
  function noise(x, y, z, k) {
    let n = (x * 374761393 + y * 668265263 + z * 1442695041 + k * 1274126177) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  function poly(ctx, pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); }
  // 한 면을 n×n 픽셀로 나눠 밝기를 살짝 흔든다(마인크래프트 질감).
  function texturedFace(ctx, pts, base, shade, seed, n, edge) {
    ctx.fillStyle = css(base, shade); poly(ctx, pts); ctx.fill();
    if (n > 1) {
      const [A, B, , Dd] = pts, U = [B[0] - A[0], B[1] - A[1]], V = [Dd[0] - A[0], Dd[1] - A[1]];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const r = noise(seed[0] * 7 + i, seed[1] * 7 + j, seed[2], seed[3]);
        if (r > 0.35 && r < 0.65) continue;
        const f = shade * (1 + (r - 0.5) * 0.09);
        const p = (u, v) => [A[0] + U[0] * u + V[0] * v, A[1] + U[1] * u + V[1] * v];
        ctx.fillStyle = css(base, f);
        poly(ctx, [p(i / n, j / n), p((i + 1) / n, j / n), p((i + 1) / n, (j + 1) / n), p(i / n, (j + 1) / n)]); ctx.fill();
      }
    }
    if (edge) { ctx.strokeStyle = edge; poly(ctx, pts); ctx.stroke(); }
  }
  function dprOf() { return Math.min(2, (root.devicePixelRatio || 1)); }
  function sizeCanvas(canvas, w, h) {
    const d = dprOf();
    canvas.width = Math.max(1, Math.round(w * d)); canvas.height = Math.max(1, Math.round(h * d));
    const ctx = canvas.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h); ctx.lineJoin = 'round';
    return ctx;
  }

  /* ---------- 부엌(아이소메트릭) ----------
   * x: 화면 오른쪽 아래, y: 왼쪽 아래, z: 위. 벽은 x=-1, y=-1. */
  const W = 12, D = 11, H = 7;
  const ROOM_UNITS = { w: W + D + 2, h: (W + D) / 2 + 3 + H };
  const ROOM_ASPECT = ROOM_UNITS.w / ROOM_UNITS.h;
  function roomPoint(x, y, z, a) { return [(D + 1) * a + (x - y) * a, (1 + H) * a + (x + y) * a / 2 - z * a]; }
  // 앵커 위치를 방 그림 대비 %로 돌려준다(오버레이 버튼 배치용).
  function roomPercent(x, y, z) { const [px, py] = roomPoint(x, y, z, 1); return [px / ROOM_UNITS.w * 100, py / ROOM_UNITS.h * 100]; }

  // 방은 블록, 냉장고 문·냄비·요리책은 알아보기 쉽게 매끈한 그림(소품)으로 그 위에 얹는다.
  let roomModel = null;
  function buildRoom() {
    const vox = new Map(), key = (x, y, z) => x + ',' + y + ',' + z;
    const put = (x, y, z, c, faces, smooth) => vox.set(key(x, y, z), { x, y, z, c: rgbOf(c), s: !!smooth, f: faces ? Object.fromEntries(Object.entries(faces).map(([k, v]) => [k, rgbOf(v)])) : null });
    const box = (x0, y0, z0, w, d, h, c, faces, smooth) => { for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + d; y++) for (let z = z0; z < z0 + h; z++) put(x, y, z, c, faces, smooth); };
    const paint = (x, y, z, face, c) => { const v = vox.get(key(x, y, z)); if (v) { v.f = v.f || {}; v.f[face] = rgbOf(c); } };
    // 바닥: 나무 받침 + 크림 체크 타일
    for (let x = 0; x < W; x++) for (let y = 0; y < D; y++) { put(x, y, -2, '#c99a6e'); put(x, y, -1, (x + y) % 2 ? '#f3e2cf' : '#fbf1e4'); }
    // 러그(친구가 서는 자리)
    for (let x = 2; x <= 6; x++) for (let y = 3; y <= 7; y++) put(x, y, -1, (x + y) % 2 ? '#f6cfc4' : '#fadbd2');
    // 벽: 아래는 분홍 패널, 위는 크림, 맨 위 테두리
    const wall = z => z <= 1 ? '#f1b4aa' : z === 2 ? '#fde2d8' : z === H - 1 ? '#fffaf3' : '#fbeee2';
    for (let y = -1; y < D; y++) for (let z = -2; z < H; z++) put(-1, y, z, z === -2 ? '#c99a6e' : wall(z));
    for (let x = 0; x < W; x++) for (let z = -2; z < H; z++) put(x, -1, z, z === -2 ? '#c99a6e' : wall(z));
    // 창문(오른쪽 벽)
    for (let x = 1; x <= 5; x++) for (let z = 3; z <= 6; z++) {
      const frame = x === 1 || x === 5 || z === 3 || z === 6 || x === 3;
      paint(x, -1, z, 'y', frame ? '#c58e5d' : (z === 5 ? '#bfe4f4' : '#d6eef8'));
    }
    paint(2, -1, 4, 'y', '#a9d39a'); paint(4, -1, 4, 'y', '#9ccb8e');
    // 액자(왼쪽 벽)
    paint(-1, 3, 5, 'x', '#e9c46a'); paint(-1, 4, 5, 'x', '#f29e91');
    // 냉장고 몸체(매끈하게). 앞면 문은 drawProps가 그린다.
    box(0, 7, 0, 2, 2, 6, '#fbf3df', null, true);
    // 조리대: 세이지 수납장 + 상판 + 개수대 + 수도꼭지 + 프라이팬 + 양념병
    box(5, 0, 0, 6, 2, 2, '#b8cfa7');
    for (let x = 5; x < 11; x++) { paint(x, 1, 1, 'y', x % 2 ? '#a9c497' : '#b8cfa7'); }
    paint(6, 1, 1, 'y', '#d9a66b'); paint(9, 1, 1, 'y', '#d9a66b');
    box(5, 0, 2, 6, 2, 1, '#f6efe6');
    paint(6, 0, 2, 't', '#bcc8cf'); paint(7, 0, 2, 't', '#bcc8cf'); paint(6, 1, 2, 't', '#c9d3d8'); paint(7, 1, 2, 't', '#c9d3d8');
    put(6, 0, 3, '#d9a35b');
    put(10, 1, 3, '#e98b86', { t: '#5d4b47' });
    put(10, 0, 3, '#c88b5e'); put(10, 0, 4, '#f4e7d7');
    put(9, 0, 3, '#bfd6b4');
    // 식탁(요리책은 drawProps가 그린다)
    box(9, 4, 2, 2, 3, 1, '#dcaa72');
    [[9, 4], [10, 4], [9, 6], [10, 6]].forEach(([x, y]) => box(x, y, 0, 1, 1, 2, '#bf8a56'));
    // 화분(왼쪽 앞)
    put(1, 10, 0, '#f7f2ea'); put(1, 10, 1, '#7fae6a'); put(1, 10, 2, '#93c27b');
    return { vox, has: (x, y, z) => vox.has(key(x, y, z)) };
  }
  const roomCache = new Map();
  function renderRoomBitmap(w) {
    const k = Math.round(w) + '@' + dprOf();
    if (roomCache.has(k)) return roomCache.get(k);
    roomModel = roomModel || buildRoom();
    const h = w / ROOM_ASPECT, a = w / ROOM_UNITS.w;
    const cv = document.createElement('canvas'), ctx = sizeCanvas(cv, w, h);
    ctx.lineWidth = Math.max(0.6, a * 0.04);
    const list = [...roomModel.vox.values()].sort((p, q) => (p.x + p.y + p.z) - (q.x + q.y + q.z) || p.z - q.z || p.x - q.x);
    const P = (x, y, z) => roomPoint(x, y, z, a);
    const n0 = a > 14 ? 4 : a > 9 ? 3 : 2, edge0 = 'rgba(92,60,42,0.10)';
    for (const v of list) {
      const { x, y, z } = v, has = roomModel.has, n = v.s ? 1 : n0, edge = v.s ? null : edge0;
      if (!has(x, y + 1, z)) texturedFace(ctx, [P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z)], (v.f && v.f.y) || v.c, 0.86, [x, y, z, 1], n, edge);
      if (!has(x + 1, y, z)) texturedFace(ctx, [P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x + 1, y, z)], (v.f && v.f.x) || v.c, 0.74, [x, y, z, 2], n, edge);
      if (!has(x, y, z + 1)) texturedFace(ctx, [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)], (v.f && v.f.t) || v.c, 1, [x, y, z, 3], n, edge);
    }
    // 냉장고 몸체 윤곽선(한 덩어리로 보이게)
    ctx.strokeStyle = 'rgba(92,60,42,0.35)'; ctx.lineWidth = Math.max(1, a * 0.07);
    poly(ctx, [P(0, 7, 6), P(2, 7, 6), P(2, 9, 6), P(2, 9, 0), P(0, 9, 0), P(0, 9, 6)]); ctx.stroke();
    roomCache.set(k, cv);
    return cv;
  }

  /* ---------- 소품: 냉장고 문 · 냄비 · 요리책 (t: 0 닫힘 → 1 열림) ---------- */
  function drawProps(ctx, a, st) {
    const P = (x, y, z) => roomPoint(x, y, z, a);
    const ink = '#5b3a2b', lw = Math.max(1, a * 0.08);
    const fill = (pts, c, stroke) => { poly(ctx, pts); ctx.fillStyle = c; ctx.fill(); if (stroke !== false) { ctx.strokeStyle = stroke || 'rgba(91,58,43,0.55)'; ctx.lineWidth = lw; ctx.stroke(); } };
    const tF = st.which === 'fridge' ? st.t : 0, tK = st.which === 'kitchen' ? st.t : 0, tB = st.which === 'recipes' ? st.t : 0;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';

    // 냉장고: 앞면(x=2) y 7~9, 높이 0~6. 경첩은 y=7 쪽, 문이 바깥으로 돌며 열린다.
    const FX = 2, Y0 = 7, Y1 = 9;
    const front = (y, z) => P(FX + 0.001, y, z);
    if (tF > 0) {
      // 안쪽: 밝은 칸 + 선반 + 음식
      fill([front(Y0, 0.15), front(Y1, 0.15), front(Y1, 5.85), front(Y0, 5.85)], '#eef7fb');
      fill([front(Y0 + 0.12, 0.3), front(Y1 - 0.12, 0.3), front(Y1 - 0.12, 3.8), front(Y0 + 0.12, 3.8)], '#f8fcff', false);
      fill([front(Y0 + 0.12, 4.15), front(Y1 - 0.12, 4.15), front(Y1 - 0.12, 5.7), front(Y0 + 0.12, 5.7)], '#e3f1f8', false);
      [1.4, 2.6, 4.15].forEach(z => { ctx.strokeStyle = '#b9d3df'; ctx.lineWidth = lw * 1.4; ctx.beginPath(); ctx.moveTo(...front(Y0 + 0.12, z)); ctx.lineTo(...front(Y1 - 0.12, z)); ctx.stroke(); });
      const item = (y0, y1, z0, z1, c) => fill([front(y0, z0), front(y1, z0), front(y1, z1), front(y0, z1)], c);
      item(7.3, 7.9, 0.35, 1.2, '#8fc27a'); item(8.1, 8.75, 0.35, 1.05, '#f29e91');
      item(7.25, 7.7, 1.45, 2.5, '#ffffff'); item(7.25, 7.7, 2.15, 2.5, '#9fc8e6');
      item(7.95, 8.8, 1.45, 1.85, '#f7d36a');
      item(7.4, 8.5, 2.65, 3.3, '#f6c58f'); item(7.3, 8.0, 4.2, 4.9, '#cfe7f3'); item(8.15, 8.7, 4.2, 4.65, '#e9a0b2');
    }
    // 문 판(각도 θ). 닫히면 앞면을 덮는다.
    const th = tF * Math.PI * 0.5, s = Math.sin(th), c = Math.cos(th);
    const door = (u, z) => P(FX + 0.002 + (u * 2) * s, Y0 + (u * 2) * c, z); // u: 경첩 0 → 끝 1
    const outer = th < Math.PI * 0.25;
    fill([door(0, 0.05), door(1, 0.05), door(1, 5.95), door(0, 5.95)], outer ? '#fdf6e6' : '#f4ead6');
    if (outer) {
      ctx.strokeStyle = 'rgba(91,58,43,0.6)'; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(...door(0, 4)); ctx.lineTo(...door(1, 4)); ctx.stroke();
      const bar = (z0, z1) => { const w = 0.11; fill([door(0.86 - w, z0), door(0.86, z0), door(0.86, z1), door(0.86 - w, z1)], '#f29aa0', ink); };
      bar(1.7, 3.4); bar(4.4, 5.3);
      // 하트 자석
      const [hx, hy] = door(0.32, 5.1), r = a * 0.22;
      ctx.fillStyle = '#ef7f8a'; ctx.beginPath(); ctx.moveTo(hx, hy + r * 0.9); ctx.bezierCurveTo(hx - r * 1.6, hy - r * 0.2, hx - r * 0.6, hy - r * 1.3, hx, hy - r * 0.35); ctx.bezierCurveTo(hx + r * 0.6, hy - r * 1.3, hx + r * 1.6, hy - r * 0.2, hx, hy + r * 0.9); ctx.fill();
    } else {
      // 문 안쪽 수납칸
      [[0.15, 1.2, '#f6c9c0'], [0.15, 2.6, '#cfe7f3'], [0.15, 4.4, '#f7e3a6']].forEach(([u, z, col]) => fill([door(u, z), door(0.85, z), door(0.85, z + 0.55), door(u, z + 0.55)], col));
    }

    // 냄비: 조리대 위(8.5, 1.5), 바닥 z=3
    const pc = [8.5, 1.5], pr = 0.62, ph = 0.75, RX = pr * Math.SQRT2 * a, RY = RX / 2;
    const [bx, by] = P(pc[0], pc[1], 3), [tx, ty] = P(pc[0], pc[1], 3 + ph);
    ctx.strokeStyle = ink; ctx.lineWidth = lw;
    // 손잡이
    [-1, 1].forEach(sg => { ctx.fillStyle = '#c96556'; ctx.beginPath(); ctx.ellipse(tx + sg * (RX + a * 0.12), ty + RY * 0.35, a * 0.16, a * 0.08, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    // 몸통
    ctx.beginPath(); ctx.moveTo(tx - RX, ty); ctx.lineTo(bx - RX, by); ctx.ellipse(bx, by, RX, RY, 0, Math.PI, 0, true); ctx.lineTo(tx + RX, ty); ctx.closePath();
    const g = ctx.createLinearGradient(tx - RX, 0, tx + RX, 0); g.addColorStop(0, '#f08c7a'); g.addColorStop(0.55, '#e07a6a'); g.addColorStop(1, '#c4614f');
    ctx.fillStyle = g; ctx.fill(); ctx.stroke();
    // 테두리(입구)
    ctx.fillStyle = tK > 0.15 ? '#f2c46b' : '#f3a596'; ctx.beginPath(); ctx.ellipse(tx, ty, RX, RY, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (tK > 0.15) { ctx.fillStyle = '#f7d98e'; ctx.beginPath(); ctx.ellipse(tx - RX * 0.2, ty - RY * 0.15, RX * 0.35, RY * 0.3, 0, 0, Math.PI * 2); ctx.fill(); }
    // 뚜껑: 열리면 위로 들리며 옆으로 비켜난다
    const lx = tx + RX * 1.1 * tK, ly = ty - a * 1.1 * tK, tilt = -0.35 * tK;
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(tilt);
    ctx.fillStyle = '#f3a596'; ctx.beginPath(); ctx.ellipse(0, 0, RX * 1.04, RY * 1.04, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f8bcb0'; ctx.beginPath(); ctx.ellipse(0, -RY * 0.25, RX * 0.8, RY * 0.95, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5b3a2b'; ctx.beginPath(); ctx.ellipse(0, -RY * 1.25, a * 0.13, a * 0.08, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // 김
    if (tK > 0.3) {
      ctx.save(); ctx.globalAlpha = Math.min(1, (tK - 0.3) / 0.5); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = lw * 1.6;
      [-0.35, 0.05, 0.4].forEach((o, i) => { const sx = tx + RX * o, sy = ty - RY * 0.4; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx - a * 0.25, sy - a * 0.35, sx + a * 0.25, sy - a * 0.6, sx, sy - a * (0.95 + i * 0.1)); ctx.stroke(); });
      ctx.restore();
    }

    // 요리책: 식탁 위(9.15~10.85, 4.7~6.3), 두께 0.3
    const z0 = 3, z1 = 3.32, x0 = 9.2, x1 = 10.8, y0 = 4.75, y1 = 6.25;
    if (tB < 0.5) {
      fill([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], '#fff6e4');
      fill([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], '#f6e7cc');
      [0.33, 0.66].forEach(f => { ctx.strokeStyle = 'rgba(160,120,90,0.45)'; ctx.lineWidth = lw * 0.6; ctx.beginPath(); ctx.moveTo(...P(x0 + 0.05, y1, z0 + (z1 - z0) * f)); ctx.lineTo(...P(x1, y1, z0 + (z1 - z0) * f)); ctx.stroke(); });
      fill([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], '#c95a4a');
      fill([P(x0, y0, z1), P(x0 + 0.22, y0, z1), P(x0 + 0.22, y1, z1), P(x0, y1, z1)], '#a8463a');
      fill([P(x0 + 0.55, y0 + 0.35, z1), P(x1 - 0.2, y0 + 0.35, z1), P(x1 - 0.2, y0 + 0.8, z1), P(x0 + 0.55, y0 + 0.8, z1)], '#fff3dc', false);
      const [cx, cy] = P((x0 + x1) / 2 + 0.15, y0 + 1.1, z1); ctx.fillStyle = '#f7d36a'; ctx.beginPath(); ctx.ellipse(cx, cy, a * 0.22, a * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      // 펼친 책: 표지 테두리 + 양쪽 속지 + 글줄
      const ym = (y0 + y1) / 2;
      fill([P(x0 - 0.1, y0 - 0.55, z0), P(x1 + 0.1, y0 - 0.55, z0), P(x1 + 0.1, y1 + 0.55, z0), P(x0 - 0.1, y1 + 0.55, z0)], '#c95a4a');
      fill([P(x0, y0 - 0.45, z0 + 0.12), P(x1, y0 - 0.45, z0 + 0.12), P(x1, ym, z0 + 0.04), P(x0, ym, z0 + 0.04)], '#fffdf6');
      fill([P(x0, ym, z0 + 0.04), P(x1, ym, z0 + 0.04), P(x1, y1 + 0.45, z0 + 0.12), P(x0, y1 + 0.45, z0 + 0.12)], '#fbf2df');
      ctx.strokeStyle = 'rgba(120,90,70,0.45)'; ctx.lineWidth = lw * 0.7;
      [[y0 - 0.25, ym - 0.15], [ym + 0.15, y1 + 0.25]].forEach(([ya, yb]) => { for (let i = 1; i <= 4; i++) { const xx = x0 + (x1 - x0) * i / 5; ctx.beginPath(); ctx.moveTo(...P(xx, ya, z0 + 0.1)); ctx.lineTo(...P(xx, yb, z0 + 0.1)); ctx.stroke(); } });
      const [ex, ey] = P(x0 + 0.5, y0 + 0.05, z0 + 0.1); ctx.fillStyle = '#f7d36a'; ctx.beginPath(); ctx.ellipse(ex, ey, a * 0.2, a * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  /* ---------- 그림 방(픽셀 일러스트) ----------
   * data-room-image="assets/…"가 있으면 블록 방 대신 그 그림을 그린다. 위치는 data-pos="x,y"(그림 기준 %).
   * 그림 바깥의 단색 배경은 처음 한 번 투명하게 지워서 친구별 하늘색이 비치게 한다. */
  const IMAGE_ROOM = { aspect: 1, fit: 1.02, size: 1254,
    // 누르면 반짝이는 가구 영역(그림 픽셀 기준 x0,y0,x1,y1)
    props: { fridge: [75, 330, 312, 820], kitchen: [900, 520, 1070, 640], recipes: [865, 785, 1015, 865] } };
  const roomImages = {};
  function clearBackdrop(img) {
    const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    let data; try { data = ctx.getImageData(0, 0, w, h); } catch { return c; }
    const px = data.data, seen = new Uint8Array(w * h), stack = [], r0 = px[0], g0 = px[1], b0 = px[2];
    const dist = i => Math.abs(px[i * 4] - r0) + Math.abs(px[i * 4 + 1] - g0) + Math.abs(px[i * 4 + 2] - b0);
    for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
    for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
    // 가장자리에서 시작해 배경색과 비슷한 칸만 지운다(방 테두리의 진한 선에서 멈춤). 경계는 반투명으로 부드럽게.
    while (stack.length) {
      const i = stack.pop(); if (seen[i]) continue; seen[i] = 1;
      const d = dist(i); if (d >= 70) continue;
      px[i * 4 + 3] = d < 40 ? 0 : Math.round(255 * (d - 40) / 30); if (d >= 40) continue;
      const x = i % w; if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1); if (i >= w) stack.push(i - w); if (i < w * (h - 1)) stack.push(i + w);
    }
    ctx.putImageData(data, 0, 0); return c;
  }
  function roomImage(src, onReady) {
    let e = roomImages[src];
    if (!e) {
      e = roomImages[src] = { canvas: null, waiting: [] };
      const img = new Image();
      img.onload = () => { e.canvas = clearBackdrop(img); e.waiting.splice(0).forEach(f => f()); };
      img.src = src;
    }
    if (!e.canvas && onReady) e.waiting.push(onReady);
    return e.canvas;
  }
  // 그림은 문을 움직일 수 없으니, 누른 가구가 환해지고 픽셀 반짝이가 퍼지는 것으로 '열림'을 보여 준다.
  function drawImageRoom(ctx, img, w, h, open) {
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    const r = IMAGE_ROOM.props[open.which]; if (!r || !open.t) return;
    const k = w / IMAGE_ROOM.size, cx = (r[0] + r[2]) / 2 * k, cy = (r[1] + r[3]) / 2 * k, R = Math.max(r[2] - r[0], r[3] - r[1]) / 2 * k;
    const glow = Math.sin(Math.PI * Math.min(1, open.t * 1.4)) * 0.6 + open.t * 0.25;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.25);
    g.addColorStop(0, `rgba(255,236,200,${glow})`); g.addColorStop(1, 'rgba(255,236,200,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6); ctx.restore();
    const s = Math.max(3, Math.round(w / 110)), a = 1 - open.t;
    for (let i = 0; i < 8; i++) {
      const ang = i / 8 * Math.PI * 2 + 0.3, d = R * (0.7 + open.t * 0.9), x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d * 0.8;
      ctx.fillStyle = i % 2 ? `rgba(255,255,255,${a})` : `rgba(255,214,120,${a})`;
      ctx.fillRect(Math.round(x - s / 2), Math.round(y - s * 1.5), s, s * 3); ctx.fillRect(Math.round(x - s * 1.5), Math.round(y - s / 2), s * 3, s);
    }
  }
  const aspectOf = container => container.dataset.roomImage ? IMAGE_ROOM.aspect : ROOM_ASPECT;
  function paintRoom(container) {
    const canvas = container.querySelector('canvas.voxel-room-canvas'); if (!canvas) return;
    const w = container.clientWidth || 360, h = w / aspectOf(container);
    const open = container._sobokOpen || { which: '', t: 0 };
    if (container.dataset.roomImage) {
      const img = roomImage(container.dataset.roomImage, () => paintRoom(container));
      const ctx = sizeCanvas(canvas, w, h); if (img) drawImageRoom(ctx, img, w, h, open); return;
    }
    const ctx = sizeCanvas(canvas, w, h);
    ctx.drawImage(renderRoomBitmap(w), 0, 0, w, h);
    drawProps(ctx, w / ROOM_UNITS.w, open);
  }
  function drawRoom(container) {
    if (!container.querySelector('canvas.voxel-room-canvas')) return;
    const aspect = aspectOf(container);
    container.style.aspectRatio = String(aspect);
    // data-fit="contain": 부모 영역에 꽉 차게(블록 방은 가로가 살짝 넘쳐도 됨) 크기를 직접 정한다.
    if (container.dataset.fit === 'contain' && container.parentElement) {
      const p = container.parentElement, fw = Math.min(p.clientWidth * (container.dataset.roomImage ? IMAGE_ROOM.fit : 1.18), p.clientHeight * aspect);
      if (fw > 0) { container.style.width = fw + 'px'; container.style.height = fw / aspect + 'px'; }
    }
    paintRoom(container);
    container.querySelectorAll('[data-anchor]').forEach(el => {
      const [x, y, z] = el.dataset.anchor.split(',').map(Number), [px, py] = roomPercent(x, y, z);
      el.style.left = px + '%'; el.style.top = py + '%';
    });
    container.querySelectorAll('[data-pos]').forEach(el => {
      const [px, py] = el.dataset.pos.split(',').map(Number);
      el.style.left = px + '%'; el.style.top = py + '%';
    });
  }
  // 누른 가구만 제자리에서 열린다(확대·캐릭터 숨김 없음). 다 열리면 잠깐 보여 주고 resolve.
  function playOpen(container, which) {
    return new Promise(resolve => {
      if (!container || !['fridge', 'kitchen', 'recipes'].includes(which)) { resolve(); return; }
      const reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const dur = reduce ? 0 : 520, start = performance.now(), ease = t => 1 - Math.pow(1 - t, 3);
      container.classList.add('is-opening');
      const step = now => {
        const t = dur ? Math.min(1, (now - start) / dur) : 1;
        container._sobokOpen = { which, t: ease(t) };
        paintRoom(container);
        if (t < 1) requestAnimationFrame(step); else setTimeout(resolve, reduce ? 150 : 380);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- 친구(나노블럭식 정면 블록) ----------
   * x: 오른쪽, y: 안쪽, z: 위. 보이는 면은 앞(-y), 위(+z), 오른쪽(+x). */
  const K1 = 0.42, K2 = 0.30;
  const FACE = { base: { eye: 'big', mouth: 'w', blush: true } };
  const CHARACTERS = {
    chiikawa: { body: '#fbfaf6', ears: 'round' },
    hachiware: { body: '#fbfaf6', cap: '#5fb4e6', capSplit: true, ears: 'cat', earColor: '#5fb4e6', tail: '#5fb4e6' },
    usagi: { body: '#f6e9c8', ears: 'bunny', inner: '#f2a7a4', face: { eye: 'big', brows: true, mouth: 'open' } },
    shisa: { body: '#f6e6c8', mane: '#e68a3c', shirt: '#d6453c', face: { eye: 'big', mouth: 'w' } },
    momonga: { body: '#fbfbfb', ears: 'bunny-short', inner: '#8fcfe6', band: '#bfe4f2', face: { eye: 'smug', mouth: 'w' } },
    rakko: { body: '#f4e9d4', side: '#2f2b2a', lower: '#fbfaf6', face: { eye: 'big', mouth: 'w', star: true } },
    beetle: { body: '#f9f1e3', frame: '#8a5a3a', horn: '#8a5a3a', face: { eye: 'dot', mouth: 'w' } },
    kurimanju: { body: '#f5e3bf', cap: '#8a5a33', face: { eye: 'dot', mouth: 'w' } },
    goblin: { body: '#a9cf86', point: true, sideEars: '#a9cf86', shirt: '#8b6b4d', face: { eye: 'dot', mouth: 'w' } },
    armor: { body: '#b9bdc4', visor: '#3b3c44', pouch: '#f4a9b4', face: { eye: 'none', mouth: 'none', blush: false } },
    kani: { body: '#fbe8e2', claws: '#f08a8f', book: '#7fbf6a', face: { eye: 'big', mouth: 'w' } },
    anoko: { body: '#fbfbfb', horn: '#f0a04b', tailA: '#f4c7b4', tailB: '#5f9e94', face: { eye: 'big', mouth: 'w' } }
  };
  function buildCharacter(id) {
    const cfg = CHARACTERS[id] || CHARACTERS.hachiware;
    const vox = new Map(), key = (x, y, z) => x + ',' + y + ',' + z;
    const put = (x, y, z, c, faces) => vox.set(key(x, y, z), { x, y, z, c: rgbOf(c), f: faces ? Object.fromEntries(Object.entries(faces).map(([k, v]) => [k, rgbOf(v)])) : null });
    const del = (x, y, z) => vox.delete(key(x, y, z));
    const box = (x0, y0, z0, w, d, h, c) => { for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + d; y++) for (let z = z0; z < z0 + h; z++) put(x, y, z, c); };
    const paint = (x, y, z, face, c) => { const v = vox.get(key(x, y, z)); if (v) { v.f = v.f || {}; v.f[face] = rgbOf(c); } };
    const B = cfg.body;
    // 몸통 · 팔 · 다리
    box(2, 1, 1, 4, 3, 2, cfg.shirt || B);
    box(1, 1, 1, 1, 2, 1, B); box(6, 1, 1, 1, 2, 1, B);
    box(2, 1, 0, 1, 2, 1, B); box(5, 1, 0, 1, 2, 1, B);
    // 머리(앞에서 본 8×6, 깊이 5) — 네 모서리를 깎아 둥글게
    box(0, 0, 3, 8, 5, 6, B);
    for (let y = 0; y < 5; y++) { del(0, y, 3); del(7, y, 3); del(0, y, 8); del(7, y, 8); }
    if (cfg.cap) { for (let x = 1; x <= 6; x++) for (let y = 0; y < 5; y++) put(x, y, 8, cfg.cap); for (let y = 0; y < 5; y++) { put(0, y, 7, cfg.cap); put(7, y, 7, cfg.cap); } if (cfg.capSplit) { put(3, 0, 8, B); put(4, 0, 8, B); } else { for (let x = 1; x <= 6; x++) for (let y = 1; y < 4; y++) put(x, y, 9, cfg.cap); } }
    // 귀
    if (cfg.ears === 'round') { [1, 6].forEach(x => { put(x, 2, 9, B); put(x, 3, 9, B); }); }
    if (cfg.ears === 'cat') { const c = cfg.earColor || B; [[0, 1], [6, 7]].forEach(([a, b]) => { for (let y = 1; y <= 3; y++) { put(a, y, 9, c); put(b, y, 9, c); } put(a === 0 ? 0 : 7, 2, 10, c); }); }
    if (cfg.ears === 'bunny' || cfg.ears === 'bunny-short') {
      const top = cfg.ears === 'bunny' ? 14 : 11;
      [[1, 2], [5, 6]].forEach(([a, b]) => { for (let z = 9; z <= top; z++) { put(a, 2, z, B); put(b, 2, z, B); } for (let z = 9; z < top; z++) paint(a === 1 ? 2 : 5, 2, z, 'y', cfg.inner); });
    }
    if (cfg.mane) { for (let z = 3; z <= 8; z++) for (let y = 0; y < 5; y++) { put(-1, y, z, cfg.mane); put(8, y, z, cfg.mane); } for (let x = 1; x <= 6; x += 2) put(x, 2, 9, cfg.mane); }
    if (cfg.side) { for (let z = 5; z <= 7; z++) for (let y = 1; y < 4; y++) { put(-1, y, z, cfg.side); put(8, y, z, cfg.side); } box(2, 1, 1, 4, 3, 2, cfg.lower); }
    if (cfg.frame) { for (let x = 0; x < 8; x++) for (let z = 3; z <= 8; z++) { if (vox.has(key(x, 0, z))) put(x, 0, z, (x >= 1 && x <= 6 && z >= 4 && z <= 7) ? B : cfg.frame); } for (let x = 0; x < 8; x++) for (let y = 1; y < 5; y++) for (let z = 3; z <= 8; z++) if (vox.has(key(x, y, z))) put(x, y, z, cfg.frame); put(3, 2, 9, cfg.horn); put(4, 2, 9, cfg.horn); put(3, 2, 10, cfg.horn); }
    if (cfg.point) { for (let x = 2; x <= 5; x++) for (let y = 1; y < 4; y++) put(x, y, 9, B); put(3, 2, 10, B); put(4, 2, 10, B); put(3, 2, 11, B); }
    if (cfg.sideEars) { put(-1, 2, 6, cfg.sideEars); put(8, 2, 6, cfg.sideEars); put(-2, 2, 7, cfg.sideEars); put(9, 2, 7, cfg.sideEars); }
    if (cfg.claws) { [[0, 1], [6, 7]].forEach(([a, b]) => { put(a, 2, 9, cfg.claws); put(b, 2, 9, cfg.claws); put(a, 2, 10, cfg.claws); put(b, 2, 10, cfg.claws); }); put(1, 2, 10, B); put(6, 2, 10, B); del(1, 2, 10); del(6, 2, 10); for (let x = 1; x <= 6; x++) paint(x, 0, 8, 'y', cfg.claws); for (let x = 1; x <= 6; x++) for (let y = 0; y < 5; y++) { const v = vox.get(key(x, y, 8)); if (v) v.c = rgbOf(cfg.claws); } box(3, 0, 1, 2, 1, 2, cfg.book); }
    if (cfg.horn && !cfg.frame) { put(3, 2, 9, cfg.horn); put(4, 2, 9, cfg.horn); }
    if (cfg.tailA) { box(7, 3, 1, 2, 2, 2, cfg.tailA); box(8, 3, 3, 2, 2, 2, cfg.tailB); box(9, 3, 5, 1, 2, 1, cfg.tailA); }
    if (cfg.tail) { put(7, 3, 1, cfg.tail); put(8, 3, 2, cfg.tail); }
    if (cfg.pouch) { box(2, 0, 1, 2, 1, 1, cfg.pouch); }
    if (cfg.band) { for (let x = 1; x <= 6; x++) paint(x, 0, 6, 'y', cfg.band); }
    if (cfg.visor) { for (let x = 1; x <= 6; x++) { paint(x, 0, 5, 'y', cfg.visor); paint(x, 0, 6, 'y', cfg.visor); } put(3, 2, 9, B); put(4, 2, 9, B); }
    return { vox, has: (x, y, z) => vox.has(key(x, y, z)), cfg, face: { x0: 0, x1: 8, z0: 3, z1: 9 } };
  }
  const charCache = new Map();
  function charBitmap(id, w, h) {
    const k = id + '@' + Math.round(w) + 'x' + Math.round(h) + '@' + dprOf();
    if (charCache.has(k)) return charCache.get(k);
    const m = buildCharacter(id), list = [...m.vox.values()];
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9, minz = 1e9, maxz = -1e9;
    list.forEach(v => { minx = Math.min(minx, v.x); maxx = Math.max(maxx, v.x + 1); miny = Math.min(miny, v.y); maxy = Math.max(maxy, v.y + 1); minz = Math.min(minz, v.z); maxz = Math.max(maxz, v.z + 1); });
    const depth = maxy - miny, uw = (maxx - minx) + depth * K1 + 0.6, uh = (maxz - minz) + depth * K2 + 1.2;
    const s = Math.min(w / uw, h / uh);
    const ox = (w - uw * s) / 2 + 0.3 * s - minx * s - miny * s * K1, oy = h - 0.35 * s + minz * s + miny * s * K2;
    const Q = (x, y, z) => [ox + x * s + y * s * K1, oy - z * s - y * s * K2];
    const cv = document.createElement('canvas'), ctx = sizeCanvas(cv, w, h);
    ctx.lineWidth = Math.max(0.6, s * 0.06);
    // 바닥 그림자
    const [cxs, cys] = Q((minx + maxx) / 2, (miny + maxy) / 2, minz);
    ctx.fillStyle = 'rgba(92,60,42,0.16)'; ctx.beginPath(); ctx.ellipse(cxs, cys, (maxx - minx) * s * 0.55, s * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    list.sort((p, q) => q.y - p.y || p.z - q.z || p.x - q.x);
    const edge = 'rgba(70,44,32,0.28)';
    for (const v of list) {
      const { x, y, z } = v;
      if (!m.has(x + 1, y, z)) texturedFace(ctx, [Q(x + 1, y, z + 1), Q(x + 1, y + 1, z + 1), Q(x + 1, y + 1, z), Q(x + 1, y, z)], (v.f && v.f.x) || v.c, 0.8, [x, y, z, 5], 1, edge);
      if (!m.has(x, y, z + 1)) {
        texturedFace(ctx, [Q(x, y, z + 1), Q(x + 1, y, z + 1), Q(x + 1, y + 1, z + 1), Q(x, y + 1, z + 1)], (v.f && v.f.t) || v.c, 1.06, [x, y, z, 6], 1, edge);
        // 나노블럭 돌기
        const c = (v.f && v.f.t) || v.c, cx = x + 0.5, cy = y + 0.5, r = 0.27, hgt = 0.2;
        const a1 = Q(cx - r, cy - r, z + 1), b1 = Q(cx + r, cy - r, z + 1), c1 = Q(cx + r, cy + r, z + 1 + hgt), d1 = Q(cx - r, cy + r, z + 1 + hgt);
        ctx.fillStyle = css(c, 0.9); poly(ctx, [Q(cx - r, cy - r, z + 1 + hgt), Q(cx + r, cy - r, z + 1 + hgt), b1, a1]); ctx.fill();
        ctx.fillStyle = css(c, 1.12); poly(ctx, [Q(cx - r, cy - r, z + 1 + hgt), Q(cx + r, cy - r, z + 1 + hgt), c1, d1]); ctx.fill();
      }
      if (!m.has(x, y - 1, z)) texturedFace(ctx, [Q(x, y, z + 1), Q(x + 1, y, z + 1), Q(x + 1, y, z), Q(x, y, z)], (v.f && v.f.y) || v.c, 1, [x, y, z, 4], 1, edge);
    }
    drawFace(ctx, m, Q, s);
    charCache.set(k, cv);
    return cv;
  }
  // 얼굴은 머리 앞면에 붙인 스티커처럼 그린다.
  function drawFace(ctx, m, Q, s) {
    const f = Object.assign({}, FACE.base, m.cfg.face || {});
    const [lx, ty] = Q(m.face.x0, 0, m.face.z1), [rx, by] = Q(m.face.x1, 0, m.face.z0);
    const fw = rx - lx, fh = by - ty, at = (u, v) => [lx + fw * u, ty + fh * v];
    const ink = '#2b1d18';
    ctx.lineCap = 'round';
    if (f.blush !== false) {
      [[0.2, 0.68], [0.8, 0.68]].forEach(([u, v]) => {
        const [x, y] = at(u, v); ctx.fillStyle = 'rgba(242,140,150,0.75)'; ctx.beginPath(); ctx.ellipse(x, y, fw * 0.09, fh * 0.06, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(214,92,110,0.8)'; ctx.lineWidth = Math.max(0.7, s * 0.07);
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * fw * 0.035 - fw * 0.012, y + fh * 0.03); ctx.lineTo(x + i * fw * 0.035 + fw * 0.012, y - fh * 0.03); ctx.stroke(); }
      });
    }
    if (f.eye === 'big') {
      [[0.32, 0.5], [0.68, 0.5]].forEach(([u, v]) => {
        const [x, y] = at(u, v); ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(x, y, fw * 0.075, fh * 0.1, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x - fw * 0.022, y - fh * 0.035, fw * 0.03, fh * 0.035, 0, 0, Math.PI * 2); ctx.fill();
      });
    } else if (f.eye === 'dot') {
      [[0.33, 0.52], [0.67, 0.52]].forEach(([u, v]) => { const [x, y] = at(u, v); ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(x, y, fw * 0.04, fh * 0.055, 0, 0, Math.PI * 2); ctx.fill(); });
    } else if (f.eye === 'smug') {
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, s * 0.16);
      [[0.32, 0.5], [0.68, 0.5]].forEach(([u, v]) => { const [x, y] = at(u, v); ctx.beginPath(); ctx.ellipse(x, y, fw * 0.08, fh * 0.05, 0, Math.PI, 0, true); ctx.stroke(); ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(x, y + fh * 0.005, fw * 0.035, fh * 0.035, 0, 0, Math.PI * 2); ctx.fill(); });
    }
    if (f.brows) {
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(0.8, s * 0.1);
      [[0.32, 0.3], [0.68, 0.3]].forEach(([u, v]) => { const [x, y] = at(u, v); ctx.beginPath(); ctx.arc(x, y + fh * 0.08, fw * 0.1, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); });
    }
    if (f.star) {
      const [x, y] = at(0.3, 0.3), r = fw * 0.09; ctx.strokeStyle = ink; ctx.lineWidth = Math.max(0.8, s * 0.08); ctx.fillStyle = '#f4e9d4';
      ctx.beginPath(); for (let i = 0; i < 8; i++) { const ang = -Math.PI / 2 + i * Math.PI / 4, rr = i % 2 ? r * 0.35 : r; ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(0.8, s * 0.09);
    if (f.mouth === 'w') {
      const [x, y] = at(0.5, 0.66), dx = fw * 0.04, dy = fh * 0.035;
      ctx.beginPath(); ctx.moveTo(x - dx * 2, y - dy * 0.3); ctx.quadraticCurveTo(x - dx, y + dy * 1.4, x, y); ctx.quadraticCurveTo(x + dx, y + dy * 1.4, x + dx * 2, y - dy * 0.3); ctx.stroke();
    } else if (f.mouth === 'open') {
      const [x, y] = at(0.5, 0.68); ctx.fillStyle = '#3b221c'; ctx.beginPath(); ctx.ellipse(x, y, fw * 0.06, fh * 0.065, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f08a8f'; ctx.beginPath(); ctx.ellipse(x, y + fh * 0.03, fw * 0.035, fh * 0.03, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  function drawCharacter(canvas) {
    const r = canvas.getBoundingClientRect(); const w = r.width || 80, h = r.height || 80;
    const ctx = sizeCanvas(canvas, w, h);
    ctx.drawImage(charBitmap(canvas.dataset.voxelChar, w, h), 0, 0, w, h);
  }

  /* ---------- 진입점 ---------- */
  function hydrate(scope) {
    if (typeof document === 'undefined' || !document.createElement) return;
    const rootEl = scope || document;
    rootEl.querySelectorAll('[data-voxel-room]').forEach(drawRoom);
    rootEl.querySelectorAll('canvas[data-voxel-char]').forEach(drawCharacter);
  }
  let resizeTimer;
  if (root.addEventListener) root.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => hydrate(document), 120); });
  root.SobokVoxel = { hydrate, playOpen, roomPercent, ROOM_ASPECT, characters: Object.keys(CHARACTERS) };
})(typeof window !== 'undefined' ? window : globalThis);
