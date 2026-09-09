import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface DashboardBudget {
  budgetId: string;
  financialYear: string;
  department: Department | null;
  project: string;
  allocatedAmount: number;
  expenditure: number;
  remainingAmount: number;
  utilizationPercentage: number;
}

interface DashboardSummary {
  totalBudgets: number;
  totalAllocated: number;
  totalExpenditure: number;
  totalRemaining: number;
  overallUtilizationPercentage: number;
  activeAlerts: number;
}

interface DashboardResponse {
  summary: DashboardSummary;
  budgets: DashboardBudget[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly apiUrl =
    'https://ai-budget-utilization-system.onrender.com/api/dashboard';

  summary: DashboardSummary = {
    totalBudgets: 0,
    totalAllocated: 0,
    totalExpenditure: 0,
    totalRemaining: 0,
    overallUtilizationPercentage: 0,
    activeAlerts: 0,
  };

  budgets: DashboardBudget[] = [];

  loading = true;

  errorMessage = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.cdr.detectChanges();

    console.log('Loading dashboard data...');

    this.http
      .get<DashboardResponse>(this.apiUrl)
      .pipe(
        finalize(() => {
          this.loading = false;

          console.log(
            'Dashboard loading finished.'
          );

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          console.log(
            'Dashboard API response:',
            response
          );

          if (response?.summary) {
            this.summary = {
              totalBudgets:
                Number(
                  response.summary.totalBudgets || 0
                ),

              totalAllocated:
                Number(
                  response.summary.totalAllocated || 0
                ),

              totalExpenditure:
                Number(
                  response.summary.totalExpenditure || 0
                ),

              totalRemaining:
                Number(
                  response.summary.totalRemaining || 0
                ),

              overallUtilizationPercentage:
                Number(
                  response.summary
                    .overallUtilizationPercentage || 0
                ),

              activeAlerts:
                Number(
                  response.summary.activeAlerts || 0
                ),
            };
          }

          this.budgets =
            Array.isArray(response?.budgets)
              ? response.budgets
              : [];

          console.log(
            'Dashboard summary:',
            this.summary
          );

          console.log(
            'Dashboard budgets:',
            this.budgets
          );

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Dashboard request failed:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to load dashboard data.';

          this.summary = {
            totalBudgets: 0,
            totalAllocated: 0,
            totalExpenditure: 0,
            totalRemaining: 0,
            overallUtilizationPercentage: 0,
            activeAlerts: 0,
          };

          this.budgets = [];

          this.loading = false;

          this.cdr.detectChanges();
        },
      });
  }

  retry(): void {
    this.loadDashboard();
  }

  get utilization(): number {
    return Math.min(
      Math.max(
        Number(
          this.summary
            .overallUtilizationPercentage || 0
        ),
        0
      ),
      100
    );
  }

  get activeAlertCount(): number {
    return Number(
      this.summary.activeAlerts || 0
    );
  }

  get utilizationStatus(): string {
    const value = this.utilization;

    if (value >= 100) {
      return 'Budget exceeded';
    }

    if (value >= 80) {
      return 'High utilization';
    }

    if (value >= 40) {
      return 'Healthy utilization';
    }

    return 'Low utilization';
  }

  formatCurrency(
    value: number | null | undefined
  ): string {
    const amount = Number(value || 0);

    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }
    ).format(amount);
  }

  formatPercentage(
    value: number | null | undefined
  ): string {
    return `${Number(value || 0).toFixed(2)}%`;
  }

  trackByBudgetId(
    _index: number,
    budget: DashboardBudget
  ): string {
    return budget.budgetId;
  }
}