import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { actionPlanData } from '../lib/mockData';

// ── Constants ────────────────────────────────────────────────────────────
const OWNER_OPTIONS = [
  'Unassigned',
  'QA Manager',
  'Site Manager',
  'Validation Lead',
  'IT Manager',
] as const;

const DEFAULT_DUE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];

interface Milestone {
  range: string;
  title: string;
  description: string;
}

const TIMELINE_MILESTONES: Milestone[] = [
  {
    range: 'Day 1-7',
    title: 'Risk assessment and impact analysis',
    description: 'Complete preliminary assessment',
  },
  {
    range: 'Day 8-21',
    title: 'Validation protocol development',
    description: 'If required based on impact assessment',
  },
  {
    range: 'Day 22-45',
    title: 'Implementation and testing',
    description: 'Execute change in controlled environment',
  },
  {
    range: 'Day 46-60',
    title: 'Validation execution and closure',
    description: 'Complete validation activities and documentation',
  },
];

function getMandatoryBadgeClass(mandatory: string): string {
  return mandatory === 'Yes'
    ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : 'bg-muted text-muted-foreground';
}

// ── Subcomponents ───────────────────────────────────────────────────────
function ActionRow({ action }: { action: (typeof actionPlanData)[number] }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{action.action}</TableCell>
      <TableCell>
        <Select defaultValue={action.owner}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OWNER_OPTIONS.map((owner) => (
              <SelectItem key={owner} value={owner}>
                {owner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <input
          type="date"
          className="border rounded px-2 py-1 text-sm w-full bg-background text-foreground"
          defaultValue={DEFAULT_DUE_DATE}
        />
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={getMandatoryBadgeClass(action.mandatory)}>
          {action.mandatory}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

function TimelineItem({ milestone }: { milestone: Milestone }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-32 text-sm text-muted-foreground">{milestone.range}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{milestone.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────
export function ActionPlan() {
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Action Plan</h1>
        <p className="text-sm text-muted-foreground mt-1">Define and assign required actions</p>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Required Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/5">Action</TableHead>
                  <TableHead className="w-1/4">Owner</TableHead>
                  <TableHead className="w-1/6">Due Date</TableHead>
                  <TableHead className="w-1/6">Mandatory</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionPlanData.map((action, index) => (
                  <ActionRow key={action.action ?? index} action={action} />
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Button variant="outline" size="sm">
                + Add Custom Action
              </Button>
            </div>
          </CardContent>
        </Card>
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline & Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TIMELINE_MILESTONES.map((milestone) => (
                <TimelineItem key={milestone.range} milestone={milestone} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/change-control/decision')}>
            Back
          </Button>
          <Button
            onClick={() => navigate('/change-control/cross-trigger')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}