import '../styles/globals.css';
import type { AppProps } from 'next/app'
import SettingsContext from '../components/SettingsContext';
import presets from '../presets';
import { useState } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  const [config, setConfig] = useState(presets["worms"]);
  const context = { config, setConfig };

  return <SettingsContext.Provider value={context}>
    <Component {...pageProps} />
  </SettingsContext.Provider>
}

export default MyApp
