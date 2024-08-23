export const createShader = (context, shaderType, shaderSource) => {
  const shader = context.createShader(shaderType);
  context.shaderSource(shader, shaderSource);
  context.compileShader(shader);

  return shader;
};

export const createProgram = (context, shaders) => {
  const program = context.createProgram();
  shaders.forEach((shader) => {
    context.attachShader(program, shader);
  });
  context.linkProgram(program);

  return program;
};

export const createTexture = (context, image) => {
  const texture = context.createTexture();
  context.bindTexture(context.TEXTURE_2D, texture);
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_WRAP_S,
    context.CLAMP_TO_EDGE
  );
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_WRAP_T,
    context.CLAMP_TO_EDGE
  );
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_MAG_FILTER,
    context.NEAREST
  );
  context.texParameteri(
    context.TEXTURE_2D,
    context.TEXTURE_MIN_FILTER,
    context.NEAREST
  );
  context.texImage2D(
    context.TEXTURE_2D,
    0,
    context.RGBA,
    context.RGBA,
    context.UNSIGNED_BYTE,
    image
  );

  return texture;
};

export const createPlaneMesh = (
  settings = {
    top: 1,
    bottom: -1,
    left: -1,
    right: 1,
    widthSegments: 2,
    heightSegments: 2,
  }
) => {
  const vertexPositions = [];
  for (let i = 0; i < settings.heightSegments; i++) {
    for (let j = 0; j < settings.widthSegments; j++) {
      vertexPositions.push([
        settings.left +
          (j * (settings.right - settings.left)) / (settings.widthSegments - 1),
        settings.top +
          (i * (settings.bottom - settings.top)) /
            (settings.heightSegments - 1),
      ]);
    }
  }

  const vertexIndices = [];
  for (let i = 0; i < settings.heightSegments - 1; i++) {
    for (let j = 0; j < settings.widthSegments; j++) {
      vertexIndices.push(j + i * settings.widthSegments);
      vertexIndices.push(j + (i + 1) * settings.widthSegments);
    }

    // Degenerated triangles
    if (i < settings.heightSegments - 2) {
      vertexIndices.push(
        ...[
          (i + 1) * settings.widthSegments + settings.widthSegments - 1,
          (i + 1) * settings.widthSegments,
        ]
      );
    }
  }

  const segments = vertexIndices.map((index) => vertexPositions[index]).flat();

  return segments;
};

export const createTextureMesh = (
  settings = {
    widthSegments: 2,
    heightSegments: 2,
  }
) => {
  const texturePositions = [];
  for (let i = 0; i < settings.heightSegments; i++) {
    for (let j = 0; j < settings.widthSegments; j++) {
      texturePositions.push([
        j / (settings.widthSegments - 1),
        i / (settings.heightSegments - 1),
      ]);
    }
  }

  const textureIndices = [];
  for (let i = 0; i < settings.heightSegments; i++) {
    for (let j = 0; j < settings.widthSegments; j++) {
      textureIndices.push(j + i * settings.widthSegments);
      textureIndices.push(j + (i + 1) * settings.widthSegments);
    }

    // Degenerated triangles
    if (i < settings.heightSegments - 2) {
      textureIndices.push(
        ...[
          (i + 1) * settings.widthSegments + settings.widthSegments - 1,
          (i + 1) * settings.widthSegments,
        ]
      );
    }
  }

  const textureCoords = textureIndices
    .map((index) => texturePositions[index])
    .flat();

  return textureCoords;
};
