// 资源相关工具函数
import { Resource } from '@/services/resourceService';

// 标签前缀常量 - 用于解析数据库中已存储的标签格式
// 注意：这些前缀是为了兼容数据库中已存储的标签格式，不是用于显示
const TAG_PREFIXES = {
  TERM_ZH: '开课学期:',
  TERM_EN: 'Term:',
  COURSE_CODE_ZH: '课程代码:',
  COURSE_CODE_EN: 'Course Code:',
  INSTRUCTOR_ZH: '开课老师:',
  INSTRUCTOR_EN: 'Instructor:',
} as const;

// 解析资源标签
export interface ParsedTags {
  term: string[];
  courseName: string[];
  courseCode: string[];
  instructors: string[];
  others: string[];
}

export const parseResourceTags = (resource: Resource): ParsedTags => {
  const term: string[] = [];
  const courseName: string[] = [];
  const courseCode: string[] = [];
  const instructors: string[] = [];
  const others: string[] = [];
  
  if (resource.courseLinks && resource.courseLinks.length > 0) {
    resource.courseLinks.forEach(link => {
      if (link.offering) {
        if (link.offering.term) {
          term.push(link.offering.term);
        }
        if (link.offering.instructor) {
          const instructorArray = Array.isArray(link.offering.instructor)
            ? link.offering.instructor
            : [link.offering.instructor];
          instructors.push(...instructorArray);
        }
        if (link.offering.course) {
          if (link.offering.course.name) {
            // 课程名称单独存储
            if (!courseName.includes(link.offering.course.name)) {
              courseName.push(link.offering.course.name);
            }
          }
        }
      }
    });
  }
  
  if (resource.tags && Array.isArray(resource.tags)) {
    resource.tags.forEach(tag => {
      if (typeof tag === 'string') {
        if (tag.startsWith(TAG_PREFIXES.TERM_ZH) || tag.startsWith(TAG_PREFIXES.TERM_EN)) {
          const termValue = tag.split(':')[1]?.trim();
          if (termValue && !term.includes(termValue)) {
            term.push(termValue);
          }
        } else if (tag.startsWith(TAG_PREFIXES.COURSE_CODE_ZH) || tag.startsWith(TAG_PREFIXES.COURSE_CODE_EN)) {
          const codeValue = tag.split(':')[1]?.trim();
          if (codeValue && !courseCode.includes(codeValue)) {
            courseCode.push(codeValue);
          }
        } else if (tag.startsWith(TAG_PREFIXES.INSTRUCTOR_ZH) || tag.startsWith(TAG_PREFIXES.INSTRUCTOR_EN)) {
          const instructorValue = tag.split(':')[1]?.trim();
          if (instructorValue && !instructors.includes(instructorValue)) {
            instructors.push(instructorValue);
          }
        } else {
          others.push(tag);
        }
      }
    });
  }
  
  return { term, courseName, courseCode, instructors, others };
};

// 导出标签前缀常量，供其他模块使用（如生成标签时）
export { TAG_PREFIXES };

// 格式化数量显示
export const formatCount = (count: number | undefined): string => {
  if (count === undefined || count === null) return '0';
  if (count < 1000) return count.toString();
  if (count < 1000000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
};

