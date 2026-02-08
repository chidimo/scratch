import { useCallback, useState } from 'react';

export const useOnOffSwitch = (initialValue: boolean = false) => {
  const [isOn, setIsOn] = useState(initialValue);

  const turnOn = useCallback(() => setIsOn(true), []);
  const turnOff = useCallback(() => setIsOn(false), []);
  const toggle = useCallback(() => setIsOn((prev) => !prev), []);

  return { isOn, turnOn, turnOff, toggle };
};
