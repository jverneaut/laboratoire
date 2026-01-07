import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useMemo, useRef } from 'react';
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader)
        throw new Error('Failed to create shader');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader) ?? 'Shader compile failed';
        gl.deleteShader(shader);
        throw new Error(info);
    }
    return shader;
}
function createProgram(gl, vs, fs) {
    const program = gl.createProgram();
    if (!program)
        throw new Error('Failed to create program');
    const v = createShader(gl, gl.VERTEX_SHADER, vs);
    const f = createShader(gl, gl.FRAGMENT_SHADER, fs);
    gl.attachShader(program, v);
    gl.attachShader(program, f);
    gl.linkProgram(program);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program) ?? 'Program link failed';
        gl.deleteProgram(program);
        throw new Error(info);
    }
    return program;
}
function computeLevel(analyser, buffer) {
    analyser.getByteTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] - 128) / 128;
        sum += v * v;
    }
    return Math.sqrt(sum / buffer.length);
}
function computeBands(analyser, buffer) {
    analyser.getByteFrequencyData(buffer);
    const n = buffer.length;
    const lowEnd = Math.floor(n * 0.08);
    const midEnd = Math.floor(n * 0.32);
    let low = 0;
    let mid = 0;
    let high = 0;
    for (let i = 0; i < n; i++) {
        const v = buffer[i] / 255;
        if (i < lowEnd)
            low += v;
        else if (i < midEnd)
            mid += v;
        else
            high += v;
    }
    low /= Math.max(1, lowEnd);
    mid /= Math.max(1, midEnd - lowEnd);
    high /= Math.max(1, n - midEnd);
    return { low, mid, high };
}
function clamp01(x) {
    return Math.max(0, Math.min(1, x));
}
export function Visualizer({ analyser, className }) {
    const canvasRef = useRef(null);
    const timeDomain = useMemo(() => new Uint8Array(analyser?.fftSize ?? 2048), [analyser?.fftSize]);
    const freqDomain = useMemo(() => new Uint8Array(analyser?.frequencyBinCount ?? 1024), [analyser?.frequencyBinCount]);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const gl2 = canvas.getContext('webgl2', {
            antialias: false,
            alpha: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
        });
        if (!gl2) {
            const gl = canvas.getContext('webgl', {
                antialias: false,
                alpha: false,
                powerPreference: 'high-performance',
            });
            if (!gl)
                return;
            const vertexSource = `
				attribute vec2 a_pos;
				varying vec2 v_uv;
				void main() {
					v_uv = (a_pos + 1.0) * 0.5;
					gl_Position = vec4(a_pos, 0.0, 1.0);
				}
			`;
            const fragmentSource = `
				precision highp float;
				varying vec2 v_uv;
				uniform vec2 u_resolution;
				uniform float u_time;
				uniform float u_level;

				float hash(vec2 p) {
					p = fract(p * vec2(123.34, 345.45));
					p += dot(p, p + 34.345);
					return fract(p.x * p.y);
				}

				void main() {
					vec2 uv = v_uv;
					vec2 p = uv - 0.5;
					p.x *= u_resolution.x / u_resolution.y;

					float r = length(p);
					float fog = exp(-2.2 * r);
					float hum = 0.5 + 0.5 * sin(9.0 * r - u_time * 0.18 + u_level * 8.0);
					float grain = (hash(uv * (500.0 + 900.0 * u_level) + u_time * 0.6) - 0.5);

					float energy = fog * mix(0.5, 1.25, hum) * (0.22 + 2.4 * u_level);
					vec3 base = vec3(0.012, 0.012, 0.016);
					vec3 tintA = vec3(0.05, 0.16, 0.22);
					vec3 tintB = vec3(0.10, 0.06, 0.16);
					vec3 col = base + energy * mix(tintA, tintB, 0.5 + 0.5 * sin(u_time * 0.04));
					col += grain * 0.045;

					float vign = smoothstep(1.2, 0.15, r);
					col *= mix(0.65, 1.0, vign);
					gl_FragColor = vec4(col, 1.0);
				}
			`;
            const program = createProgram(gl, vertexSource, fragmentSource);
            gl.useProgram(program);
            const posLoc = gl.getAttribLocation(program, 'a_pos');
            const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
            const timeLoc = gl.getUniformLocation(program, 'u_time');
            const levelLoc = gl.getUniformLocation(program, 'u_level');
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
            let raf = 0;
            const start = performance.now();
            const resize = () => {
                const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
                const width = Math.floor(canvas.clientWidth * dpr);
                const height = Math.floor(canvas.clientHeight * dpr);
                if (canvas.width !== width || canvas.height !== height) {
                    canvas.width = width;
                    canvas.height = height;
                    gl.viewport(0, 0, width, height);
                }
                if (resolutionLoc)
                    gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
            };
            const draw = () => {
                resize();
                const t = (performance.now() - start) / 1000;
                const level = analyser ? computeLevel(analyser, timeDomain) : 0;
                if (timeLoc)
                    gl.uniform1f(timeLoc, t);
                if (levelLoc)
                    gl.uniform1f(levelLoc, level);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
                raf = requestAnimationFrame(draw);
            };
            raf = requestAnimationFrame(draw);
            return () => {
                cancelAnimationFrame(raf);
                gl.deleteBuffer(buffer);
                gl.deleteProgram(program);
            };
        }
        const gl = gl2;
        const vertexSource = `#version 300 es
			in vec2 a_pos;
			out vec2 v_uv;
			void main() {
				v_uv = (a_pos + 1.0) * 0.5;
				gl_Position = vec4(a_pos, 0.0, 1.0);
			}
		`;
        const feedbackFragment = `#version 300 es
			precision highp float;
			in vec2 v_uv;
			out vec4 outColor;

			uniform vec2 u_resolution;
			uniform float u_time;
			uniform float u_level;
			uniform float u_low;
			uniform float u_mid;
			uniform float u_high;
			uniform sampler2D u_prev;
			uniform sampler2D u_audio;

			float hash11(float p) {
				p = fract(p * 0.1031);
				p *= p + 33.33;
				p *= p + p;
				return fract(p);
			}

			float hash(vec2 p) {
				vec3 p3 = fract(vec3(p.xyx) * 0.1031);
				p3 += dot(p3, p3.yzx + 33.33);
				return fract((p3.x + p3.y) * p3.z);
			}

			float noise(vec2 p) {
				vec2 i = floor(p);
				vec2 f = fract(p);
				float a = hash(i);
				float b = hash(i + vec2(1.0, 0.0));
				float c = hash(i + vec2(0.0, 1.0));
				float d = hash(i + vec2(1.0, 1.0));
				vec2 u = f * f * (3.0 - 2.0 * f);
				return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
			}

			float fbm(vec2 p) {
				float f = 0.0;
				float a = 0.55;
				for (int i = 0; i < 5; i++) {
					f += a * noise(p);
					p = p * 2.02 + vec2(17.13, 9.17);
					a *= 0.5;
				}
				return f;
			}

			vec3 palette(float t) {
				vec3 a = vec3(0.02, 0.02, 0.025);
				vec3 b = vec3(0.12, 0.10, 0.16);
				vec3 c = vec3(0.18, 0.22, 0.26);
				vec3 d = vec3(0.65, 0.22, 0.55);
				return a + b * cos(6.28318 * (c * t + d));
			}

			void main() {
				vec2 uv = v_uv;
				vec2 px = 1.0 / max(u_resolution, vec2(1.0));
				vec2 p = uv - 0.5;
				p.x *= u_resolution.x / max(1.0, u_resolution.y);

				float a0 = texture(u_audio, vec2(fract(0.05 + u_time * 0.01), 0.5)).r;
				float a1 = texture(u_audio, vec2(fract(0.31 + u_time * 0.007), 0.5)).r;
				float a2 = texture(u_audio, vec2(fract(0.76 + u_time * 0.005), 0.5)).r;

				float low = clamp(u_low * 1.35 + 0.45 * a0, 0.0, 1.0);
				float mid = clamp(u_mid * 1.25 + 0.45 * a1, 0.0, 1.0);
				float high = clamp(u_high * 1.35 + 0.45 * a2, 0.0, 1.0);

				float t = u_time * 0.22;
				float n = fbm(p * (1.4 + 2.0 * low) + vec2(t * 0.05, -t * 0.03));
				float n2 = fbm(p * 2.8 + vec2(-t * 0.02, t * 0.04));

				vec2 flow = vec2(
					fbm(p * 2.2 + vec2(13.0, 7.0) + t * 0.03),
					fbm(p * 2.2 + vec2(5.0, 17.0) - t * 0.03)
				) - 0.5;
				flow *= (0.002 + 0.006 * low + 0.003 * mid);

				float rings = exp(-2.5 * length(p)) * (0.5 + 0.5 * sin(10.0 * length(p) - t * 0.22 + 6.0 * low));
				float warp = (n - 0.5) * (0.002 + 0.006 * mid);
				vec2 uvw = uv + flow + vec2(warp, -warp);

				vec3 prev = texture(u_prev, uvw).rgb;
				float decay = 0.994 - 0.018 * clamp(u_level * 2.0, 0.0, 1.0);
				prev *= decay;

				float blot = smoothstep(0.55, 0.0, length(p + 0.08 * vec2(sin(t * 0.07), cos(t * 0.05))));
				blot *= 0.22 + 0.98 * low;
				blot *= 0.3 + 0.7 * smoothstep(0.35, 0.75, n);

				float scratches = smoothstep(0.96, 0.985, fbm(p * 8.0 + vec2(t * 0.04, t * 0.01)));
				scratches *= 0.06 + 0.12 * high;

				vec3 ink = palette(n2 + 0.25 * mid);
				ink *= (0.02 + 0.22 * mid + 0.09 * u_level);
				ink *= blot;

				vec3 ringCol = vec3(0.10, 0.14, 0.22) * (0.03 + 0.12 * low) * rings;
				vec3 scratchCol = vec3(0.12, 0.13, 0.15) * scratches;

				float grain = (hash(uv * (u_resolution.xy * 0.35) + t) - 0.5);
				vec3 gcol = vec3(grain) * (0.03 + 0.07 * high);

				vec3 col = prev + ink + ringCol + scratchCol + gcol;
				col = max(col, vec3(0.0));
				outColor = vec4(col, 1.0);
			}
		`;
        const presentFragment = `#version 300 es
			precision highp float;
			in vec2 v_uv;
			out vec4 outColor;
			uniform vec2 u_resolution;
			uniform float u_time;
			uniform float u_level;
			uniform sampler2D u_tex;

			float hash(vec2 p) {
				vec3 p3 = fract(vec3(p.xyx) * 0.1031);
				p3 += dot(p3, p3.yzx + 33.33);
				return fract((p3.x + p3.y) * p3.z);
			}

			void main() {
				vec2 uv = v_uv;
				vec2 p = uv - 0.5;
				p.x *= u_resolution.x / max(1.0, u_resolution.y);

				float chroma = 0.0012 + 0.0025 * smoothstep(0.0, 0.35, u_level);
				vec3 col;
				col.r = texture(u_tex, uv + vec2(chroma, 0.0)).r;
				col.g = texture(u_tex, uv).g;
				col.b = texture(u_tex, uv - vec2(chroma, 0.0)).b;

				float r = length(p);
				float vign = smoothstep(1.2, 0.15, r);
				col *= mix(0.65, 1.0, vign);

				float scan = 0.98 + 0.02 * sin((uv.y * u_resolution.y) * 1.2);
				col *= scan;

				float grain = hash(uv * u_resolution.xy + u_time * 25.0) - 0.5;
				col += vec3(grain) * 0.04;

				col *= 1.35 + 0.65 * smoothstep(0.0, 0.25, u_level);
				col = vec3(1.0) - exp(-max(col, vec3(0.0)) * 1.25);
				col = pow(max(col, vec3(0.0)), vec3(0.95));
				col = clamp(col, 0.0, 1.0);
				outColor = vec4(col, 1.0);
			}
		`;
        const feedbackProgram = createProgram(gl, vertexSource, feedbackFragment);
        const presentProgram = createProgram(gl, vertexSource, presentFragment);
        const triBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const createTexture = (width, height) => {
            const tex = gl.createTexture();
            if (!tex)
                throw new Error('Failed to create texture');
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            return tex;
        };
        const createFbo = (tex) => {
            const fbo = gl.createFramebuffer();
            if (!fbo)
                throw new Error('Failed to create framebuffer');
            gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            return fbo;
        };
        const audioTex = gl.createTexture();
        if (!audioTex)
            return;
        gl.bindTexture(gl.TEXTURE_2D, audioTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const audioW = 256;
        const audioH = 1;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, audioW, audioH, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array(audioW * audioH));
        let fbW = 0;
        let fbH = 0;
        let texA = null;
        let texB = null;
        let fboA = null;
        let fboB = null;
        let readTex = null;
        let writeTex = null;
        let readFbo = null;
        let writeFbo = null;
        const fbScale = 0.75;
        const resize = () => {
            const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
            const width = Math.max(2, Math.floor(canvas.clientWidth * dpr));
            const height = Math.max(2, Math.floor(canvas.clientHeight * dpr));
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }
            gl.viewport(0, 0, canvas.width, canvas.height);
            const targetW = Math.max(2, Math.floor(canvas.width * fbScale));
            const targetH = Math.max(2, Math.floor(canvas.height * fbScale));
            if (fbW === targetW && fbH === targetH && texA && texB && fboA && fboB)
                return;
            fbW = targetW;
            fbH = targetH;
            if (texA)
                gl.deleteTexture(texA);
            if (texB)
                gl.deleteTexture(texB);
            if (fboA)
                gl.deleteFramebuffer(fboA);
            if (fboB)
                gl.deleteFramebuffer(fboB);
            texA = createTexture(fbW, fbH);
            texB = createTexture(fbW, fbH);
            fboA = createFbo(texA);
            fboB = createFbo(texB);
            readTex = texA;
            writeTex = texB;
            readFbo = fboA;
            writeFbo = fboB;
            gl.bindFramebuffer(gl.FRAMEBUFFER, readFbo);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        };
        const bindTriangle = (program) => {
            gl.useProgram(program);
            const posLoc = gl.getAttribLocation(program, 'a_pos');
            gl.bindBuffer(gl.ARRAY_BUFFER, triBuffer);
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        };
        const audioUpload = new Uint8Array(audioW);
        const start = performance.now();
        let raf = 0;
        const draw = () => {
            resize();
            const t = (performance.now() - start) / 1000;
            const levelRaw = analyser ? computeLevel(analyser, timeDomain) : 0;
            const level = analyser
                ? Math.pow(clamp01(levelRaw * 3.0), 0.6)
                : 0;
            const bandsRaw = analyser
                ? computeBands(analyser, freqDomain)
                : { low: 0, mid: 0, high: 0 };
            const low = analyser ? Math.pow(clamp01(bandsRaw.low * 2.6), 0.7) : 0;
            const mid = analyser ? Math.pow(clamp01(bandsRaw.mid * 3.0), 0.7) : 0;
            const high = analyser ? Math.pow(clamp01(bandsRaw.high * 3.6), 0.7) : 0;
            if (analyser) {
                const src = freqDomain;
                for (let i = 0; i < audioW; i++) {
                    const idx = Math.floor((i / (audioW - 1)) * (src.length - 1));
                    audioUpload[i] = src[idx] ?? 0;
                }
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, audioTex);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, audioW, 1, gl.RED, gl.UNSIGNED_BYTE, audioUpload);
            }
            if (!readTex || !writeTex || !readFbo || !writeFbo) {
                raf = requestAnimationFrame(draw);
                return;
            }
            // Feedback pass.
            gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo);
            gl.viewport(0, 0, fbW, fbH);
            bindTriangle(feedbackProgram);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, readTex);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, audioTex);
            {
                const resLoc = gl.getUniformLocation(feedbackProgram, 'u_resolution');
                const timeLoc = gl.getUniformLocation(feedbackProgram, 'u_time');
                const levelLoc = gl.getUniformLocation(feedbackProgram, 'u_level');
                const lowLoc = gl.getUniformLocation(feedbackProgram, 'u_low');
                const midLoc = gl.getUniformLocation(feedbackProgram, 'u_mid');
                const highLoc = gl.getUniformLocation(feedbackProgram, 'u_high');
                const prevLoc = gl.getUniformLocation(feedbackProgram, 'u_prev');
                const audioLoc = gl.getUniformLocation(feedbackProgram, 'u_audio');
                if (resLoc)
                    gl.uniform2f(resLoc, fbW, fbH);
                if (timeLoc)
                    gl.uniform1f(timeLoc, t);
                if (levelLoc)
                    gl.uniform1f(levelLoc, level);
                if (lowLoc)
                    gl.uniform1f(lowLoc, low);
                if (midLoc)
                    gl.uniform1f(midLoc, mid);
                if (highLoc)
                    gl.uniform1f(highLoc, high);
                if (prevLoc)
                    gl.uniform1i(prevLoc, 0);
                if (audioLoc)
                    gl.uniform1i(audioLoc, 1);
            }
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            // Present pass.
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvas.width, canvas.height);
            bindTriangle(presentProgram);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, writeTex);
            {
                const resLoc = gl.getUniformLocation(presentProgram, 'u_resolution');
                const timeLoc = gl.getUniformLocation(presentProgram, 'u_time');
                const levelLoc = gl.getUniformLocation(presentProgram, 'u_level');
                const texLoc = gl.getUniformLocation(presentProgram, 'u_tex');
                if (resLoc)
                    gl.uniform2f(resLoc, canvas.width, canvas.height);
                if (timeLoc)
                    gl.uniform1f(timeLoc, t);
                if (levelLoc)
                    gl.uniform1f(levelLoc, level);
                if (texLoc)
                    gl.uniform1i(texLoc, 0);
            }
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            // Swap.
            [readTex, writeTex] = [writeTex, readTex];
            [readFbo, writeFbo] = [writeFbo, readFbo];
            raf = requestAnimationFrame(draw);
        };
        resize();
        raf = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(raf);
            gl.deleteProgram(feedbackProgram);
            gl.deleteProgram(presentProgram);
            if (triBuffer)
                gl.deleteBuffer(triBuffer);
            if (audioTex)
                gl.deleteTexture(audioTex);
            if (texA)
                gl.deleteTexture(texA);
            if (texB)
                gl.deleteTexture(texB);
            if (fboA)
                gl.deleteFramebuffer(fboA);
            if (fboB)
                gl.deleteFramebuffer(fboB);
        };
    }, [analyser, freqDomain, timeDomain]);
    return (_jsx("canvas", { ref: canvasRef, className: className, "aria-label": "Audio visualizer" }));
}
