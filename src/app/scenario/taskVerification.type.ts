export type TaskVerification = {
    vm_id: string,
    vm_name: string,
    task_command?: TaskCommand[]
    task_command_output?: TaskCommand[]
}

export type TaskCommand = {
    name: string,
    description: string,
    command: string,
    expected_output_value: string,
    expected_return_code: number
    actual_output_value?: string,
    actual_return_code?: number,
    success?: boolean
}