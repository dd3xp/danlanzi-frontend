import React from 'react';
import { Tooltip as AntTooltip } from 'antd';
import '../styles/Tooltip.module.css';

interface TooltipProps {
  title: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  delay?: number;
  className?: string;
}

export default function Tooltip({ 
  title, 
  children, 
  placement = 'top',
  delay = 0.5,
  className = ''
}: TooltipProps) {
  return (
    <AntTooltip
      title={title}
      placement={placement}
      mouseEnterDelay={delay}
      mouseLeaveDelay={0.1}
      classNames={{ root: `custom-tooltip ${className}` }}
    >
      {children}
    </AntTooltip>
  );
}
