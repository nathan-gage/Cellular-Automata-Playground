import { createContext } from 'react';
import presets, { Config } from '../presets';

const SettingsContext = createContext<{ config: Config, setConfig?: (config: Config) => void }>(
	{ config: presets.slimemold, setConfig: undefined }
);

export default SettingsContext;