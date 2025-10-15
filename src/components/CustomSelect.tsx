import React from 'react';
import { Select } from 'antd';
import styles from '@/styles/CustomSelect.module.css';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: Option | null;
  onChange: (selectedOption: Option | null) => void;
  options: Option[];
  placeholder: string;
  isDisabled?: boolean;
  className?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  isDisabled = false,
  className = '',
}: CustomSelectProps) {
  return (
    <div className={`${styles.reactSelectWrapper} ${className}`}>
      <Select
        value={value?.value}
        onChange={(val) => {
          const next = options.find((opt) => opt.value === val) || null;
          onChange(next);
        }}
        options={options.map((opt) => ({ label: opt.label, value: opt.value }))}
        placeholder={placeholder}
        disabled={isDisabled}
        style={{ width: '100%' }}
        showSearch={false}
        popupMatchSelectWidth
        listHeight={200}
      />
    </div>
  );
}
