import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface Config {
  title: string;
  favicon: string;
  login: {
    logo: string;
    background: string;
  };
  logo: string;
  about: {
    title: string;
    body: string;
    buttons: { title: string; url: string }[];
  };
}

@Injectable()
export class AppConfigService {
  private appConfig: Config;

  constructor(private http: HttpClient) {}

  loadAppConfig() {
    return this.http
      .get<Config>('/config.json')
      .toPromise()
      .then((data) => {
        this.appConfig = data;
      });
  }

  getLogo(logoPath: string) {
    const headers = new HttpHeaders();
    headers.set('Accept', '*');
    return this.http
      .get(logoPath, { headers, responseType: 'text' })
      .toPromise();
  }

  getConfig() {
    return this.appConfig;
  }
}
