import { TFunction } from 'next-i18next';
import academicData from '@/data/fudan-academic-data.json';
import termData from '@/data/term-options.json';

// 选项接口定义
export interface Option {
  value: string;
  label: string;
}

export interface DepartmentOption extends Option {}

export interface MajorOption extends Option {
  code: string;
}

export interface MajorsByDepartment {
  [department: string]: MajorOption[];
}

/**
 * 获取院系选项列表
 * @param locale 当前语言环境 ('zh' | 'en')
 * @param t 翻译函数
 * @returns 院系选项数组
 */
export const getDepartments = (locale: string, t: TFunction): DepartmentOption[] => {
  const noneOption = { value: '', label: t('profile.fields.none') };
  const isZh = locale === 'zh' || locale === 'zh-CN';
  
  const departments = academicData.departments.map(dept => ({
    value: dept.id,
    label: isZh ? dept.name_zh : dept.name_en
  }));
  
  return [noneOption, ...departments];
};

/**
 * 获取专业选项列表（按院系分组）
 * @param locale 当前语言环境 ('zh' | 'en')
 * @returns 专业选项映射对象
 */
export const getMajors = (locale: string): MajorsByDepartment => {
  const isZh = locale === 'zh' || locale === 'zh-CN';
  const majorsByDept: MajorsByDepartment = {};
  
  academicData.departments.forEach(dept => {
    const majors: MajorOption[] = [];
    
    // 收集院系直接下的专业
    if (dept.majors) {
      dept.majors.forEach(major => {
        majors.push({
          value: `${dept.id}_${major.code}_${major.name_zh}`,
          label: isZh ? major.name_zh : major.name_en,
          code: major.code
        });
      });
    }
    
    // 收集子系下的专业
    if (dept.sub_departments) {
      dept.sub_departments.forEach(subDept => {
        if (subDept.majors) {
          subDept.majors.forEach(major => {
            majors.push({
              value: `${dept.id}_${subDept.id}_${major.code}_${major.name_zh}`,
              label: isZh ? major.name_zh : major.name_en,
              code: major.code
            });
          });
        }
      });
    }
    
    if (majors.length > 0) {
      majorsByDept[dept.id] = majors;
    }
  });
  
  return majorsByDept;
};

/**
 * 根据选择的院系获取可选的专业列表
 * @param locale 当前语言环境 ('zh' | 'en')
 * @param t 翻译函数
 * @param department 选择的院系ID
 * @returns 专业选项数组
 */
export const getAvailableMajors = (locale: string, t: TFunction, department: string): Option[] => {
  const noneOption = { value: '', label: t('profile.fields.none') };
  if (!department) return [noneOption];
  
  const majors = getMajors(locale);
  const departmentMajors = majors[department] || [];
  return [noneOption, ...departmentMajors];
};

/**
 * 获取学期选项列表
 * @returns 学期选项数组
 */
export const getTermOptions = (): Option[] => {
  const options: Option[] = [];
  const { startYear, endYear, startSeason, endSeason, seasons } = termData;
  
  // 起始年份：只添加起始学期
  if (startSeason === '秋') {
    options.push({ value: `${startYear}秋`, label: `${startYear}年秋` });
  } else {
    options.push({ value: `${startYear}春`, label: `${startYear}年春` });
    options.push({ value: `${startYear}秋`, label: `${startYear}年秋` });
  }
  
  // 中间年份：每年都有所有学期
  for (let year = startYear + 1; year < endYear; year++) {
    seasons.forEach(season => {
      options.push({ value: `${year}${season}`, label: `${year}年${season}` });
    });
  }
  
  // 结束年份：根据结束学期决定
  if (endYear > startYear) {
    if (endSeason === '秋') {
      options.push({ value: `${endYear}春`, label: `${endYear}年春` });
      options.push({ value: `${endYear}秋`, label: `${endYear}年秋` });
    } else {
      options.push({ value: `${endYear}春`, label: `${endYear}年春` });
    }
  }
  
  return options;
};
