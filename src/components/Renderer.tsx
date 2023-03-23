import Controller from "../renderer/controller";
import React, { useContext, useEffect, useState, useRef, FC } from "react";
import SettingsContext from "./SettingsContext";

const RenderCanvas: FC = () => {
  const settings = useContext(SettingsContext);

  const [mouseDown, setMouseDown] = useState(false);
  const [leftClick, setLeftClick] = useState(false);
  const [controller, setController] = useState<Controller>();
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [left, setLeft] = useState(0);
  const [top, setTop] = useState(0);
  const [scale, setScale] = useState(1);
  const [pixelated, setPixelated] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMouseUp = (e: React.MouseEvent) => {
    setMouseDown(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseDown(true);
    setLeftClick(e.button === 0);
    controller?.renderer!.poke(e.nativeEvent.offsetX, e.nativeEvent.offsetY, leftClick);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // if (event.targetTouches.length !== 1) return;

    e.preventDefault();

    setX(e.nativeEvent.offsetX);
    setY(e.nativeEvent.offsetY);

    if (mouseDown) {
      controller?.renderer!.poke(e.nativeEvent.offsetX, e.nativeEvent.offsetY, leftClick);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    // e.preventDefault();

    let canvas = canvasRef.current!;

    setX(e.nativeEvent.offsetX);
    setY(e.nativeEvent.offsetY);

    let sign = -Math.sign(e.deltaY);
    let newScale = Math.max(1, scale + (sign));

    if (newScale > 1) {
      setPixelated(true);

      if (sign == 1) {
        let half_w = Math.floor(canvas.width / 2);
        let half_h = Math.floor(canvas.height / 2);

        setLeft(left => left + (half_w - x) * (newScale - scale));
        setTop(top => top + (half_h - y) * (newScale - scale));
      }

      else {
        setLeft(left => left / newScale);
        setTop(top => top / newScale);
      }
    }

    else {
      setPixelated(false);
      setLeft(0);
      setTop(0);
      setScale(1);
    }
  }

  useEffect(() => {
    const {
      persistent,
      reset_type,
      hor_sym,
      ver_sym,
      full_sym,
      filter,
      activation,
      color,
      skip_frames
    } = settings.config;

    if (!controller || !controller.renderer) return;

    if (persistent != undefined)
      controller.setPersistent(persistent);

    if (reset_type != undefined)
      controller.reset_type = reset_type;

    if (hor_sym != undefined)
      controller.hor_sym = hor_sym;

    if (ver_sym != undefined)
      controller.ver_sym = ver_sym;

    if (full_sym != undefined)
      controller.full_sym = full_sym;

    if (filter != undefined)
      controller.filter = filter;

    if (activation != undefined)
      controller.activationSource = activation;

    if (color != undefined)
      controller.setColor(color);

    if (skip_frames != undefined)
      controller.renderer.skip_frames = skip_frames;

  }, [controller, settings]);

  useEffect(() => {
    controller?.renderer!.updateDisplay();
  }, [pixelated]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const controller = new Controller();
    controller.initRenderer(canvasRef.current);
    setController(controller);
  }, []);

  return <>
    <div id="container" className='renderer'>
      <canvas
        ref={canvasRef}
        id="canvas"
        width={512}
        height={512}
        className={`scale{${scale}} ${pixelated ? "pixelated" : "unpixelated"} renderer`}
        style={{
          left: `${left}px`,
          top: `${top}px`
        }}

        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      />
    </div>
  </>;
};

export default RenderCanvas;