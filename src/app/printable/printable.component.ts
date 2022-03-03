import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MarkdownService } from 'ngx-markdown';
import { ScenarioService } from '../services/scenario.service';

@Component({
  selector: 'app-printable',
  templateUrl: './printable.component.html',
  styleUrls: ['./printable.component.scss']
})
export class PrintableComponent implements OnInit, AfterViewChecked {

  public scenario: string = "";

  constructor(
    public route: ActivatedRoute,
    public scenarioService: ScenarioService,
    public markdownService: MarkdownService
  ) { }

  ngAfterViewChecked(): void {
    // Collect all <details> into a NodeList
    const detailsElements: NodeListOf<HTMLDetailsElement> = document.querySelectorAll<"details">('details');
    detailsElements.forEach((details: HTMLDetailsElement) => {
      details.open = true;
      details.onclick = (ev: MouseEvent) => {
        ev.preventDefault();
      }
    })

    // Collect all <pre> into a NodeList
    const preElements: NodeListOf<HTMLPreElement> = document.querySelectorAll<"pre">('pre');
    preElements.forEach((pre: HTMLPreElement) => {
      pre.style.overflowWrap = "break-word";
      pre.style.whiteSpace = "pre-wrap";
    })
  }


  ngOnInit(): void {
    const { paramMap } = this.route.snapshot;
    const scenarioId = paramMap.get('scenario')!;

    this.scenarioService.printable(scenarioId)
      .subscribe(
        (content: any) => {
          this.scenario = content;
        },
        (error: HttpErrorResponse) => {
          this.scenario = "There was an error rendering printable scenario content: " + error.message
        }
      )
  }

  printPdf() {
    window.print();
  }
}
