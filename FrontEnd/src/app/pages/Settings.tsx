import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { AIAssistant } from "../components/chat/ai-assistant";
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
                <p className="text-sm text-muted-foreground">The following settings were updated:</p>
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
              <p className="text-sm text-muted-foreground">No changes were made.</p>
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
        className={`h-full p-6 space-y-6 overflow-y-auto transition-[margin] duration-200 ${
          chatOpen ? "mr-80" : ""
        }`}
      >
        <div className="space-y-6">
          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    Automatically accept AI suggestions above confidence threshold
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
                  <SelectTrigger id="confidenceThreshold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="70">70%</SelectItem>
                    <SelectItem value="80">80%</SelectItem>
                    <SelectItem value="90">90%</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  AI suggestions below this threshold will require human review
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
          <Card>
            <CardHeader>
              <CardTitle>Workflow Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultSite">Default Site</Label>
                <Select
                  value={settings.defaultSite}
                  onValueChange={setSelect("defaultSite")}
                >
                  <SelectTrigger id="defaultSite">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plant-a">Manufacturing Plant A</SelectItem>
                    <SelectItem value="plant-b">Manufacturing Plant B</SelectItem>
                    <SelectItem value="lab">Quality Lab</SelectItem>
                    <SelectItem value="dist">Distribution Center</SelectItem>
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
          <Card>
            <CardHeader>
              <CardTitle>Audit & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <SelectTrigger id="dataRetention">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 years</SelectItem>
                    <SelectItem value="7">7 years (Recommended)</SelectItem>
                    <SelectItem value="10">10 years</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Regulatory requirement typically 5-7 years
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white dark:text-white"
              onClick={handleSave}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      </div>
    </div>
  );
}