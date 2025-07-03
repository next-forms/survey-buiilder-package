import React from 'react';
import { Switch } from './switch';
import { Label } from './label';
import { Sun, Moon } from 'lucide-react';

interface ThemeSwitcherProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4 text-amber-500" />
      <Switch
        id="theme-mode"
        checked={value}
        onCheckedChange={onChange}
      />
      <Moon className="h-4 w-4 text-indigo-400" />
      <Label htmlFor="theme-mode" className="text-sm">
        {value ? 'Dark' : 'Light'} Mode
      </Label>
    </div>
  );
};
