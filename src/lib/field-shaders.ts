const HEAD = `#version 100
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uTint;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uC4;
uniform float uLight;
uniform float uAmt;
uniform float uTintStr;
uniform float uHue;
uniform mat3 uRot;
varying vec2 vUv;

vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float cnoise(vec2 P) {
  vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
  vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
  Pi = mod289(Pi);
  vec4 ix = Pi.xzxz;
  vec4 iy = Pi.yyww;
  vec4 fx = Pf.xzxz;
  vec4 fy = Pf.yyww;
  vec4 i = permute(permute(ix) + iy);
  vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
  vec4 gy = abs(gx) - 0.5;
  vec4 tx = floor(gx + 0.5);
  gx = gx - tx;
  vec2 g00 = vec2(gx.x, gy.x);
  vec2 g10 = vec2(gx.y, gy.y);
  vec2 g01 = vec2(gx.z, gy.z);
  vec2 g11 = vec2(gx.w, gy.w);
  vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
  g00 *= norm.x; g01 *= norm.y; g10 *= norm.z; g11 *= norm.w;
  float n00 = dot(g00, vec2(fx.x, fy.x));
  float n10 = dot(g10, vec2(fx.y, fy.y));
  float n01 = dot(g01, vec2(fx.z, fy.z));
  float n11 = dot(g11, vec2(fx.w, fy.w));
  vec2 fade_xy = fade(Pf.xy);
  vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
  return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * cnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v * 0.5 + 0.5;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2.0 + a.y * a.y * 0.75);
}
float Bayer4(vec2 a) { return Bayer2(0.5 * a) * 0.25 + Bayer2(a); }
float Bayer8(vec2 a) { return Bayer4(0.5 * a) * 0.25 + Bayer2(a); }

float hash11(float n) { return fract(sin(n) * 43758.5453); }

float vnoise(vec3 p) {
  vec3 ip = floor(p);
  vec3 fp = fract(p);
  float n000 = hash11(dot(ip, vec3(1.0, 57.0, 113.0)));
  float n100 = hash11(dot(ip + vec3(1.0, 0.0, 0.0), vec3(1.0, 57.0, 113.0)));
  float n010 = hash11(dot(ip + vec3(0.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0)));
  float n110 = hash11(dot(ip + vec3(1.0, 1.0, 0.0), vec3(1.0, 57.0, 113.0)));
  float n001 = hash11(dot(ip + vec3(0.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0)));
  float n101 = hash11(dot(ip + vec3(1.0, 0.0, 1.0), vec3(1.0, 57.0, 113.0)));
  float n011 = hash11(dot(ip + vec3(0.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0)));
  float n111 = hash11(dot(ip + vec3(1.0, 1.0, 1.0), vec3(1.0, 57.0, 113.0)));
  vec3 w = fp * fp * fp * (fp * (fp * 6.0 - 15.0) + 10.0);
  float x00 = mix(n000, n100, w.x);
  float x10 = mix(n010, n110, w.x);
  float x01 = mix(n001, n101, w.x);
  float x11 = mix(n011, n111, w.x);
  return mix(mix(x00, x10, w.y), mix(x01, x11, w.y), w.z) * 2.0 - 1.0;
}

float fbm3(vec2 uv, float t) {
  vec3 p = vec3(uv * 2.0, t);
  float amp = 1.0;
  float freq = 1.0;
  float sum = 1.0;
  for (int i = 0; i < 5; i++) {
    sum += amp * vnoise(p * freq);
    freq *= 1.25;
  }
  return sum * 0.5 + 0.5;
}

vec3 vocariTint(vec3 col) {
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  float tl = max(dot(uTint, vec3(0.2126, 0.7152, 0.0722)), 0.08);
  return mix(col, uTint * (l / tl), uTintStr);
}

vec3 vocariLight(vec3 col) {
  vec3 paper = vec3(0.988, 0.988, 0.969);
  vec3 ink = vec3(0.027, 0.031, 0.039);
  if (uAmt <= 0.5) {
    float k = uAmt / 0.5;
    return mix(mix(paper, col, 0.4), col, k);
  }
  float k = (uAmt - 0.5) / 0.5;
  return mix(col, mix(col, ink, 0.78), k * 0.92);
}
`;

