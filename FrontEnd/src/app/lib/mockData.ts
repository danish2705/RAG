// Mock data for the QMS application

export const kpiData = {
  totalDeviations: 142,
  openCases: 23,
  recurrenceRate: 12.5,
  capaEffectiveness: 87.3,
};

export const trendData = [
  { month: 'Jan', deviations: 12, changes: 8 },
  { month: 'Feb', deviations: 15, changes: 11 },
  { month: 'Mar', deviations: 10, changes: 9 },
  { month: 'Apr', deviations: 18, changes: 14 },
  { month: 'May', deviations: 14, changes: 10 },
  { month: 'Jun', deviations: 11, changes: 7 },
];

export const criticalIssues = [
  {
    id: 'DEV-2024-089',
    title: 'Temperature excursion in cold storage',
    severity: 'Critical',
    site: 'Manufacturing Plant A',
    daysOpen: 3,
  },
  {
    id: 'DEV-2024-091',
    title: 'Data integrity issue in batch record',
    severity: 'Critical',
    site: 'Manufacturing Plant B',
    daysOpen: 1,
  },
  {
    id: 'DEV-2024-087',
    title: 'Equipment calibration deviation',
    severity: 'Major',
    site: 'Quality Lab',
    daysOpen: 7,
  },
];

export const historicalMatches = [
  {
    id: 'DEV-2023-156',
    date: '2023-08-15',
    description: 'Temperature excursion in cold storage - Unit 2',
    severity: 'Critical',
    rootCause: 'Faulty temperature sensor',
    capaStatus: 'Completed',
  },
  {
    id: 'DEV-2024-012',
    date: '2024-01-22',
    description: 'Cold storage alarm failure',
    severity: 'Major',
    rootCause: 'Maintenance oversight',
    capaStatus: 'In Progress',
  },
  {
    id: 'DEV-2023-089',
    date: '2023-04-10',
    description: 'Refrigeration system malfunction',
    severity: 'Critical',
    rootCause: 'Equipment age',
    capaStatus: 'Completed',
  },
];

export const impactAssessments = [
  { category: 'Product Quality', status: 'Medium', description: 'Potential impact on product stability' },
  { category: 'Patient Safety', status: 'Low', description: 'No immediate patient safety concerns' },
  { category: 'Regulatory', status: 'High', description: 'GMP deviation requiring reporting' },
  { category: 'Data Integrity', status: 'None', description: 'All records intact and accurate' },
];

export const actionPlanData = [
  { action: 'Conduct risk assessment', owner: 'Unassigned', mandatory: 'Yes' },
  { action: 'Notify Quality Assurance', owner: 'Unassigned', mandatory: 'Yes' },
  { action: 'Review temperature logs', owner: 'Unassigned', mandatory: 'Yes' },
  { action: 'Inspect affected materials', owner: 'Unassigned', mandatory: 'No' },
];

export const auditTrailData = [
  {
    timestamp: '2024-04-06 14:32:15',
    user: 'AI System',
    action: 'Suggested classification: Major Deviation',
    type: 'ai',
  },
  {
    timestamp: '2024-04-06 14:35:22',
    user: 'John Smith',
    action: 'Accepted AI classification',
    type: 'human',
  },
  {
    timestamp: '2024-04-06 14:36:10',
    user: 'AI System',
    action: 'Detected 3 similar historical events',
    type: 'ai',
  },
  {
    timestamp: '2024-04-06 14:40:55',
    user: 'John Smith',
    action: 'Updated root cause analysis',
    type: 'human',
  },
  {
    timestamp: '2024-04-06 14:45:33',
    user: 'AI System',
    action: 'Suggested CAPA enhancement (low confidence)',
    type: 'ai',
  },
  {
    timestamp: '2024-04-06 14:48:12',
    user: 'Sarah Johnson',
    action: 'Approved corrective action plan',
    type: 'human',
  },
];

export const siteOptions = [
  'Manufacturing Plant A',
  'Manufacturing Plant B',
  'Quality Lab',
  'Distribution Center',
];

export const eventTypeOptions = [
  'Temperature Excursion',
  'Equipment Malfunction',
  'Data Integrity Issue',
  'Documentation Error',
  'Process Deviation',
  'Material Discrepancy',
];

export const sourceSystemOptions = [
  'Environmental Monitoring',
  'Equipment System',
  'LIMS',
  'Manual Entry',
  'MES',
];

export const changeTypeOptions = [
  'Process Change',
  'Equipment Change',
  'Software Change',
  'Documentation Change',
  'Facility Change',
];

export const lifecyclePhaseOptions = [
  'Development',
  'Validation',
  'Commercial Manufacturing',
  'Post-Market',
];

export const rootCauseOptions = [
  'Equipment Failure',
  'Human Error',
  'Process Deficiency',
  'System Malfunction',
  'Material Issue',
  'Environmental Factor',
  'Inadequate Training',
  'Documentation Gap',
];
