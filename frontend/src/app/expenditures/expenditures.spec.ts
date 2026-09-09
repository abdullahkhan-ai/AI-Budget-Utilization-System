import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Expenditures } from './expenditures';

describe('Expenditures', () => {
  let component: Expenditures;
  let fixture: ComponentFixture<Expenditures>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Expenditures],
    }).compileComponents();

    fixture = TestBed.createComponent(Expenditures);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
