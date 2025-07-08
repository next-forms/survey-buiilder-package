import React from 'react';
import { BlockData } from '../../types';
import { ThemeDefinition, themes } from '../../themes';

interface HtmlRendererProps {
  block: BlockData;
  theme?: ThemeDefinition;
}

export const HtmlRenderer: React.FC<HtmlRendererProps> = ({
  block,
  theme = null
}) => {
  const themeConfig = theme ?? themes.default;

  return (
    <div
      className="survey-html w-full min-w-0"
      dangerouslySetInnerHTML={{ __html: block.html || '' }}
    />
  );
};
