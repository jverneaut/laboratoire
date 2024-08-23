<script>
  import { onMount, afterUpdate } from 'svelte';

  import vShaderSource from '../shaders/vertex.glsl';
  import fShaderSource from '../shaders/fragment.glsl';

  import {
    createShader,
    createProgram,
    createTexture,
    createTextureMesh,
    createPlaneMesh,
  } from '../lib/gl';

  import { camelCaseToKebabCase, combineClassNames } from '../lib/strings';

  import {
    image,
    gl,
    program,
    texture,
    planeMesh,
    brightness,
    highlights,
    shadows,
    contrast,
    saturation,
    grain,
  } from '../store';

  const options = {
    withShadow: true,
    bgWhite: false,
    bgBlack: false,
  };

  $: optionsClassName = Object.keys(options)
    .filter(key => options[key])
    .map(key => '-' + camelCaseToKebabCase(key))
    .join(' ');

  let container;
  let loaded = false;
  afterUpdate(() => {
    if ($image) {
      if (!loaded) {
        // Create canvas and draw image
        loaded = true;
        const canvas = document.createElement('canvas');
        canvas.width = $image.width;
        canvas.height = $image.height;

        Object.assign(canvas.style, {
          maxHeight: 600 + 'px',
          maxWidth: 600 * ($image.width / $image.height) + 'px',
        });

        container.innerHTML = '';
        container.appendChild(canvas);

        $gl = canvas.getContext('webgl');

        const vShader = createShader($gl, $gl.VERTEX_SHADER, vShaderSource);
        const fShader = createShader($gl, $gl.FRAGMENT_SHADER, fShaderSource);

        $program = createProgram($gl, [vShader, fShader]);
        $gl.useProgram($program);

        $texture = createTexture($gl, $image);
        const textureMesh = createTextureMesh();

        const texcoordAttributeLocation = $gl.getAttribLocation($program, 'a_texcoord');

        const texcoordBuffer = $gl.createBuffer();
        $gl.bindBuffer($gl.ARRAY_BUFFER, texcoordBuffer);
        $gl.bufferData($gl.ARRAY_BUFFER, new Float32Array(textureMesh), $gl.STATIC_DRAW);
        $gl.enableVertexAttribArray(texcoordAttributeLocation);
        $gl.vertexAttribPointer(texcoordAttributeLocation, 2, $gl.FLOAT, false, 0, 0);

        $planeMesh = createPlaneMesh();

        const positionAttributeLocation = $gl.getAttribLocation($program, 'a_position');

        const positionsBuffer = $gl.createBuffer();
        $gl.bindBuffer($gl.ARRAY_BUFFER, positionsBuffer);
        $gl.bufferData($gl.ARRAY_BUFFER, new Float32Array($planeMesh), $gl.STATIC_DRAW);
        $gl.enableVertexAttribArray(positionAttributeLocation);
        $gl.vertexAttribPointer(positionAttributeLocation, 2, $gl.FLOAT, false, 0, 0);

        const brightnessUniformLocation = $gl.getUniformLocation($program, 'u_brightness');
        $gl.uniform1f(brightnessUniformLocation, $brightness);

        const highlightsUniformLocation = $gl.getUniformLocation($program, 'u_highlights');
        $gl.uniform1f(highlightsUniformLocation, $highlights);

        const shadowsUniformLocation = $gl.getUniformLocation($program, 'u_shadows');
        $gl.uniform1f(shadowsUniformLocation, $shadows);

        const contrastUniformLocation = $gl.getUniformLocation($program, 'u_contrast');
        $gl.uniform1f(contrastUniformLocation, $contrast);

        const saturationUniformLocation = $gl.getUniformLocation($program, 'u_saturation');
        $gl.uniform1f(saturationUniformLocation, $saturation);

        const grainUniformLocation = $gl.getUniformLocation($program, 'u_grain');
        $gl.uniform1f(grainUniformLocation, $grain);

        $gl.bindTexture($gl.TEXTURE_2D, $texture);
        $gl.drawArrays($gl.TRIANGLE_STRIP, 0, $planeMesh.length / 2);
      } else {
        // Apply filters and redraw
        const brightnessUniformLocation = $gl.getUniformLocation($program, 'u_brightness');
        $gl.uniform1f(brightnessUniformLocation, $brightness);

        const highlightsUniformLocation = $gl.getUniformLocation($program, 'u_highlights');
        $gl.uniform1f(highlightsUniformLocation, $highlights);

        const shadowsUniformLocation = $gl.getUniformLocation($program, 'u_shadows');
        $gl.uniform1f(shadowsUniformLocation, $shadows);

        const contrastUniformLocation = $gl.getUniformLocation($program, 'u_contrast');
        $gl.uniform1f(contrastUniformLocation, $contrast);

        const saturationUniformLocation = $gl.getUniformLocation($program, 'u_saturation');
        $gl.uniform1f(saturationUniformLocation, $saturation);

        const grainUniformLocation = $gl.getUniformLocation($program, 'u_grain');
        $gl.uniform1f(grainUniformLocation, $grain);

        $gl.bindTexture($gl.TEXTURE_2D, $texture);
        $gl.drawArrays($gl.TRIANGLE_STRIP, 0, $planeMesh.length / 2);
      }
    } else {
      loaded = false;
    }
  });
</script>

<div class={combineClassNames(['preview', optionsClassName])} bind:this={container} />
<div class="preview-options">
  <button
    on:click={() => {
      options.bgBlack = true;
      options.bgWhite = false;
    }}>
    BG Dark
  </button>
  <button
    on:click={() => {
      options.bgBlack = false;
      options.bgWhite = true;
    }}>
    BG White
  </button>
  <button
    on:click={() => {
      options.bgBlack = false;
      options.bgWhite = false;
    }}>
    BG Grey
  </button>
  <button
    on:click={() => {
      options.withShadow = !options.withShadow;
    }}>
    Shadows
  </button>
</div>
