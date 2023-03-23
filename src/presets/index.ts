import fabric from './fabric.json';
import gameoflife from './gameoflife.json';
import mitosis from './mitosis.json';
import pathways from './pathways.json';
import rule30 from './rule30.json';
import slimemold from './slimemold.json';
import stars from './stars.json';
import waves from './waves.json';
import worms from './worms.json';
import { randomColor } from '../renderer/utils';

export interface Config {
  name: string;
  persistent?: boolean;
  active_button?: boolean;
  reset_type?: string;

  hor_sym?: boolean;
  ver_sym?: boolean;
  full_sym?: boolean;

  filter?: Float32Array;
  activation?: string;
  color?: [number, number, number];
  bg_color?: string;
  skip_frames?: boolean;
}

const toFloat32 = (array: Record<number, number>): Float32Array => {
  return Float32Array.from(Object.values(array));
}

const getConfig = (json: any): Config => {
  if (json.color === "random") {
    json.color = randomColor();
  }

  return {
    name: json.name,
    persistent: json.persistent,
    active_button: json.active_button,
    reset_type: json.reset_type,
    hor_sym: json.hor_sym,
    ver_sym: json.ver_sym,
    full_sym: json.full_sym,
    filter: toFloat32(json.filter),
    activation: json.activation,
    color: json.color,
    bg_color: json.bg_color,
    skip_frames: json.skip_frames,
  };
}

// Create an object that contains all of the preset configurations
const presets: { [key: string]: Config } = {
  fabric: getConfig(fabric),
  gameoflife: getConfig(gameoflife),
  mitosis: getConfig(mitosis),
  pathways: getConfig(pathways),
  rule30: getConfig(rule30),
  slimemold: getConfig(slimemold),
  stars: getConfig(stars),
  waves: getConfig(waves),
  worms: getConfig(worms),
};


export default presets;