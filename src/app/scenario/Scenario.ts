import { TaskVerification } from "./taskVerification.type";

export class Scenario {
  id: string;
  name: string;
  description: string;
  stepcount: number;
  virtualmachines: Map<string, string>[];
  pauseable: boolean;
  printable: boolean;
  vm_tasks: TaskVerification[]
}
