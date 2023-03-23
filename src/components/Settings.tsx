import { FC, useContext, useState } from 'react';
import presets from '../presets';
import SettingsContext from './SettingsContext';

const   Settings: FC = () => {
  const settings = useContext(SettingsContext);
  const [selected, setSelected] = useState("slimemold");

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelected(event.target.value);
    if (settings.setConfig) settings.setConfig(presets[event.target.value]);
  };

  return <>
    <div className="prose prose-slate bg-base-100 w-64 p-4">
      <h2>Settings</h2>         
      <div className="form-control">
        <label className="label">
          <span className="label-text">Select Preset</span>
        </label>
        <select className="select select-bordered" onChange={handleSelectChange}
          value={selected}>
          {Object.keys(presets).map((key, index) => {
            return <option key={index} value={key}>{key}</option>
          })}
        </select>
      </div>
    </div>
  </>;
};

export default Settings;