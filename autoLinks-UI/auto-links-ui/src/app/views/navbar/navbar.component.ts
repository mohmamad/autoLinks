import { Component, computed, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../common/auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private routeData = signal<Record<string, unknown>>({});

  pageTitle = computed(() => (this.routeData()['pageTitle'] as string) || '');
  pageSubtitle = computed(() => (this.routeData()['pageSubtitle'] as string) || '');
  backLink = computed(() => (this.routeData()['backLink'] as string) || '');

  constructor(
    public auth: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        let route = this.activatedRoute;
        while (route.firstChild) {
          route = route.firstChild;
        }
        this.routeData.set(route.snapshot.data);
      });
  }

  logout(): void {
    this.auth.logout();
  }
}
