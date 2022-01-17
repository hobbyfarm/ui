export class Progress {
    id: string;
    session: string;
    user: string;
    scenario: string;
    course: string;
    current_step: number;
    max_step: number;
    total_step: number;
    finished: boolean
    last_update: Date;
    started: Date;
    steps: ProgressStep[];
    username: string;
    scenario_name: string;
}

export class ProgressStep {
    step: number;
    timestamp: Date;
}