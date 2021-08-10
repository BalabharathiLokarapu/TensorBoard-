/* Copyright 2021 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {fromEvent, Observable, Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';

import {sideBarWidthChanged} from '../actions';
import {State} from '../state';
import {getSideBarWidthInPercent} from '../store/core_selectors';
import {MouseEventButtons} from '../../util/dom';

@Component({
  selector: 'tb-layout',
  template: `
    <button
      *ngIf="(width$ | async) === 0"
      class="expand"
      (click)="expandSidebar()"
    >
      <mat-icon svgIcon="expand_more_24px"></mat-icon>
    </button>
    <nav
      [class.sidebar]="true"
      [class.collapsed]="(width$ | async) === 0"
      [style.width.%]="width$ | async"
    >
      <ng-content select="[sidebar]"></ng-content>
    </nav>
    <div
      *ngIf="(width$ | async) > 0"
      class="resizer"
      (mousedown)="resizeGrabbed()"
    >
      <mat-icon svgIcon="drag_indicator_24px"></mat-icon>
    </div>
    <ng-content select="[main]"></ng-content>
  `,
  styleUrls: ['layout_container.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutContainer implements OnDestroy {
  readonly width$: Observable<number> = this.store.select(
    getSideBarWidthInPercent
  );
  private readonly ngUnsubscribe = new Subject<void>();
  private resizing: boolean = false;

  constructor(private readonly store: Store<State>, hostElRef: ElementRef) {
    fromEvent<MouseEvent>(hostElRef.nativeElement, 'mousemove')
      .pipe(
        takeUntil(this.ngUnsubscribe),
        filter(() => this.resizing)
      )
      .subscribe((event) => {
        // If mouse ever leaves the browser and comes back, there are chances
        // that the LEFT button is no longer being held down. This makes sure
        // we don't have a funky UX where sidebar resizes without user
        // mousedowning.
        if (
          (event.buttons & MouseEventButtons.LEFT) !==
          MouseEventButtons.LEFT
        ) {
          this.resizing = false;
          return;
        }
        // Prevents mousemove from selecting text underneath.
        event.preventDefault();
        const {width} = hostElRef.nativeElement.getBoundingClientRect();
        // Keep 75 update to date with the min-width in SCSS.
        // Collapse the sidebar when it is too small.
        const widthInPercent =
          event.clientX <= 75 ? 0 : (event.clientX / width) * 100;
        this.store.dispatch(sideBarWidthChanged({widthInPercent}));
      });

    fromEvent(hostElRef.nativeElement, 'mouseup', {passive: true})
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.resizing = false;
      });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  resizeGrabbed() {
    this.resizing = true;
  }

  expandSidebar() {
    this.store.dispatch(
      sideBarWidthChanged({
        widthInPercent: 20,
      })
    );
  }
}