export const VERT = `#version 100
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const SHADERS: Record<string, string> = {
  pixel: `${HEAD}
void main() {
  float pixelSize = 4.0;
  vec2 fragCoord = gl_FragCoord.xy - uRes * 0.5;
  float aspect = uRes.x / max(uRes.y, 1.0);

  float cell = 8.0 * pixelSize;
  vec2 cellId = floor(fragCoord / cell);
  vec2 uv = (cellId * cell) / uRes * vec2(aspect, 1.0);

  float base = fbm3(uv, uTime * 0.05);
  float feed = base * 0.5 - 0.5;

  for (int i = 0; i < 5; i++) {
    float seed = float(i) * 19.17;
    float cycle = fract(uTime * 0.07 + hash(vec2(seed, 2.1)));
    vec2 src = vec2(hash(vec2(seed, 1.3)), hash(vec2(seed, 7.9))) * 2.0 - 1.0;
    src.x *= aspect;
    float r = distance(uv, src);
    float waveR = 0.32 * cycle;
    float ring = exp(-pow((r - waveR) / 0.1, 2.0));
    float atten = exp(-1.2 * cycle * 8.0) * exp(-10.0 * r);
    feed = max(feed, ring * atten * 1.1);
  }

  float bayer = Bayer8(fragCoord / pixelSize) - 0.5;
  float bw = step(0.5, feed + bayer);
  float h = hash(floor(fragCoord / pixelSize));
  float M = bw * (1.0 + (h - 0.5) * 0.18);

  vec2 norm = gl_FragCoord.xy / uRes;
  float edge = min(min(norm.x, norm.y), min(1.0 - norm.x, 1.0 - norm.y));
  M *= smoothstep(0.0, 0.42, edge);

  vec3 col = mix(vec3(0.02), uTint, clamp(M, 0.0, 1.0));
  gl_FragColor = vec4(vocariLight(col), 1.0);
}
`,

  dither: `${HEAD}
float waveFbm(vec2 p) {
  float value = 0.0;
  float amp = 1.0;
  float freq = 3.0;
  for (int i = 0; i < 4; i++) {
    value += amp * abs(cnoise(p));
    p *= freq;
    amp *= 0.3;
  }
  return value;
}

void main() {
  float pixelSize = 3.0;
  vec2 pix = floor(gl_FragCoord.xy / pixelSize) * pixelSize;
  vec2 uv = pix / uRes;
  uv -= 0.5;
  uv.x *= uRes.x / max(uRes.y, 1.0);

  vec2 p2 = uv - uTime * 0.05;
  float f = waveFbm(uv + vec2(waveFbm(p2)));
  vec3 col = mix(vec3(0.0), uTint, clamp(f, 0.0, 1.0));

  float colorNum = 4.0;
  float threshold = Bayer8(pix / pixelSize) - 0.25;
  float stepN = 1.0 / (colorNum - 1.0);
  col += threshold * stepN;
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = clamp(col - mix(0.2, 0.0, smoothstep(0.45, 0.8, lum)), 0.0, 1.0);
  col = floor(col * (colorNum - 1.0) + 0.5) / (colorNum - 1.0);
  gl_FragColor = vec4(vocariLight(col), 1.0);
}
`,

  bends: `${HEAD}
