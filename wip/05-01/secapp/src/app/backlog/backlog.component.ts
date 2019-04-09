import { Component, OnInit } from "@angular/core";
import { PtItem } from "./pt-item";
import { BacklogService } from "./backlog.service";
import { Router } from "@angular/router";

@Component({
    selector: "ns-backlog",
    moduleId: module.id,
    templateUrl: "./backlog.component.html"
})
export class BacklogComponent implements OnInit {
    public items: PtItem[] = [];

    constructor(
        private backlogService: BacklogService,
        private router: Router
    ) { }

    public ngOnInit(): void {
        this.backlogService.getItems()
            .then(items => this.items = items);
    }
}
