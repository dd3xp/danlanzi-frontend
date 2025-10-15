import { TFunction } from 'next-i18next';

// 选项接口定义
export interface Option {
  value: string;
  label: string;
}

export interface DepartmentOption extends Option {}

export interface MajorOption extends Option {}

export interface MajorsByDepartment {
  [department: string]: MajorOption[];
}

/**
 * 获取院系选项列表
 * @param t 翻译函数
 * @returns 院系选项数组
 */
export const getDepartments = (t: TFunction): DepartmentOption[] => {
  const noneOption = { value: '', label: t('profile.fields.none') };
  return [
    noneOption,
    { value: 'computerScience', label: t('academic:departments.computerScience') },
    { value: 'mathematics', label: t('academic:departments.mathematics') }
  ];
};

/**
 * 获取专业选项列表（按院系分组）
 * @param t 翻译函数
 * @returns 专业选项映射对象
 */
export const getMajors = (t: TFunction): MajorsByDepartment => ({
  computerScience: [
    { value: 'cs', label: t('academic:majors.computerScience.cs') },
    { value: 'ai', label: t('academic:majors.computerScience.ai') },
    { value: 'informationSecurity', label: t('academic:majors.computerScience.informationSecurity') },
    { value: 'confidentiality', label: t('academic:majors.computerScience.confidentiality') },
    { value: 'csElite', label: t('academic:majors.computerScience.csElite') }
  ],
  mathematics: [
    { value: 'pureMath', label: t('academic:majors.mathematics.pureMath') },
    { value: 'appliedMath', label: t('academic:majors.mathematics.appliedMath') },
    { value: 'financialMath', label: t('academic:majors.mathematics.financialMath') },
    { value: 'bigData', label: t('academic:majors.mathematics.bigData') },
    { value: 'cryptography', label: t('academic:majors.mathematics.cryptography') }
  ]
});

/**
 * 根据选择的院系获取可选的专业列表
 * @param t 翻译函数
 * @param department 选择的院系
 * @returns 专业选项数组
 */
export const getAvailableMajors = (t: TFunction, department: string): Option[] => {
  const noneOption = { value: '', label: t('profile.fields.none') };
  if (!department) return [noneOption];
  
  const majors = getMajors(t);
  const departmentMajors = majors[department] || [];
  return [noneOption, ...departmentMajors];
};