void main() {
  float t = uTime * 0.2;
  vec2 p = vUv * 2.0 - 1.0;
  float ang = 1.5708 + t * 0.04;
  float cs = cos(ang);
  float sn = sin(ang);
  vec2 rp = vec2(p.x * cs - p.y * sn, p.x * sn + p.y * cs);
  vec2 q = vec2(rp.x * (uRes.x / max(uRes.y, 1.0)), rp.y);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;

  vec2 rr = sin(1.5 * q.yx + 2.0 * cos(q));
  q += (rr - q) * 0.15;

  vec3 rgb = vec3(0.0);
  vec2 s = q;
  s -= 0.01;
  vec2 r0 = sin(1.5 * s.yx + 2.0 * cos(s));
  vec2 w0 = s + (r0 - s);
  float a0 = length(r0 + sin(5.0 * r0.y - 3.0 * t) / 4.0);
  float b0 = length(w0 + sin(5.0 * w0.y - 3.0 * t) / 4.0);
  rgb.r = 1.0 - exp(-6.0 / exp(6.0 * mix(a0, b0, 0.85)));
  s -= 0.01;
  vec2 r1 = sin(1.5 * s.yx + 2.0 * cos(s));
  vec2 w1 = s + (r1 - s);
  float a1 = length(r1 + sin(5.0 * r1.y - 3.0 * t + 1.0) / 4.0);
  float b1 = length(w1 + sin(5.0 * w1.y - 3.0 * t + 1.0) / 4.0);
  rgb.g = 1.0 - exp(-6.0 / exp(6.0 * mix(a1, b1, 0.85)));
  s -= 0.01;
  vec2 r2 = sin(1.5 * s.yx + 2.0 * cos(s));
  vec2 w2 = s + (r2 - s);
  float a2 = length(r2 + sin(5.0 * r2.y - 3.0 * t + 2.0) / 4.0);
  float b2 = length(w2 + sin(5.0 * w2.y - 3.0 * t + 2.0) / 4.0);
  rgb.b = 1.0 - exp(-6.0 / exp(6.0 * mix(a2, b2, 0.85)));
  rgb *= 1.5;
  float n = hash(gl_FragCoord.xy + vec2(uTime));
  rgb += (n - 0.5) * 0.12;
  gl_FragColor = vec4(vocariLight(vocariTint(clamp(rgb, 0.0, 1.0))), 1.0);
}
`,

  rays: `${HEAD}
float rayStrength(vec2 src, vec2 dir, vec2 coord, float seedA, float seedB, float speed) {
  vec2 to = coord - src;
  vec2 dirNorm = normalize(to);
  float cosA = dot(dirNorm, dir);
  float distorted = cosA + 0.18 * sin(uTime * 2.0 + length(to) * 0.01) * 0.2;
  float spread = pow(max(distorted, 0.0), 1.0);
  float dist = length(to);
  float maxD = uRes.x * 1.85;
  float fall = clamp((maxD - dist) / maxD, 0.0, 1.0);
  float fade = clamp((uRes.x - dist) / uRes.x, 0.5, 1.0);
  float base = clamp(
    (0.45 + 0.15 * sin(distorted * seedA + uTime * speed)) +
    (0.3 + 0.2 * cos(-distorted * seedB + uTime * speed)),
    0.0, 1.0
  );
  return base * fall * fade * spread;
}

void main() {
  vec2 coord = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 src = vec2(uRes.x * 0.5, -0.2 * uRes.y);
  vec2 dir = vec2(0.0, 1.0);
  float e = rayStrength(src, dir, coord, 36.2214, 21.11349, 1.5) * 0.5
          + rayStrength(src, dir, coord, 22.3991, 18.0234, 1.1) * 0.4;
  float brightness = 1.0 - (coord.y / max(uRes.y, 1.0));
  vec3 beam = vec3(
    e * (0.1 + brightness * 0.8),
    e * (0.3 + brightness * 0.6),
    e * (0.5 + brightness * 0.5)
  );
  beam *= uTint;
  if (uLight > 0.5) {
    vec3 mapped = vec3(1.0) - exp(-max(beam, vec3(0.0)) * 1.35);
    float energy = clamp(max(mapped.r, max(mapped.g, mapped.b)), 0.0, 1.0);
    vec3 hue = mapped / max(energy, 0.0001);
    vec3 ink = mix(hue * 0.25, hue * 0.72, energy);
    beam = mix(vec3(1.0), ink, energy);
  }
  gl_FragColor = vec4(vocariLight(beam), 1.0);
}
`,

  ether: `${HEAD}
