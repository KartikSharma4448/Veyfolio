import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trackEvent } from "@/lib/analytics";

/**
 * AI Refinement toggle control.
 *
 * Displays a labeled switch that enables/disables AI-powered text refinement.
 * Fires a GA4 `ai_toggle_changed` event whenever the toggle state changes.
 *
 * @param {Object} props
 * @param {boolean} props.enabled - Whether AI refinement is currently enabled
 * @param {function} props.onToggle - Callback invoked with the new boolean state
 */
const AIToggle = ({ enabled, onToggle }) => {
  const handleChange = (checked) => {
    onToggle(checked);
    trackEvent("ai_toggle_changed", {
      state: checked ? "enabled" : "disabled",
    });
  };

  return (
    <div className="flex items-center gap-2 text-gray-300 shrink-0">
      <Switch
        id="ai-toggle"
        checked={enabled}
        onCheckedChange={handleChange}
        className="data-[state=checked]:bg-[#0066ff] data-[state=unchecked]:bg-gray-600"
      />
      <Label htmlFor="ai-toggle" className="text-xs whitespace-nowrap">AI Refinement</Label>
    </div>
  );
};

export default AIToggle;
