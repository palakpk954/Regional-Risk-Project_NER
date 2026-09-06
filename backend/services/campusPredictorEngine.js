// Adapted from donor repository logic patterns:
// - backend/src/ml/predict.py
// - backend/src/ml/utils.py
// The implementation is converted to Node/JS for this codebase.

const FEATURE_LABELS = {
  tier: 'College Tier',
  cgpa: 'CGPA',
  inter_gpa: 'XII Standard CGPA',
  ssc_gpa: 'X Standard CGPA',
  internships: 'Number of Internships Done',
  no_of_projects: 'No of Projects Done',
  is_participate_hackathon: 'Participated in Hackathon',
  is_participated_extracurricular: 'Participated in Extracurricular Activities',
  no_of_programming_languages: 'No of Programming Languages Known',
  dsa: 'Data Structures and Algorithms',
  mobile_dev: 'Android Development',
  web_dev: 'Web Development',
  machine_learning: 'Machine Learning',
  cloud: 'Cloud Computing',
};

const TECH_SKILL_FEATURES = ['web_dev', 'machine_learning', 'mobile_dev', 'cloud'];

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function safeRate(part, total) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(1));
}

function getByAliases(row, aliases, fallback = '') {
  const keys = Object.keys(row || {});
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (!aliases.some((alias) => normalized === alias || normalized.includes(alias))) continue;

    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }

  return fallback;
}

function normalizeStatus(value) {
  const key = normalizeKey(value);
  if (key.includes('select') || key.includes('place') || key.includes('offer') || key.includes('hire')) return 'Selected';
  if (key.includes('interview') || key.includes('shortlist')) return 'Interview';
  if (key.includes('reject')) return 'Rejected';
  return 'Applied';
}

function hasAnySignal(row) {
  return Object.values(row || {}).some((value) => normalizeText(value));
}

function normalizeRows(rows) {
  return (rows || [])
    .filter((row) => row && hasAnySignal(row))
    .map((row, index) => {
      const status = normalizeStatus(getByAliases(row, ['status', 'stage', 'result', 'outcome'], 'Applied'));
      const explicitPlaced = toNumber(getByAliases(row, ['isplaced', 'is_placed'], NaN), NaN);

      const normalized = {
        s_id: toNumber(getByAliases(row, ['sid', 's_id', 'id'], index + 1), index + 1),
        name: normalizeText(getByAliases(row, ['name', 'studentname', 'student', 'candidate'], `Student ${index + 1}`)) || `Student ${index + 1}`,
        tier: toNumber(getByAliases(row, ['tier'], 2), 2),
        gender: normalizeText(getByAliases(row, ['gender'], 'Unknown')) || 'Unknown',
        branch: normalizeText(getByAliases(row, ['branch', 'department', 'stream'], 'Unknown')) || 'Unknown',
        cgpa: toNumber(getByAliases(row, ['cgpa', 'gpa', 'grade'], 0), 0),
        inter_gpa: toNumber(getByAliases(row, ['intergpa', 'inter_gpa', 'xii'], 0), 0),
        ssc_gpa: toNumber(getByAliases(row, ['sscgpa', 'ssc_gpa', 'x'], 0), 0),
        internships: toNumber(getByAliases(row, ['internships', 'internshipmonths'], 0), 0),
        no_of_projects: toNumber(getByAliases(row, ['noofprojects', 'projects'], 0), 0),
        is_participate_hackathon: toNumber(getByAliases(row, ['isparticipatehackathon', 'hackathon'], 0), 0),
        is_participated_extracurricular: toNumber(getByAliases(row, ['isparticipatedextracurricular', 'extracurricular'], 0), 0),
        no_of_programming_languages: toNumber(getByAliases(row, ['noofprogramminglanguages', 'languages'], 0), 0),
        dsa: toNumber(getByAliases(row, ['dsa'], 0), 0),
        mobile_dev: toNumber(getByAliases(row, ['mobiledev'], 0), 0),
        web_dev: toNumber(getByAliases(row, ['webdev', 'web'], 0), 0),
        machine_learning: toNumber(getByAliases(row, ['machinelearning', 'ml'], 0), 0),
        cloud: toNumber(getByAliases(row, ['cloud'], 0), 0),
        other_skills: normalizeText(getByAliases(row, ['otherskills', 'skills'], '')),
        company: normalizeText(getByAliases(row, ['company', 'employer', 'organization'], 'Unassigned')) || 'Unassigned',
        status,
        salary_as_fresher: toNumber(getByAliases(row, ['salaryasfresher', 'package', 'ctc', 'salary'], 0), 0),
      };

      normalized.is_placed = Number.isFinite(explicitPlaced) ? (explicitPlaced > 0 ? 1 : 0) : (status === 'Selected' ? 1 : 0);
      normalized.placement_probability = clamp(
        Number((normalized.cgpa * 8 + normalized.internships * 5 + normalized.no_of_projects * 3 + normalized.dsa * 8 + normalized.web_dev * 6 + normalized.machine_learning * 5 + normalized.cloud * 4).toFixed(1)),
        1,
        99,
      );

      return normalized;
    });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function validateRows(rows) {
  if (!Array.isArray(rows) || !rows.length) {
    return { ok: false, message: 'rows array is required for campus prediction.' };
  }

  const hasName = rows.some((row) => normalizeText(row.name));
  const hasBranch = rows.some((row) => normalizeText(row.branch));
  const hasCgpa = rows.some((row) => Number.isFinite(toNumber(row.cgpa, NaN)));

  if (!hasName || !hasBranch || !hasCgpa) {
    return {
      ok: false,
      message: 'Input rows must include student name, branch, and cgpa values.',
    };
  }

  return { ok: true };
}

function pearsonCorrelation(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;

  const xMean = xs.reduce((sum, value) => sum + value, 0) / n;
  const yMean = ys.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    numerator += dx * dy;
    xVariance += dx * dx;
    yVariance += dy * dy;
  }

  const denominator = Math.sqrt(xVariance * yVariance);
  if (!denominator) return 0;

  return Number((numerator / denominator).toFixed(4));
}

