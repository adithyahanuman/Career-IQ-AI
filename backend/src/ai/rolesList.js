'use strict';

/**
 * ai/rolesList.js
 *
 * Predefined placement role lists by course level.
 * Tiers: btech | mtech | msc | mba | phd
 */

const ROLES = {

  btech: [
    'Software Engineer',
    'Full Stack Developer',
    'Data Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Cyber Security Engineer',
    'Embedded Systems Engineer',
    'VLSI Engineer',
    'Hardware Engineer',
    'Electrical Engineer',
    'Mechanical Engineer',
    'Civil Engineer',
    'Process Engineer',
    'Biomedical Engineer',
    'Business Analyst',
    'Consultant',
    'Financial Analyst',
    'Product Manager',
    'Graduate Engineer Trainee (GET)',
  ],

  mtech: [
    // All B.Tech roles
    'Software Engineer',
    'Full Stack Developer',
    'Data Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Cyber Security Engineer',
    'Embedded Systems Engineer',
    'VLSI Engineer',
    'Hardware Engineer',
    'Electrical Engineer',
    'Mechanical Engineer',
    'Civil Engineer',
    'Process Engineer',
    'Biomedical Engineer',
    'Business Analyst',
    'Consultant',
    'Financial Analyst',
    'Product Manager',
    'Graduate Engineer Trainee (GET)',
    // M.Tech additions
    'Cloud Architect',
    'Research Scientist',
    'Senior VLSI Engineer',
    'Senior Embedded Systems Engineer',
    'Advanced AI/ML Engineer',
  ],

  msc: [
    'Data Scientist',
    'Data Engineer',
    'Bioinformatics Scientist',
    'Research Scientist',
    'Financial Analyst',
    'Business Analyst',
  ],

  mba: [
    'Business Analyst',
    'Consultant',
    'Product Manager',
    'Financial Analyst',
    'Marketing Analyst',
    'HR Specialist',
    'Supply Chain Analyst',
    'Management Trainee',
  ],

  phd: [
    'Research Scientist',
    'Professor / Academic Researcher',
    'AI Research Scientist',
    'Semiconductor Research Scientist',
    'Technology Specialist',
  ],
};

/**
 * Detect the course tier from free-text degree/course strings.
 *
 * @param {string} degreeText  - e.g. "B.Tech Computer Science", "M.Tech AI", "MBA", "PhD"
 * @returns {'btech'|'mtech'|'msc'|'mba'|'phd'}
 */
function detectCourseTier(degreeText) {
  if (!degreeText) return 'btech';
  const t = degreeText.toLowerCase();

  if (t.includes('ph.d') || t.includes('phd') || t.includes('doctorate') || t.includes('doctor of')) {
    return 'phd';
  }
  if (t.includes('mba') || t.includes('m.b.a') || t.includes('master of business')) {
    return 'mba';
  }
  if (
    t.includes('m.sc') || t.includes('msc') || t.includes('m.s.') ||
    (t.includes('master') && (t.includes('science') || t.includes('sc')))
  ) {
    return 'msc';
  }
  if (
    t.includes('m.tech') || t.includes('mtech') || t.includes('m tech') ||
    t.includes('m.e') || t.includes('master of technology') || t.includes('master of engineering') ||
    t.includes('pg') || t.includes('post grad') || t.includes('master')
  ) {
    return 'mtech';
  }
  // Default: B.Tech / B.E / BE / any undergrad
  return 'btech';
}

/**
 * Return the role list for a given course text.
 *
 * @param {string} courseText
 * @returns {string[]}
 */
function getRolesForCourse(courseText) {
  return ROLES[detectCourseTier(courseText)] || ROLES.btech;
}

module.exports = { ROLES, detectCourseTier, getRolesForCourse };
