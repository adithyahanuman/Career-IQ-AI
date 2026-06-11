'use strict';

/**
 * ai/rolesList.js
 *
 * Predefined placement role lists by course level.
 * Used by the benchmarking service to auto-select roles
 * based on the student's detected course (B.Tech, M.Tech, PhD).
 */

const ROLES = {
  btech: [
    // Software & IT
    'Software Engineer',
    'Software Development Engineer (SDE)',
    'Full Stack Developer',
    'Backend Developer',
    'Frontend Developer',
    'Systems Engineer',
    'Product Engineer',
    'DevOps Engineer',
    'Cloud Engineer',
    // Data & AI
    'Data Analyst',
    'Data Scientist',
    'Data Engineer',
    'Machine Learning Engineer',
    'AI Engineer',
    'Business Intelligence Analyst',
    // Cyber Security
    'Cyber Security Analyst',
    'Security Engineer',
    'SOC Analyst',
    // Electronics & Semiconductor
    'Embedded Engineer',
    'Firmware Engineer',
    'VLSI Design Engineer',
    'ASIC Verification Engineer',
    'FPGA Engineer',
    'Hardware Engineer',
    // Electrical
    'Electrical Design Engineer',
    'Power Systems Engineer',
    'Automation Engineer',
    'Control Systems Engineer',
    // Mechanical / Manufacturing
    'Design Engineer',
    'Manufacturing Engineer',
    'Production Engineer',
    'Quality Engineer',
    'Automotive Engineer',
    // Civil
    'Structural Engineer',
    'Site Engineer',
    'Construction Engineer',
    'BIM Engineer',
    // Chemical / Process
    'Process Engineer',
    'Plant Engineer',
    'Operations Engineer',
    'Safety Engineer',
    // Business & Consulting
    'Business Analyst',
    'Technology Analyst',
    'Associate Consultant',
    'Technical Consultant',
    'Operations Analyst',
    'Product Analyst',
    // Finance
    'Financial Analyst',
    'Risk Analyst',
    // Graduate Programs
    'Graduate Engineer Trainee (GET)',
    'Management Trainee',
  ],

  mtech: [
    // Software & AI
    'Senior Software Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    'AI Engineer',
    'Cloud Engineer',
    // Semiconductor
    'VLSI Engineer',
    'ASIC Engineer',
    'Physical Design Engineer',
    'Embedded Engineer',
    // Core Engineering
    'Design Engineer',
    'Systems Engineer',
    'Automation Engineer',
    'Process Engineer',
    // Research
    'Research Engineer',
    'R&D Engineer',
    'Applied Scientist',
    // Consulting
    'Technology Consultant',
    'Solutions Consultant',
  ],

  phd: [
    // Research
    'Research Scientist',
    'Applied Scientist',
    'Research Engineer',
    'R&D Engineer',
    // Academia
    'Assistant Professor',
    'Postdoctoral Researcher',
    // Industry
    'AI Research Scientist',
    'Computational Scientist',
    'Principal Engineer',
    'Technology Specialist',
  ],
};

/**
 * Detect the course tier from free-text degree/course strings.
 *
 * @param {string} degreeText  - e.g. "B.Tech Computer Science", "M.Tech AI", "PhD"
 * @returns {'btech'|'mtech'|'phd'}
 */
function detectCourseTier(degreeText) {
  if (!degreeText) return 'btech';
  const t = degreeText.toLowerCase();

  if (t.includes('ph') || t.includes('phd') || t.includes('doctorate') || t.includes('doctor')) {
    return 'phd';
  }
  if (
    t.includes('m.tech') || t.includes('mtech') || t.includes('m tech') ||
    t.includes('m.e') || t.includes('m.s') || t.includes('msc') || t.includes('m.sc') ||
    t.includes('master') || t.includes('pg') || t.includes('post grad')
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
