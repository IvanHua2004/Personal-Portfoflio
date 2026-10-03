import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  signal,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { FlowFieldComponent } from '../../shared/components/flow-field/flow-field.component';
import { AboutComponent } from '../about/about.component';
import { ContactComponent } from '../contact/contact.component';
import { ProjectsComponent } from '../projects/projects.component';
import { PROFILE } from '../../data/profile.data';

@Component({
  selector: 'app-home',
  imports: [RouterLink, FlowFieldComponent, ProjectsComponent, AboutComponent, ContactComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly profile = PROFILE;

  private readonly heroLines = viewChildren<ElementRef<HTMLElement>>('heroLine');

  protected readonly heroSources = computed(() =>
    this.heroLines().map((ref) => ref.nativeElement),
  );

  protected readonly fieldReady = signal(false);

  protected onFieldReady(): void {
    this.fieldReady.set(true);
  }
}
