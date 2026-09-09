import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';

interface AlertBudget {
  _id: string;
  financialYear: string;
  project: string;
  allocatedAmount: number;
}

interface AlertDepartment {
  _id: string;
  name: string;
  code: string;
}

interface BudgetAlert {
  _id: string;

  budgetId:
    | AlertBudget
    | string;

  departmentId:
    | AlertDepartment
    | string;

  alertType:
    | 'Under-utilization'
    | 'Overspending'
    | 'Spending Spike'
    | 'Threshold Deviation';

  severity:
    | 'Low'
    | 'Medium'
    | 'High'
    | 'Critical';

  message: string;

  utilizationPercentage:
    | number
    | null;

  expenditureAmount:
    | number
    | null;

  thresholdPercentage:
    | number
    | null;

  status:
    | 'Active'
    | 'Resolved';

  detectedAt: string;

  createdAt?: string;
  updatedAt?: string;
}

interface AlertListResponse {
  count: number;
  alerts: BudgetAlert[];
}

interface ScanResponse {
  message: string;
  alertsGenerated: number;
  activeAlerts: BudgetAlert[];
}

interface ResolveResponse {
  message: string;
  alert: BudgetAlert;
}

interface DeleteResponse {
  message: string;
}

@Component({
  selector: 'app-alerts',

  standalone: true,

  imports: [
    CommonModule,
  ],

  templateUrl: './alerts.html',

  styleUrl: './alerts.css',
})
export class Alerts implements OnInit {
  private readonly http =
    inject(HttpClient);

  private readonly cdr =
    inject(ChangeDetectorRef);

  private readonly apiUrl =
    'https://ai-budget-utilization-system.onrender.com/api/alerts';


  /* =========================
     DATA
     ========================= */

  alerts: BudgetAlert[] = [];


  /* =========================
     LOADING STATES
     ========================= */

  loading = true;

  scanning = false;

  resolving = false;

  deleting = false;


  /* =========================
     MODAL
     ========================= */

  showDeleteModal = false;

  selectedAlert:
    | BudgetAlert
    | null = null;


  /* =========================
     MESSAGES
     ========================= */

  errorMessage = '';

  successMessage = '';


  /* =========================
     INITIALIZATION
     ========================= */

  ngOnInit(): void {
    this.loadAlerts();
  }


  /* =========================
     LOAD ALERTS
     ========================= */

  loadAlerts(): void {
    this.loading = true;

    this.errorMessage = '';

    this.http
      .get<AlertListResponse>(
        this.apiUrl
      )
      .pipe(
        finalize(() => {
          this.loading = false;

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.alerts =
            Array.isArray(
              response?.alerts
            )
              ? response.alerts
              : [];

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Alert loading failed:',
            error
          );

          this.alerts = [];

          this.errorMessage =
            error?.error?.message ||
            'Unable to load alerts.';

          this.cdr.detectChanges();
        },
      });
  }


  /* =========================
     SCAN BUDGETS
     ========================= */

  scanBudgets(): void {
    if (this.scanning) {
      return;
    }

    this.scanning = true;

    this.clearMessages();

    this.http
      .post<ScanResponse>(
        `${this.apiUrl}/scan`,
        {}
      )
      .pipe(
        finalize(() => {
          this.scanning = false;

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage =
            response?.message ||
            'Anomaly scan completed successfully.';

          this.alerts =
            Array.isArray(
              response?.activeAlerts
            )
              ? response.activeAlerts
              : [];

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Alert scan failed:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to scan budgets for anomalies.';

          this.cdr.detectChanges();
        },
      });
  }


  /* =========================
     RESOLVE ALERT
     ========================= */

  resolveAlert(
    alert: BudgetAlert
  ): void {
    if (
      this.resolving ||
      alert.status === 'Resolved'
    ) {
      return;
    }

    this.resolving = true;

    this.clearMessages();

    this.http
      .put<ResolveResponse>(
        `${this.apiUrl}/${alert._id}/resolve`,
        {}
      )
      .pipe(
        finalize(() => {
          this.resolving = false;

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage =
            response?.message ||
            'Alert resolved successfully.';

          this.loadAlerts();
        },

        error: (error) => {
          console.error(
            'Alert resolve failed:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to resolve alert.';

          this.cdr.detectChanges();
        },
      });
  }


  /* =========================
     DELETE MODAL
     ========================= */

  openDeleteModal(
    alert: BudgetAlert
  ): void {
    this.clearMessages();

    this.selectedAlert = alert;

    this.showDeleteModal = true;
  }


  closeDeleteModal(): void {
    if (this.deleting) {
      return;
    }

    this.showDeleteModal = false;

    this.selectedAlert = null;
  }


  /* =========================
     DELETE ALERT
     ========================= */

  confirmDelete(): void {
    if (
      !this.selectedAlert ||
      this.deleting
    ) {
      return;
    }

    this.deleting = true;

    this.clearMessages();

    const alertId =
      this.selectedAlert._id;

    this.http
      .delete<DeleteResponse>(
        `${this.apiUrl}/${alertId}`
      )
      .pipe(
        finalize(() => {
          this.deleting = false;

          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage =
            response?.message ||
            'Alert deleted successfully.';

          this.showDeleteModal = false;

          this.selectedAlert = null;

          this.loadAlerts();
        },

        error: (error) => {
          console.error(
            'Alert deletion failed:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to delete alert.';

          this.showDeleteModal = false;

          this.selectedAlert = null;

          this.cdr.detectChanges();
        },
      });
  }


  /* =========================
     MESSAGES
     ========================= */

  clearMessages(): void {
    this.errorMessage = '';

    this.successMessage = '';
  }


  /* =========================
     FILTERED ALERTS
     ========================= */

  get activeAlerts(): BudgetAlert[] {
    return this.alerts.filter(
      (alert) =>
        alert.status === 'Active'
    );
  }


  get resolvedAlerts(): BudgetAlert[] {
    return this.alerts.filter(
      (alert) =>
        alert.status === 'Resolved'
    );
  }


  get criticalAlerts(): number {
    return this.activeAlerts.filter(
      (alert) =>
        alert.severity === 'Critical'
    ).length;
  }


  get highAlerts(): number {
    return this.activeAlerts.filter(
      (alert) =>
        alert.severity === 'High'
    ).length;
  }


  /* =========================
     POPULATED BUDGET
     ========================= */

  getBudget(
    alert: BudgetAlert
  ): AlertBudget | null {
    if (
      alert.budgetId &&
      typeof alert.budgetId === 'object'
    ) {
      return alert.budgetId;
    }

    return null;
  }


  /* =========================
     POPULATED DEPARTMENT
     ========================= */

  getDepartment(
    alert: BudgetAlert
  ): AlertDepartment | null {
    if (
      alert.departmentId &&
      typeof alert.departmentId === 'object'
    ) {
      return alert.departmentId;
    }

    return null;
  }


  /* =========================
     FORMATTING
     ========================= */

  formatCurrency(
    value:
      | number
      | null
      | undefined
  ): string {
    const amount =
      Number(value || 0);

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
    value:
      | number
      | null
      | undefined
  ): string {
    if (
      value === null ||
      value === undefined
    ) {
      return '—';
    }

    return `${Number(value).toFixed(2)}%`;
  }


  formatDate(
    value:
      | string
      | null
      | undefined
  ): string {
    if (!value) {
      return '—';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '—';
    }

    return new Intl.DateTimeFormat(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    ).format(date);
  }


  /* =========================
     TRACKING
     ========================= */

  trackByAlertId(
    _index: number,
    alert: BudgetAlert
  ): string {
    return alert._id;
  }
}