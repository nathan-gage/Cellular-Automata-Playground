import React, { useContext, useState } from 'react';
import Head from 'next/head';
// import ControlBar from '../src/ControlBar';
import RenderCanvas from '../components/Renderer';
import Settings from '../components/Settings'
import SettingsContext from '../components/SettingsContext';
import { AdjustmentsHorizontalIcon } from '@heroicons/react/20/solid';

const Home = () => {
  const settings = useContext(SettingsContext);
  const backgroundStyle = settings.config.bg_color ? {
    backgroundColor: settings.config.bg_color,
  } : {};

  return (
    <div className={`h-screen flex flex-col`} style={backgroundStyle}>
      <Head>
        <title>Cellular Automata Simulator</title>
        <meta name="description" content="Cellular Automata Simulator" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="drawer drawer-mobile drawer-end">
        <input id="settings-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col items-center justify-center overflow-hidden">
          <label htmlFor="settings-drawer" className="btn btn-circle absolute top-4 right-4 transition opacity-50 hover:opacity-100 hover:drop-shadow-lg lg:hidden">
            <AdjustmentsHorizontalIcon className='w-6 h-6' />
          </label>
          <RenderCanvas />
        </div>
        <div className="drawer-side">
          <label htmlFor="settings-drawer" className="drawer-overlay"></label>
          <Settings />
        </div>
      </div>
    </div>
  );
};

export default Home;