import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import soundManager from '../../utils/sound';

const SoundToggle = () => {
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  const toggleSound = () => {
    const newState = soundManager.toggle();
    setSoundEnabled(newState);
  };

  return (
    <button
      onClick={toggleSound}
      className={`p-2 rounded-lg transition-colors ${
        soundEnabled 
          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
          : 'bg-red-100 text-red-600 hover:bg-red-200'
      }`}
      title={soundEnabled ? 'Sound notifications enabled' : 'Sound notifications disabled'}
    >
      {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </button>
  );
};

export default SoundToggle;