function buildCorrelations(rows) {
  const target = rows.map((row) => row.is_placed);
  const featureKeys = Object.keys(FEATURE_LABELS);
  const correlations = featureKeys.map((feature) => {
    const values = rows.map((row) => toNumber(row[feature], 0));
    const correlation = pearsonCorrelation(values, target);

    return {
      feature,
      label: FEATURE_LABELS[feature],
      correlation,
      absCorrelation: Math.abs(correlation),
    };
  });

  const top_factors_affecting_placements = [...correlations]
    .sort((a, b) => b.absCorrelation - a.absCorrelation)
    .slice(0, 5)
    .map((item) => item.label);

  const imp_technical_skills = correlations
    .filter((item) => TECH_SKILL_FEATURES.includes(item.feature) && item.correlation > 0.25)
    .sort((a, b) => b.correlation - a.correlation)
    .map((item) => item.label);

  return {
    top_factors_affecting_placements,
    imp_technical_skills,
    correlations,
  };
}

function groupBranchStats(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const key = row.branch || 'Unknown';
    if (!map.has(key)) {
      map.set(key, {
        branch: key,
        total: 0,
        placed: 0,
        salaryValues: [],
        maxSalary: 0,
        minSalary: 0,
      });
    }

    const target = map.get(key);
    target.total += 1;
    if (row.is_placed > 0) target.placed += 1;

    if (row.salary_as_fresher > 0) {
      target.salaryValues.push(row.salary_as_fresher);
      target.maxSalary = Math.max(target.maxSalary, row.salary_as_fresher);
      target.minSalary = target.minSalary === 0 ? row.salary_as_fresher : Math.min(target.minSalary, row.salary_as_fresher);
    }
  });

  const branchList = Array.from(map.values()).map((row) => {
    const avgSalary = row.salaryValues.length
      ? row.salaryValues.reduce((sum, value) => sum + value, 0) / row.salaryValues.length
      : 0;

    return {
      branch: row.branch,
      total: row.total,
      placed: row.placed,
      placement_rate: safeRate(row.placed, row.total),
      highest_sal: Number(row.maxSalary.toFixed(2)),
      average_sal: Number(avgSalary.toFixed(2)),
      least_sal: Number(row.minSalary.toFixed(2)),
      avg_package: Number(avgSalary.toFixed(2)),
    };
  });

  branchList.sort((a, b) => b.placement_rate - a.placement_rate || b.placed - a.placed);

  const Highest_avg_least_sal_in_each_branch = {};
  const highest_sal_in_each_branch = [];

  branchList.forEach((row) => {
    Highest_avg_least_sal_in_each_branch[row.branch] = {
      average_sal: row.average_sal,
      highest_sal: row.highest_sal,
      least_sal: row.least_sal,
    };

    highest_sal_in_each_branch.push({
      branch: row.branch,
      total: row.total,
      placed: row.placed,
      placement_rate: row.placement_rate,
      avg_package: row.avg_package,
      highest_sal: row.highest_sal,
      least_sal: row.least_sal,
    });
  });

  return {
    highest_sal_in_each_branch,
    Highest_avg_least_sal_in_each_branch,
  };
}

