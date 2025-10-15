import React from 'react';
import Select from 'react-select';
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
  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none',
      minHeight: 'auto',
      fontSize: '18px',
      fontWeight: '500',
      color: 'var(--text)',
      '&:hover': {
        border: 'none',
      },
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      padding: '0',
    }),
    input: (provided: any) => ({
      ...provided,
      margin: '0',
      padding: '0',
      color: 'var(--text)',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'var(--text-secondary)',
      margin: '0',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'var(--text)',
      margin: '0',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: 'var(--text-secondary)',
      padding: '0',
      '&:hover': {
        color: 'var(--text-secondary)',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: '#2a2a2a',
      border: '1px solid var(--card-border)',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      marginTop: '4px',
    }),
    menuList: (provided: any) => ({
      ...provided,
      padding: '8px',
      maxHeight: '200px',
      overflowY: 'auto',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? 'transparent' 
        : state.isFocused 
        ? '#3a3a3a' 
        : 'transparent',
      color: state.isSelected ? 'var(--text)' : 'var(--text)',
      padding: '12px 20px',
      fontSize: '16px',
      fontWeight: state.isSelected ? '500' : '400',
      borderRadius: '8px',
      margin: '2px auto',
      maxWidth: '100%',
      '&:hover': {
        backgroundColor: '#3a3a3a',
        color: '#fff',
        borderRadius: '0',
      },
    }),
  };

  return (
    <div className={`${styles.reactSelectWrapper} ${className}`}>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        isDisabled={isDisabled}
        styles={selectStyles}
        isSearchable={false}
        maxMenuHeight={200}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  );
}
