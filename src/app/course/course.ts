export class Course {
  id: string;
  name: string;
  description: string;
  scenarioCount: number;
  // These are Scenario IDs
  scenarios: string[];
  keep_vm: boolean;
  pauseable: boolean;
  virtualmachines: Map<string, string>[];
}
