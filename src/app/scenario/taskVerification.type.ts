

type BaseTaskVerification = {
  vm_id: string;
  vm_name: string;
};

export type TaskVerification = BaseTaskVerification & {
  task_command: TaskCommand[];  
};

export type TaskVerificationResponse = BaseTaskVerification & {
    task_command_output?: TaskCommand[];
}

export type TaskCommand = {
  name: string;
  description: string;
  command: string;
  expected_output_value: string;
  expected_return_code: number;
  actual_output_value?: string;
  actual_return_code?: number;
  success?: boolean;
};
