import { environment } from 'src/environments/environment';


declare global {
    interface Window {
        HobbyfarmConfig: any;
    }
}

export class AppConfig {
    static server: string = "";

    public static initServer() {
        if (!window.HobbyfarmConfig || !window.HobbyfarmConfig.SERVER || window.HobbyfarmConfig.SERVER == "") {
            this.server = environment.server;
        } else {
            this.server = window.HobbyfarmConfig.SERVER;
        }
    }

    public static getServer() {
        return this.server;
    }
}