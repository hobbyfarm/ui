type BaseTaskVerification = {
  vm_id: string;
  vm_name: string;
};

export type TaskVerification = BaseTaskVerification & {
  tasks: Task[];
};
export type Task = {
  name: string;
  description: string;
  command: string;
  expected_output_value: string;
  expected_return_code: number;
  return_type:
    | 'Return_Text'
    | 'Return_Code_And_Text'
    | 'Return_Code'
    | 'Match_Regex';
  actual_output_value?: string;
  actual_return_code?: number;
  success?: boolean;
};

export type TaskVerificationResponse = BaseTaskVerification & {
  task_outputs?: TaskOutput[];
};

export type TaskOutput = {
  task: Task;
  task_output: Partial<Task>;
};