vec2 curl(vec2 p) {
  float e = 0.02;
  float n1 = fbm(p + vec2(0.0, e));
  float n2 = fbm(p - vec2(0.0, e));
  float n3 = fbm(p + vec2(e, 0.0));
  float n4 = fbm(p - vec2(e, 0.0));
  return vec2(n1 - n2, n4 - n3);
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= uRes.x / max(uRes.y, 1.0);
  p *= 0.9;
  float t = uTime * 0.14;
  vec2 vel = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    vec2 c = curl(p * 1.2 + vec2(t * 0.42, -t * 0.28));
    vel += c;
    p += c * 0.24;
  }
  float mag = clamp(length(vel) * 0.45, 0.0, 1.0);
  vec3 ink = mix(uTint, uC2, mag);
  vec3 col = mix(uTint * 0.12, ink, mag);
  gl_FragColor = vec4(vocariLight(col), 1.0);
}
`,

  iris: `${HEAD}
void main() {
  float mr = min(uRes.x, uRes.y);
  vec2 uv = (vUv * 2.0 - 1.0) * uRes / mr;
  float d = -uTime * 0.5;
  float a = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    a += cos(fi - d - a * uv.x);
    d += sin(uv.y * fi + a);
  }
  d += uTime * 0.5;
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uTint;
  gl_FragColor = vec4(vocariLight(col), 1.0);
}
`,

  prism: `${HEAD}
vec4 tanh4(vec4 x) {
  vec4 e2x = exp(2.0 * x);
  return (e2x - 1.0) / (e2x + 1.0);
}

float sdOctaAniso(vec3 p) {
  vec3 q = vec3(abs(p.x) * 0.3636, abs(p.y) * 0.2857, abs(p.z) * 0.3636);
  float m = q.x + q.y + q.z - 1.0;
  return m * 2.75 * 0.57735027;
}

float sdPyramidUp(vec3 p) {
  return max(sdOctaAniso(p), -p.y);
}

mat3 hueRotation(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat3(
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114
  ) + mat3(
    0.701, -0.587, -0.114,
    -0.299, 0.413, -0.114,
    -0.300, -0.588, 0.886
  ) * c + mat3(
    0.168, -0.331, 0.500,
    0.328, 0.035, -0.500,
    -0.497, 0.296, 0.201
  ) * s;
}

void main() {
  float px = 1.0 / (uRes.y * 0.36);
  vec2 f = (gl_FragCoord.xy - 0.5 * uRes) * px;
  float z = 5.0;
  vec4 o = vec4(0.0);
  float t = uTime * 0.5;
  mat2 wob = mat2(cos(t), cos(t + 33.0), cos(t + 11.0), cos(t));

  for (int i = 0; i < 64; i++) {
    vec3 p = vec3(f, z);
    p.xz = wob * p.xz;
    p = uRot * p;
    vec3 q = p;
    q.y += 0.875;
    float d = 0.1 + 0.2 * abs(sdPyramidUp(q));
    z -= d;
    o += (sin((p.y + z) * 1.0 + vec4(0.0, 1.0, 2.0, 3.0)) + 1.0) / d;
  }
  o = tanh4(o * o / 1e5);
  vec3 col = clamp(o.rgb, 0.0, 1.0);
  float n = hash(gl_FragCoord.xy + vec2(uTime));
  col += (n - 0.5) * 0.5;
  col = clamp(col, 0.0, 1.0);
  col = clamp(hueRotation(uHue) * col, 0.0, 1.0);
  if (uLight > 0.5) {
    float peak = max(col.r, max(col.g, col.b));
    vec3 chroma = pow(clamp(col / max(peak, 0.0001), 0.0, 1.0), vec3(1.14));
    col = mix(vec3(1.0), chroma, clamp(o.a, 0.0, 1.0) * 0.94);
  }
  gl_FragColor = vec4(vocariLight(col), 1.0);
}
`,
};