function buildSalaryStats(rows) {
  const salaryRows = rows.filter((row) => row.salary_as_fresher > 0);
  const salaries = salaryRows.map((row) => row.salary_as_fresher);

  const Overall_highest_average_least = {
    highest: salaries.length ? Number(Math.max(...salaries).toFixed(2)) : 0,
    Average: salaries.length ? Number((salaries.reduce((sum, value) => sum + value, 0) / salaries.length).toFixed(2)) : 0,
    least: salaries.length ? Number(Math.min(...salaries).toFixed(2)) : 0,
  };

  const salary_distribution = salaryRows.reduce((acc, row) => {
    const value = Number(row.salary_as_fresher.toFixed(2));
    const key = String(value);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    Overall_highest_average_least,
    salary_distribution,
  };
}

function buildThresholdStats(rows, threshold) {
  const filtered = rows.filter((row) => row.salary_as_fresher > threshold);
  const byBranch = new Map();

  filtered.forEach((row) => {
    const key = row.branch || 'Unknown';
    byBranch.set(key, (byBranch.get(key) || 0) + 1);
  });

  const bar = {};
  byBranch.forEach((count, branch) => {
    bar[branch] = count;
  });

  const labels = Array.from(byBranch.keys());
  const values = labels.map((branch) => safeRate(byBranch.get(branch), filtered.length || 1));

  return {
    bar,
    pie: {
      labels,
      values,
    },
  };
}

function buildTopCompanies(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const company = row.company || 'Unassigned';
    if (company === 'Unassigned') return;

    if (!map.has(company)) {
      map.set(company, { company, applicants: 0, selected: 0 });
    }

    const target = map.get(company);
    target.applicants += 1;
    if (row.is_placed > 0) target.selected += 1;
  });

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      conversion_rate: safeRate(row.selected, row.applicants),
    }))
    .sort((a, b) => b.selected - a.selected)
    .slice(0, 10);
}

function buildExpectations(rows, fieldKey, label) {
  const map = new Map();

  rows.forEach((row) => {
    const field = toNumber(row[fieldKey], 0);
    if (!map.has(field)) {
      map.set(field, { field, sum: 0, count: 0 });
    }

    const target = map.get(field);
    target.sum += row.salary_as_fresher;
    target.count += 1;
  });

  const sorted = Array.from(map.values()).sort((a, b) => a.field - b.field);

  return {
    [label]: sorted.map((row) => row.field),
    Salary: sorted.map((row) => Number((row.sum / (row.count || 1)).toFixed(2))),
  };
}

function buildWarnings(rows) {
  const warnings = [];

  if (!rows.some((row) => row.salary_as_fresher > 0)) {
    warnings.push('No salary values found. Salary-based charts may appear flat.');
  }

  if (!rows.some((row) => row.internships > 0)) {
    warnings.push('Internship field appears empty for all rows.');
  }

  if (!rows.some((row) => row.no_of_projects > 0)) {
    warnings.push('Project count appears empty for all rows.');
  }

  return warnings;
}

function predictCampusStats(rows) {
  const validation = validateRows(rows);
  if (!validation.ok) {
    return {
      ok: false,
      error: validation.message,
    };
  }

  const normalizedRows = normalizeRows(rows);
  if (!normalizedRows.length) {
    return {
      ok: false,
      error: 'No valid campus records available after normalization.',
    };
  }

  const total_no_of_students = normalizedRows.length;
  const total_placed = normalizedRows.filter((row) => row.is_placed > 0).length;
  const total_not_placed = total_no_of_students - total_placed;
  const placement_rate = safeRate(total_placed, total_no_of_students);

  const { top_factors_affecting_placements, imp_technical_skills, correlations } = buildCorrelations(normalizedRows);
  const { highest_sal_in_each_branch, Highest_avg_least_sal_in_each_branch } = groupBranchStats(normalizedRows);
  const { Overall_highest_average_least, salary_distribution } = buildSalaryStats(normalizedRows);

  const above20 = buildThresholdStats(normalizedRows, 20);
  const above10 = buildThresholdStats(normalizedRows, 10);
  const top_companies = buildTopCompanies(normalizedRows);

  const expected_sal_by_no_of_projects = buildExpectations(normalizedRows, 'no_of_projects', 'No_of_projects');
  const expected_sal_by_no_of_internships = buildExpectations(normalizedRows, 'internships', 'No_of_internships');
  const expected_sal_by_no_of_programming_lan = buildExpectations(normalizedRows, 'no_of_programming_languages', 'No_of_programming_languages');

  const warnings = buildWarnings(normalizedRows);

  return {
    ok: true,
    data: {
      total_no_of_students,
      total_placed,
      total_not_placed,
      placement_rate,
      top_factors_affecting_placements,
      imp_technical_skills,
      highest_sal_in_each_branch,
      Highest_avg_least_sal_in_each_branch,
      Overall_highest_average_least,
      salary_distribution,
      above_20_bar: above20.bar,
      above_20_pie: above20.pie,
      above_10_bar: above10.bar,
      above_10_pie: above10.pie,
      top_companies,
      expected_sal_by_no_of_projects,
      expected_sal_by_no_of_internships,
      expected_sal_by_no_of_programming_lan,
      Average_sal: Overall_highest_average_least.Average,
      warnings,
      correlations,
      source: 'donor-predict.py-adapted-js-v1',
    },
  };
}

module.exports = {
  normalizeRows,
  predictCampusStats,
};
