import { Score } from '../scenario/bashbrawl/bashbrawlterminal.component';

import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import {
  extractResponseContent,
  GargantuaClientFactory,
} from './gargantua.service';
import { map } from 'rxjs/operators';

@Injectable()
export class ScoreService {
  constructor(private gcf: GargantuaClientFactory) {}
  private garg = this.gcf.scopedClient('/score');

  public getLeaderboard(language: string) {
    if (!language || language == '') {
      language = 'all';
    }
    return this.garg
      .get('/leaderboard/' + language)
      .pipe(map(extractResponseContent));
  }
  public setScoreForLanguage(language: string, score: Score) {
    if (!language || language == '') {
      language = 'all';
    }

    // Set headers for JSON
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this.garg.post('/add/' + language, score, { headers });
  }
}
