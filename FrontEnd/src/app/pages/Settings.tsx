import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { AIAssistant } from "../components/chat/AiAssistant";
import { useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { DEFAULTS, LABELS, OPTION_LABELS } from "../mocks/Settings";

export function Settings() {
  const [chatOpen, setChatOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [savedChanges, setSavedChanges] = useState<string[]>([]);

  const [settings, setSettings] = useState({ ...DEFAULTS });

  const [lastSaved, setLastSaved] = useState({ ...DEFAULTS });

  const setSwitch = (key: keyof typeof DEFAULTS) => (val: boolean) =>
    setSettings((s) => ({ ...s, [key]: val }));

  const setSelect = (key: keyof typeof DEFAULTS) => (val: string) =>
    setSettings((s) => ({ ...s, [key]: val }));

  const handleSave = () => {
    const changes: string[] = [];
    (Object.keys(settings) as (keyof typeof DEFAULTS)[]).forEach((key) => {
      if (settings[key] !== lastSaved[key]) {
        const label = LABELS[key];
        const newVal = settings[key];
        if (typeof newVal === "boolean") {
          changes.push(`${label}: ${newVal ? "Enabled" : "Disabled"}`);
        } else {
          const friendlyVal = OPTION_LABELS[key]?.[newVal as string] ?? newVal;
          changes.push(`${label}: ${friendlyVal}`);
        }
      }
    });

    setLastSaved({ ...settings });
    setSavedChanges(changes);
    setShowPopup(true);
  };

  return (
    <div className="relative h-full w-full">
      {/* Success popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
                <h2 className="text-lg font-semibold text-foreground">
                  Changes Saved Successfully
                </h2>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {savedChanges.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  The following settings were updated:
                </p>
                <ul className="space-y-2">
                  {savedChanges.map((change, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg px-3 py-2"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No changes were made.
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white dark:text-white"
                onClick={() => setShowPopup(false)}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`h-full overflow-y-auto p-6 transition-[margin] duration-200 ${
          chatOpen ? "mr-80" : ""
        }`}
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* AI Configuration */}
          <Card className="rounded-2xl border border-border bg-background shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <CardTitle>AI Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="aiEnabled" className="text-base">
                    Enable AI Recommendations
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Turn on AI-powered classification and suggestions
                  </p>
                </div>
                <Switch
                  id="aiEnabled"
                  checked={settings.aiEnabled}
                  onCheckedChange={setSwitch("aiEnabled")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="aiAutoAccept" className="text-base">
                    Auto-Accept High Confidence AI Decisions
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically accept AI suggestions above confidence
                    threshold
                  </p>
                </div>
                <Switch
                  id="aiAutoAccept"
                  checked={settings.aiAutoAccept}
                  onCheckedChange={setSwitch("aiAutoAccept")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidenceThreshold">
                  Minimum Confidence Threshold
                </Label>
                <Select
                  value={settings.confidenceThreshold}
                  onValueChange={setSelect("confidenceThreshold")}
                >
                  <SelectTrigger
                    id="confidenceThreshold"
                    className="
    h-11
    rounded-xl
    border
    border-slate-200
    bg-white
    px-4
    text-sm
    font-medium
    text-slate-700

    shadow-sm
    transition-all
    duration-200

    hover:border-blue-300
    hover:bg-slate-50

    focus:ring-2
    focus:ring-blue-500/15
    focus:border-blue-500

    dark:border-slate-700
    dark:bg-slate-900
    dark:text-slate-200
    dark:hover:border-blue-500
    dark:hover:bg-slate-800
  "
                  >
                    <SelectValue className="text-slate-700 dark:text-slate-200" />
                  </SelectTrigger>
                  <SelectContent
                    className="
    rounded-xl
    border
    border-slate-200
    bg-white
    p-2

    shadow-xl

    dark:border-slate-700
    dark:bg-slate-900
  "
                  >
                    <SelectItem
                      value="70"
                      className="
    rounded-lg
    px-3
    py-2

    text-sm
    font-medium

    cursor-pointer

    transition-all

    hover:bg-blue-50
    hover:text-blue-700

    focus:bg-blue-50
    focus:text-blue-700

    dark:hover:bg-slate-800
    dark:hover:text-blue-400

    dark:focus:bg-slate-800
    dark:focus:text-blue-400
  "
                    >
                      70%
                    </SelectItem>
                    <SelectItem
                      value="80"
                      className="
    rounded-lg
    px-3
    py-2

    text-sm
    font-medium

    cursor-pointer

    transition-all

    hover:bg-blue-50
    hover:text-blue-700

    focus:bg-blue-50
    focus:text-blue-700

    dark:hover:bg-slate-800
    dark:hover:text-blue-400

    dark:focus:bg-slate-800
    dark:focus:text-blue-400
  "
                    >
                      80%
                    </SelectItem>
                    <SelectItem
                      value="90"
                      className="
    rounded-lg
    px-3
    py-2

    text-sm
    font-medium

    cursor-pointer

    transition-all

    hover:bg-blue-50
    hover:text-blue-700

    focus:bg-blue-50
    focus:text-blue-700

    dark:hover:bg-slate-800
    dark:hover:text-blue-400

    dark:focus:bg-slate-800
    dark:focus:text-blue-400
  "
                    >
                      90%
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  AI suggestions below this threshold will require human review
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="rounded-2xl border border-border bg-background shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotif" className="text-base">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive email alerts for critical events
                  </p>
                </div>
                <Switch
                  id="emailNotif"
                  checked={settings.emailNotif}
                  onCheckedChange={setSwitch("emailNotif")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="systemNotif" className="text-base">
                    System Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    In-app notifications and alerts
                  </p>
                </div>
                <Switch
                  id="systemNotif"
                  checked={settings.systemNotif}
                  onCheckedChange={setSwitch("systemNotif")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="capaReminders" className="text-base">
                    CAPA Due Date Reminders
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive reminders before CAPA deadlines
                  </p>
                </div>
                <Switch
                  id="capaReminders"
                  checked={settings.capaReminders}
                  onCheckedChange={setSwitch("capaReminders")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Workflow Settings */}
          <Card className="rounded-2xl border border-border bg-background shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <CardTitle>Workflow Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="defaultSite">Default Site</Label>
                <Select
                  value={settings.defaultSite}
                  onValueChange={setSelect("defaultSite")}
                >
                  <SelectTrigger
                    id="defaultSite"
                    className="
    h-11
    rounded-xl
    border
    border-slate-200
    bg-white
    px-4
    text-sm
    font-medium
    text-slate-700
    shadow-sm
    transition-all
    duration-200

    hover:border-blue-300
    hover:bg-slate-50

    focus:ring-2
    focus:ring-blue-500/15
    focus:border-blue-500

    dark:border-slate-700
    dark:bg-slate-900
    dark:text-slate-200
    dark:hover:border-blue-500
    dark:hover:bg-slate-800
  "
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className="
    rounded-xl
    border
    border-slate-200
    bg-white
    p-2
    shadow-xl

    dark:border-slate-700
    dark:bg-slate-900
  "
                  >
                    <SelectItem
                      value="plant-a"
                      className="
    rounded-lg
    px-3
    py-2
    text-sm
    font-medium
    cursor-pointer
    transition-all

    hover:bg-blue-50
    hover:text-blue-700

    focus:bg-blue-50
    focus:text-blue-700

    dark:hover:bg-slate-800
    dark:hover:text-blue-400

    dark:focus:bg-slate-800
    dark:focus:text-blue-400
  "
                    >
                      Manufacturing Plant A
                    </SelectItem>
                    <SelectItem
                      value="plant-b"
                      className="
    rounded-lg
    px-3
    py-2
    text-sm
    font-medium
    cursor-pointer
    transition-all

    hover:bg-blue-50
    hover:text-blue-700

    focus:bg-blue-50
    focus:text-blue-700

    dark:hover:bg-slate-800
    dark:hover:text-blue-400

    dark:focus:bg-slate-800
    dark:focus:text-blue-400
  "
                    >
                      Manufacturing Plant B
                    </SelectItem>
                    <SelectItem
                      value="lab"
                      className="
    rounded-lg
    px-3
    py-2
    text-sm
    font-medium
    cursor-pointer
    transition-all

    hover:bg-blue-50
    hover:text-blue-700

    focus:bg-blue-50
    focus:text-blue-700

    dark:hover:bg-slate-800
    dark:hover:text-blue-400

    dark:focus:bg-slate-800
    dark:focus:text-blue-400
  "
                    >
                      Quality Lab
                    </SelectItem>
                    <SelectItem
                      value="dist"
                      className="
    rounded-lg
    px-3
    py-2
    text-sm
    font-medium
    cursor-pointer
    transition-all

    hover:bg-blue-50
    hover:text-blue-700

    focus:bg-blue-50
    focus:text-blue-700

    dark:hover:bg-slate-800
    dark:hover:text-blue-400

    dark:focus:bg-slate-800
    dark:focus:text-blue-400
  "
                    >
                      Distribution Center
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="crossTrigger" className="text-base">
                    Enable Cross-Module Triggers
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically link related deviations and change controls
                  </p>
                </div>
                <Switch
                  id="crossTrigger"
                  checked={settings.crossTrigger}
                  onCheckedChange={setSwitch("crossTrigger")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Audit & Compliance */}
          <Card className="rounded-2xl border border-border bg-background shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-3">
              <CardTitle>Audit & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="detailedAudit" className="text-base">
                    Detailed Audit Trail
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Log all system activities including AI actions
                  </p>
                </div>
                <Switch
                  id="detailedAudit"
                  checked={settings.detailedAudit}
                  onCheckedChange={setSwitch("detailedAudit")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention Period</Label>
                <Select
                  value={settings.dataRetention}
                  onValueChange={setSelect("dataRetention")}
                >
                  <SelectTrigger
                    id="dataRetention"
                    className="
    h-11
    rounded-xl
    border
    border-slate-200
    bg-white
    px-4
    text-sm
    font-medium
    text-slate-700
    shadow-sm
    transition-all
    duration-200

    hover:border-blue-300
    hover:bg-slate-50

    focus:ring-2
    focus:ring-blue-500/15
    focus:border-blue-500

    dark:border-slate-700
    dark:bg-slate-900
    dark:text-slate-200
    dark:hover:border-blue-500
    dark:hover:bg-slate-800
  "
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className="
    rounded-xl
    border
    border-slate-200
    bg-white
    p-2
    shadow-xl

    dark:border-slate-700
    dark:bg-slate-900
  "
                  >
                    <SelectItem
                      value="5"
                      className="
    rounded-lg
    px-3
    py-2
    text-sm
    font-medium
    cursor-pointer
    transition-all

    hover:bg-blue-50
    hover:text-blue-700

    focus:bg-blue-50
    focus:text-blue-700

    dark:hover:bg-slate-800
    dark:hover:text-blue-400

    dark:focus:bg-slate-800
    dark:focus:text-blue-400
  "
                    >
                      5 years
                    </SelectItem>
                    <SelectItem
                      value="7"
                      className="
    rounded-lg
    px-3
    py-2
    text-sm
    font-medium
    cursor-pointer
    transition-all

    hover:bg-blue-50
    hover:text-blue-700

    focus:bg-blue-50
    focus:text-blue-700

    dark:hover:bg-slate-800
    dark:hover:text-blue-400

    dark:focus:bg-slate-800
    dark:focus:text-blue-400
  "
                    >
                      7 years (Recommended)
                    </SelectItem>
                    <SelectItem
                      value="10"
                      className="
    rounded-lg
    px-3
    py-2
    text-sm
    font-medium
    cursor-pointer
    transition-all

    hover:bg-blue-50
    hover:text-blue-700

    focus:bg-blue-50
    focus:text-blue-700

    dark:hover:bg-slate-800
    dark:hover:text-blue-400

    dark:focus:bg-slate-800
    dark:focus:text-blue-400
  "
                    >
                      10 years
                    </SelectItem>
                    <SelectItem
                      value="permanent"
                      className="
    rounded-lg
    px-3
    py-2
    text-sm
    font-medium
    cursor-pointer
    transition-all

    hover:bg-blue-50
    hover:text-blue-700

    focus:bg-blue-50
    focus:text-blue-700

    dark:hover:bg-slate-800
    dark:hover:text-blue-400

    dark:focus:bg-slate-800
    dark:focus:text-blue-400
  "
                    >
                      Permanent
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Regulatory requirement typically 5-7 years
                </p>
              </div>
            </CardContent>
          </Card>

          <div
            className="
    xl:col-span-2
    sticky
    bottom-0
    z-20
    mt-8
    flex
    justify-end
    py-2
  "
          >
            {/* Right Side */}
            <div className="ml-auto flex items-center gap-3">
              <Button
                onClick={handleSave}
                className="
    h-10
    rounded-xl
    bg-gradient-to-r
    from-blue-600
    to-blue-500
    px-7
    font-semibold
    text-white

    shadow-md
    hover:shadow-xl

    hover:from-blue-700
    hover:to-blue-600

    transition-all
    duration-200

    active:scale-[0.98]
  "
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant
          isOpen={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
        />
      </div>
    </div>
  );
}
