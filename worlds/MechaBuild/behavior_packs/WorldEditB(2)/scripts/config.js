import { variables } from "@minecraft/server-admin";

export default {
  debug: variables.get("debug"),
  commandPrefix: variables.get("commandPrefix"),
  performanceMode: variables.get("performanceMode"),
  maxHistorySize: variables.get("maxHistorySize"),
  drawOutlines: variables.get("drawOutlines"),
  ticksToDeleteSession: variables.get("ticksToDeleteSession"),
  printToActionBar: variables.get("printToActionBar"),
  wandItem: variables.get("wandItem"),
  navWandItem: variables.get("navWandItem"),
  traceDistance: variables.get("traceDistance"),
  maxBrushRadius: variables.get("maxBrushRadius"),
  superPickaxeDrop: variables.get("superPickaxeDrop"),
  superPickaxeManyDrop: variables.get("superPickaxeManyDrop"),
  defaultChangeLimit: variables.get("defaultChangeLimit"),
  maxChangeLimit: variables.get("maxChangeLimit"),
  asyncTimeBudget: variables.get("asyncTimeBudget"),
};

// WorldEdit version (do not change)
export const VERSION = "0.8.4";