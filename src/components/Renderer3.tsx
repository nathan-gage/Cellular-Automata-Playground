import React, { useContext, FC, useEffect } from 'react';
import SettingsContext from './SettingsContext';
import { Canvas, useFrame } from '@react-three/fiber';

const DEFAULT_ACTIVATION = `float activation(float x) {\n\treturn x;\n}`

interface RendererProps {
	width: number;
	height: number;
	activation?: string;
}

const getShaders = async (activationFunctionSource = DEFAULT_ACTIVATION) => {
	let fragmentSource = await fetch('../shaders/fragment.glsl').then(res => res.text());
	const vertexSource = await fetch('../shaders/vertex.glsl').then(res => res.text());

	fragmentSource = fragmentSource.replace('// ACTIVATION_FUNCTION', activationFunctionSource);

	return {
		fragmentSource,
		vertexSource,
	};
}

const Renderer: FC = () => {
	return <Canvas>
		<color attach='background' args={[0, 0, 0]} />
		<Scene />
	</Canvas>
}

const Scene: FC = () => {
	const [fragmentSource, setFragmentSource] = React.useState('');
	const [vertexSource, setVertexSource] = React.useState('');

	const settings = useContext(SettingsContext);

	useEffect(() => {
		(async () => {
			const {
				fragmentSource,
				vertexSource
			} = await getShaders(settings.config.activation);

			setFragmentSource(fragmentSource);
			setVertexSource(vertexSource);
		})();
	}, []);

	return <shaderMaterial fragmentShader={fragmentSource} vertexShader={vertexSource} />
}

export default Renderer;