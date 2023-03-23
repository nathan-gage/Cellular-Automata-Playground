import { generateState, randomKernel, randomColor } from './utils';
import Renderer from './renderer';
import Shaders from './shaders';

class Controller {
  filter: Float32Array;
  color: [number, number, number];
  paused: boolean;
  reset_type: string;
  activationSource: string;
  bgColor: string;
  hor_sym: boolean;
  ver_sym: boolean;
  full_sym: boolean;
  renderer?: Renderer;

  constructor() {
    this.filter = randomKernel();
    this.color = randomColor();
    this.paused = false;
    this.reset_type = 'random';
    this.activationSource = Shaders.defaultActivationSource;

    this.bgColor = '#000000'
    this.hor_sym = false;
    this.ver_sym = false;
    this.full_sym = false;
  }

  initRenderer(canvas: HTMLCanvasElement) {
    let renderer = new Renderer(canvas);

    renderer.setActivationSource(this.activationSource);
    renderer.setKernel(this.filter);
    renderer.compileShaders(Shaders.vertexShader, Shaders.fragmentShader);
    renderer.setColor(this.color);
    renderer.setState(generateState(renderer.width, renderer.height, 'random'));
    renderer.beginRender();

    this.renderer = renderer;

    const handleResize = () => {
      if (window.innerWidth == this.renderer!.width && window.innerHeight == this.renderer!.height)
        return;

      this.renderer!.stopRender();

      canvas.height = window.innerHeight;
      canvas.width = window.innerWidth;

      this.renderer!.height = canvas.height;
      this.renderer!.width = canvas.width;

      this.renderer!.gl.viewport(0, 0, this.renderer!.width, this.renderer!.height);
      this.renderer!.setState(generateState(this.renderer!.width, this.renderer!.height, this.reset_type));
      if (!this.paused)
        this.renderer!.beginRender();
    }

    window.onresize = handleResize;
    handleResize();
  }

  load(config: {
    reset_type: string;
    filter: Float32Array;
    activation: string;
    color: [number, number, number] | "random";
    persistent: boolean;
  }, reset: boolean) {
    this.reset_type = config.reset_type;
    this.filter = config.filter;
    this.activationSource = config.activation;
    if (config.color !== "random")
      this.color = config.color;
    this.setPersistent(config.persistent);
    this.apply(true);
    if (reset)
      this.resetState();
  }

  setRenderer(r: Renderer) {
    this.renderer = r;
  }

  apply(recompile = false): string | null {
    if (!this.paused) {
      this.renderer!.stopRender();
      let error = this._apply(recompile);
      this.renderer!.beginRender();
      return error;
    }
    else {
      let error = this._apply(recompile);
      this.renderer!.applyValues();
      return error;
    }
  }

  _apply(recompile: boolean) {
    this.renderer!.setKernel(this.filter);
    this.renderer!.setColor(this.color);
    this.renderer!.activationSource = this.activationSource;

    if (recompile)
      return this.renderer!.recompile();
    return null;
  }

  resetState(type = this.reset_type) {
    this.reset_type = (type !== `empty`) ? type : this.reset_type;
    let state = generateState(this.renderer!.width, this.renderer!.height, type);
    this.renderer!.setState(state);
  }

  setColor(color: [number, number, number]) {
    this.color = color;
    this.renderer!.setColor(color);
  }

  setPersistent(c: boolean) {
    this.renderer!.persistent = c;
    this.apply(true);
  }

  pauseToggle() {
    this.setPaused(!this.paused)
  }

  setPaused(paused = true) {
    if (this.paused === paused) return;
    this.paused = paused;
    if (this.paused)
      this.renderer!.stopRender();
    else
      this.renderer!.beginRender();
    return this.paused;
  }

  step() {
    this.renderer!.render();
  }

  offsetSkippedFrame() {
    this.renderer!.updateState();
    this.renderer!.updateDisplay();

  }
}

export default Controller;