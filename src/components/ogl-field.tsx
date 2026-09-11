import { useEffect, useRef } from 'react';
import { Mesh, Program, Renderer, Triangle } from 'ogl';
import { SHADERS, VERT } from '../lib/field-shaders';
import { themeColors, type VocariTheme } from '../lib/theme';

function setVec3(uniform: { value: number[] } | undefined, rgb: [number, number, number]) {
  if (!uniform?.value) return;
  uniform.value[0] = rgb[0];
  uniform.value[1] = rgb[1];
  uniform.value[2] = rgb[2];
}

export function OglField({
  theme,
  paused,
}: {
  theme: VocariTheme;
  paused: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef(theme);
  const pausedRef = useRef(paused);
  themeRef.current = theme;
  pausedRef.current = paused;

  useEffect(() => {
    const wrap = wrapRef.current;
    const fragment = SHADERS[theme.pattern];
    if (!wrap || !fragment) return;

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: 'high-performance',
    });
    const gl = renderer.gl;
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';
    wrap.appendChild(gl.canvas);

    const colors = themeColors(theme);
    const rot = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    let program: Program;
    try {
      program = new Program(gl, {
        vertex: VERT,
        fragment,
        cullFace: false,
        depthTest: false,
        uniforms: {
          uTime: { value: 0 },
          uRes: { value: new Float32Array([1, 1]) },
          uTint: { value: new Float32Array(colors.tintRgb) },
          uC0: { value: new Float32Array(colors.paletteRgb[0]) },
          uC1: { value: new Float32Array(colors.paletteRgb[1]) },
          uC2: { value: new Float32Array(colors.paletteRgb[2]) },
          uC3: { value: new Float32Array(colors.paletteRgb[3]) },
          uC4: { value: new Float32Array(colors.paletteRgb[4]) },
          uLight: { value: theme.field < 45 ? 1 : 0 },
          uAmt: { value: theme.field / 100 },
          uTintStr: { value: colors.tintStr },
          uHue: { value: colors.tintHue * Math.PI * 2 },
          uRot: { value: rot },
        },
      });
    } catch (err) {
      console.error(`[vocari] shader ${theme.pattern}`, err);
      if (gl.canvas.parentNode === wrap) wrap.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return;
    }

    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const applyColors = () => {
      const next = themeColors(themeRef.current);
      setVec3(program.uniforms.uTint, next.tintRgb);
      setVec3(program.uniforms.uC0, next.paletteRgb[0]);
      setVec3(program.uniforms.uC1, next.paletteRgb[1]);
      setVec3(program.uniforms.uC2, next.paletteRgb[2]);
      setVec3(program.uniforms.uC3, next.paletteRgb[3]);
      setVec3(program.uniforms.uC4, next.paletteRgb[4]);
      if (program.uniforms.uLight) {
        program.uniforms.uLight.value = themeRef.current.field < 45 ? 1 : 0;
      }
      if (program.uniforms.uAmt) {
        program.uniforms.uAmt.value = themeRef.current.field / 100;
      }
      if (program.uniforms.uTintStr) {
        program.uniforms.uTintStr.value = next.tintStr;
      }
      if (program.uniforms.uHue) {
        program.uniforms.uHue.value = next.tintHue * Math.PI * 2;
      }
      gl.clearColor(next.fieldRgb[0], next.fieldRgb[1], next.fieldRgb[2], 1);
    };

    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      renderer.setSize(w, h);
      const res = program.uniforms.uRes?.value as Float32Array | undefined;
      if (res) {
        res[0] = gl.drawingBufferWidth;
        res[1] = gl.drawingBufferHeight;
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    let raf = 0;
    let frozen = 0;
    const origin = performance.now();
    const loop = (now: number) => {
      const elapsed = (now - origin) * 0.001;
      if (!pausedRef.current) frozen = elapsed;
      if (program.uniforms.uTime) program.uniforms.uTime.value = frozen;
      applyColors();
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      if (gl.canvas.parentNode === wrap) wrap.removeChild(gl.canvas);
    };
  }, [theme.pattern]);

  return <div ref={wrapRef} className="absolute inset-0" />;
}
