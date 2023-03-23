import Shaders from './shaders'

const FPS = 60;

type Color = {
  r: number;
  g: number;
  b: number;
};

class Renderer {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  gl: WebGLRenderingContext;
  brush_size: number;
  brush_arr_0: Uint8Array;
  brush_arr_1: Uint8Array;
  kernel: Float32Array;
  colorMask: Color;
  updaterequest: ReturnType<typeof window.requestAnimationFrame>;
  running: boolean;
  activationSource: string;
  persistent: boolean;
  skip_frames: boolean;
  frame_time: number;
  shader: WebGLProgram;
  onePixelAttr: WebGLUniformLocation;
  doStepAttr: WebGLUniformLocation;
  kernelAttr: WebGLUniformLocation;
  colorMaskAttr: WebGLUniformLocation;
  stateTexture: WebGLTexture;
  txa: WebGLTexture;
  fba: WebGLFramebuffer;
  txb: WebGLTexture;
  fbb: WebGLFramebuffer;
  size: number;
  vertexSource: string;
  fragSource: string;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.height = canvas.height;
    this.width = canvas.width;

    this.gl = canvas.getContext("webgl")!;

    this.setBrush(25);
    this.activationSource = '';
    this.persistent = false;
    this.skip_frames = false;

    this.frame_time = 1000 / FPS;
  }

  compileShaders(vertexSource: string, fragSource: string, activationSource = undefined): string | null {
    this.vertexSource = vertexSource;
    this.fragSource = fragSource;

    if (activationSource) {
      this.setActivationSource(activationSource);
    }
    fragSource = this.setFragValues(fragSource);

    // Create a vertex shader object
    let vertShader = this.gl.createShader(this.gl.VERTEX_SHADER)!;

    // Attach vertex shader source code
    this.gl.shaderSource(vertShader, vertexSource);

    // Compile the vertex shader
    this.gl.compileShader(vertShader);

    // Create fragment shader object
    let fragShader = this.gl.createShader(this.gl.FRAGMENT_SHADER)!;

    // Attach fragment shader source code
    this.gl.shaderSource(fragShader, fragSource);

    // Compile the fragmentt shader
    this.gl.compileShader(fragShader);

    // Create a shader program object to store
    // the combined shader program
    let shaderProgram = this.gl.createProgram()!;
    this.shader = shaderProgram;

    // Attach a vertex shader
    this.gl.attachShader(shaderProgram, vertShader);

    // Attach a fragment shader
    this.gl.attachShader(shaderProgram, fragShader);

    // Link both programs
    this.gl.linkProgram(shaderProgram);

    // Use the combined shader program object
    this.gl.useProgram(shaderProgram);

    if (this.gl.getShaderInfoLog(fragShader)) {
      // console.error("FRAGMENT SHADER ERROR:", gl.getShaderInfoLog(fragShader));
      return this.gl.getShaderInfoLog(fragShader);
    }
    if (this.gl.getShaderInfoLog(vertShader)) {
      console.error("VERTEX SHADER ERROR:", gl.getShaderInfoLog(vertShader));
    }
    if (this.gl.getProgramInfoLog(shaderProgram)) {
      console.error("SHADER PROGRAM ERROR:", gl.getProgramInfoLog(shaderProgram));
    }
    let vertexBuffer = this.gl.createBuffer();

    /*==========Defining and storing the geometry=======*/

    let vertices = [
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      -1.0, 1.0,
      1.0, -1.0,
      1.0, 1.0
    ];

    this.size = ~~(vertices.length / 2);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);

    // Get the attribute location
    let coord = this.gl.getAttribLocation(shaderProgram, "coordinates");

    // Point an attribute to the currently bound VBO
    this.gl.vertexAttribPointer(coord, 2, this.gl.FLOAT, false, 0, 0);

    // Enable the attribute
    this.gl.enableVertexAttribArray(coord);

    // define attributes
    this.onePixelAttr = this.gl.getUniformLocation(shaderProgram, "onePixel")!;
    this.doStepAttr = this.gl.getUniformLocation(shaderProgram, "doStep")!;
    this.kernelAttr = this.gl.getUniformLocation(this.shader, "u_kernel[0]")!;
    this.colorMaskAttr = this.gl.getUniformLocation(this.shader, "colorMask")!;

    return null;
  }

  setFragValues(fragSource: string, activationSource = this.activationSource, persistent = this.persistent) {
    fragSource = fragSource.replace("ACTIVATION_FUNCTION", activationSource);
    let persistentSource = persistent ? Shaders.persistentSource : '';
    fragSource = fragSource.replace("PERSISTENT_DISPLAY", persistentSource);
    return fragSource;
  }

  recompile() {
    return this.compileShaders(this.vertexSource!, this.fragSource!);
  }

  getState() {
    let gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbb!);
    let data = new Uint8Array(this.width * this.height * 4);
    gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    return data;
  }

  setState(startState: ArrayBufferView) {
    let gl = this.gl;

    this.stateTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.stateTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, startState);

    this.txa = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.txa);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    this.fba = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fba);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.txa, 0);

    this.txb = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.txb);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    this.fbb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbb);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.txb, 0);

    gl.bindTexture(gl.TEXTURE_2D, this.stateTexture);

    this.updateDisplay();
  }

  setActivationSource(activationSource: string) {
    // always requires recompilation
    this.activationSource = activationSource;
  }

  setColor(rgb: [number, number, number]) {
    this.colorMask = { r: rgb[0], g: rgb[1], b: rgb[2] };
    if (this.gl) {
      this.gl.uniform4f(this.colorMaskAttr!, this.colorMask.r, this.colorMask.g, this.colorMask.b, 1.0);
      this.updateDisplay();
    }
  }

  setKernel(kernel: Float32Array) {
    this.kernel = kernel;
  }

  setBrush(size: number) {
    this.brush_size = size;
    let arr_size = size * size * 4;
    this.brush_arr_1 = new Uint8Array(arr_size);
    this.brush_arr_0 = new Uint8Array(arr_size);
    for (let i = 0; i < arr_size; i++) {
      this.brush_arr_1[i] = 255;
      this.brush_arr_0[i] = 0;
    }
  }

  beginRender() {
    if (this.running)
      throw 'called beginRender() when already rendering'
    this.running = true;
    this.applyValues();
    this.render();
  }

  applyValues() {
    let gl = this.gl;
    gl.uniform2f(this.onePixelAttr, 1 / this.width, 1 / this.height);
    gl.uniform1f(this.doStepAttr, 0);
    gl.uniform1fv(this.kernelAttr, this.kernel);
    gl.uniform4f(this.colorMaskAttr, this.colorMask.r, this.colorMask.g, this.colorMask.b, 1.0);
  }

  stopRender() {
    this.running = false;
    if (this.updaterequest)
      window.cancelAnimationFrame(this.updaterequest);
    clearTimeout(this.updaterequest)
  }

  render() {
    let start = Date.now();
    this.updateState()
    if (this.skip_frames) {
      this.updateState();
      this.updateState();
      this.updateState();

    }

    this.updateDisplay();

    let compute_time = Date.now() - start;

    if (this.running) {
      this.updaterequest = window.requestAnimationFrame(() => { this.render(); });
      // this.updaterequest = setTimeout(() => { this.render(); }, this.frame_time - compute_time); // set render speed
    }
  }

  updateState() {
    this.gl.useProgram(this.shader);
    this.gl.uniform1f(this.doStepAttr, 1);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbb!);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.size!);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.txb!); // use texture b

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.size!);

    this.gl.uniform1f(this.doStepAttr, 0);

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fba!);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.size!);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.txa!);
  }

  updateDisplay() {
    let gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLES, 0, this.size!);
  }

  poke(x: number, y: number, fill_ones: boolean = true) {
    let gl = this.gl;
    y = this.height - y; // reverse y

    x = x - Math.floor(this.brush_size / 2); // center brush
    y = y - Math.floor(this.brush_size / 2);

    let brush_arr = fill_ones ? this.brush_arr_1 : this.brush_arr_0;

    gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, this.brush_size, this.brush_size,
      gl.RGBA, gl.UNSIGNED_BYTE,
      brush_arr);
    this.updateDisplay();
  }
}

export default Renderer;