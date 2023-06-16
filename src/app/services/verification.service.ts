import { Injectable } from "@angular/core";
import { GargantuaClient, GargantuaClientFactory, extractResponseContent } from "./gargantua.service";
import { TaskCommand, TaskVerification } from "../scenario/taskVerification.type";
import { VM } from "../VM";



@Injectable()
export class VerificationService {

    constructor(
        private gcf: GargantuaClientFactory,
    ) { }

    private shellClients: Map<string, GargantuaClient> = new Map()
    private pathPrefix: string = "/shell"

    private getShellClient(endpoint: string): GargantuaClient {
        let client = this.shellClients.get(endpoint)
        if (!client) {
            const newClient = this.gcf.scopedShellClient("http://" + endpoint, this.pathPrefix)
            this.shellClients.set(endpoint, newClient)
            client = newClient
        }
        return client
    }

    verify(vm: VM, vmName: string) {

        const body = [{
            vm_id: vm.id,
            vm_name: vmName,
            task_command: commands
        }] as TaskVerification[]


        return this.getShellClient(vm.ws_endpoint).post("/verify", body)
    }
}

export const commands = [
    {
        
        "name": "",

        "description": "",

        "command": "touch abc.txt",

        "expected_output_value": "",

        "expected_return_code": 0

    },

    {

        "name": "test file 123.txt",

        "description": "test if file 123.txt present in current folder",

        "command": "test -f 123.txt",

        "expected_output_value": "",

        "expected_return_code": 0

    },

    {

        "name": "ls",

        "description": "list of files in current folder",

        "command": "ls",

        "expected_output_value": `123.txt\nabc.txt\nsnap`,

        "expected_return_code": 0

    },

] as TaskCommand[]