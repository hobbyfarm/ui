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
  header_image_path =
    'https://import.cdn.thinkific.com/666220/pvYTM4WZR72dZlr3a5gi_k3s-Basics-Course-Cover.png';
  is_learnpath: boolean;
}
