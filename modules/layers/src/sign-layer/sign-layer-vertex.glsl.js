// Copyright (c) 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.


export default `\
#define SHADER_NAME sign-layer-vertex-shader

attribute vec3 positions;

attribute vec3 instancePositions;
attribute vec2 instancePositions64xyLow;
attribute float instanceAngles;
attribute float instanceSizes;
attribute vec4 instanceColors;
attribute vec3 instancePickingColors;
attribute vec4 instanceIconFrames;
attribute float instanceColorModes;
attribute vec2 instanceOffsets;

uniform float sizeScale;
uniform vec2 iconsTextureDim;
uniform float render3D;

varying float vColorMode;
varying vec4 vColor;
varying vec2 vTextureCoords;

// determines if the grid line is behind or in front of the center
float frontFacing(vec3 v) {
  vec4 v_clipspace = project_uViewProjectionMatrix * project_uModelMatrix * vec4(v, 0.0);
  return step(v_clipspace.z, 0.0);
}

void main(void) {
  // rotation
  float angle = instanceAngles + PI / 2.0;
  mat3 rotationMatrix = mat3(
    cos(angle), sin(angle), 0.0,
    -sin(angle), cos(angle), 0.0,
    0.0, 0.0, 1.0
  );

  vec2 iconSize = instanceIconFrames.zw;
  vec2 texCoords = positions.xy;
  vec2 vertex_offset = (texCoords / 2.0 + instanceOffsets) * sizeScale * instanceSizes;
  vec3 vertex = vec3(
    vertex_offset.x,
    -vertex_offset.y * (1.0 - render3D),
    -vertex_offset.y * render3D
  );
  vColorMode = mix(
    0.0,
    1.0 - frontFacing(rotationMatrix * vec3(0.0, -1.0, 0.0)),
    render3D
  );

  vec3 offset = project_scale(rotationMatrix * vertex);
  gl_Position = project_position_to_clipspace(instancePositions, instancePositions64xyLow, offset);

  vTextureCoords = mix(
    instanceIconFrames.xy,
    instanceIconFrames.xy + iconSize,
    (texCoords + 1.0) / 2.0
  ) / iconsTextureDim;

  vTextureCoords.y = 1.0 - vTextureCoords.y;

  vColor = instanceColors / 255.;

  picking_setPickingColor(instancePickingColors);
}
`;