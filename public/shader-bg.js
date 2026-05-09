// Kinetic energy field — fragment shader background
// Mounts to a <canvas data-shader-bg> element
(function () {
  function initShaderBg(canvas, opts = {}) {
    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false });
    if (!gl) return null;

    const vsSrc = `
      attribute vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;

    const fsSrc = `
      precision highp float;
      uniform vec2 u_res;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_intensity;
      uniform vec3 u_colorA;
      uniform vec3 u_colorB;

      // hash + noise
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      float fbm(vec2 p) {
        float v = 0.0; float a = 0.5;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
        return v;
      }

      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_res.xy) / min(u_res.x, u_res.y);
        vec2 m = (u_mouse - 0.5 * u_res.xy) / min(u_res.x, u_res.y);

        // flow field
        float t = u_time * 0.08;
        vec2 q = uv * 1.6;
        q += 0.3 * vec2(fbm(q + t), fbm(q + vec2(3.2, 1.7) - t));
        float n = fbm(q * 1.8 + t * 1.2);

        // grid lines
        vec2 g = abs(fract(uv * 12.0 - 0.5) - 0.5);
        float grid = smoothstep(0.48, 0.5, max(g.x, g.y));
        grid *= smoothstep(1.4, 0.0, length(uv));

        // energy ribbons (sine bands warped by noise)
        float ribbon = 0.0;
        for (int i = 0; i < 3; i++) {
          float fi = float(i);
          float y = uv.y + sin(uv.x * 2.0 + t * (1.0 + fi * 0.3) + fi) * 0.35
                          + (n - 0.5) * 0.6;
          ribbon += smoothstep(0.04, 0.0, abs(y - (fi * 0.25 - 0.25)));
        }

        // mouse highlight
        float ml = length(uv - m);
        float mouseGlow = exp(-ml * 3.0) * 0.6;

        // color comp
        vec3 base = vec3(0.04, 0.04, 0.045);
        vec3 col = base;
        col += u_colorA * ribbon * 0.55;
        col += u_colorB * grid * 0.18;
        col += u_colorA * mouseGlow * 0.4;

        // vignette + scanline
        float vig = smoothstep(1.6, 0.4, length(uv));
        col *= 0.55 + 0.7 * vig;
        col += 0.012 * sin(gl_FragCoord.y * 1.2 + u_time * 4.0);

        // film grain
        float gr = (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.04;
        col += gr;

        col *= u_intensity;
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    function compile(type, src) {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(sh));
      }
      return sh;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uIntensity = gl.getUniformLocation(prog, 'u_intensity');
    const uColorA = gl.getUniformLocation(prog, 'u_colorA');
    const uColorB = gl.getUniformLocation(prog, 'u_colorB');

    let mouse = [0, 0];
    let intensity = opts.intensity ?? 1.0;
    let colorA = opts.colorA ?? [0.0, 0.82, 1.0];
    let colorB = opts.colorB ?? [0.8, 1.0, 0.0];
    let raf = 0;
    const start = performance.now();

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function frame() {
      resize();
      const t = (performance.now() - start) / 1000;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouse[0] * canvas.width, mouse[1] * canvas.height);
      gl.uniform1f(uIntensity, intensity);
      gl.uniform3fv(uColorA, colorA);
      gl.uniform3fv(uColorB, colorB);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(frame);
    }

    function onMouse(e) {
      const r = canvas.getBoundingClientRect();
      mouse = [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
    }
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('resize', resize);

    frame();

    return {
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener('mousemove', onMouse);
        window.removeEventListener('resize', resize);
      },
      setIntensity(v) { intensity = v; },
      setColors(a, b) { if (a) colorA = a; if (b) colorB = b; },
    };
  }

  window.initShaderBg = initShaderBg;
})();
