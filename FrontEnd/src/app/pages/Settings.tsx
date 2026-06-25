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
import { AIAssistant } from "../components/chat/ai-assistant";
import { useState } from "react";
export function Settings() {
      const [chatOpen, setChatOpen] = useState(false);
      return (
    <div className="relative h-full w-full">
      <div className={`h-full p-6 space-y-6 overflow-y-auto transition-[margin] duration-200 ${chatOpen ? 'mr-80' : ''}`}>
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
              <Switch id="aiEnabled" defaultChecked />
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
              <Switch id="aiAutoAccept" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidenceThreshold">
                Minimum Confidence Threshold
              </Label>
              <Select defaultValue="85">
                <SelectTrigger id="confidenceThreshold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="80">80%</SelectItem>
                  <SelectItem value="85">85%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="95">95%</SelectItem>
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
              <Switch id="emailNotif" defaultChecked />
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
              <Switch id="systemNotif" defaultChecked />
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
              <Switch id="capaReminders" defaultChecked />
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
              <Select defaultValue="plant-a">
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
              <Switch id="crossTrigger" defaultChecked />
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
              <Switch id="detailedAudit" defaultChecked />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataRetention">Data Retention Period</Label>
              <Select defaultValue="7">
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
          <Button className="bg-blue-600 hover:bg-blue-700">
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