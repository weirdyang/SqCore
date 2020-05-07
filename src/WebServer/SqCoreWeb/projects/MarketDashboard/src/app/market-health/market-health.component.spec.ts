import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketHealthComponent } from './market-health.component';

describe('MarketHealthComponent', () => {
  let component: MarketHealthComponent;
  let fixture: ComponentFixture<MarketHealthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MarketHealthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketHealthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
