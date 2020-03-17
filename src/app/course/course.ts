import { Scenario } from '../scenario/Scenario';

export class Course {
    id: string;
    name: string;
    description: string;
    scenarioCount: number;
    scenarios: Scenario[];
}