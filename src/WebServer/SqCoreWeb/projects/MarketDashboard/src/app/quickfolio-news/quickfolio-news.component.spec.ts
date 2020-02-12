import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickfolioNewsComponent } from './quickfolio-news.component';

describe('QuickfolioNewsComponent', () => {
  let component: QuickfolioNewsComponent;
  let fixture: ComponentFixture<QuickfolioNewsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ QuickfolioNewsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuickfolioNewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
