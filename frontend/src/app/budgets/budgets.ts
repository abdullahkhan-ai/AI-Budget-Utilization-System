import {
  CommonModule,
} from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  HttpClient,
} from '@angular/common/http';

import {
  finalize,
} from 'rxjs';


/* =========================================================
   INTERFACES
   ========================================================= */

interface Department {
  _id: string;
  name: string;
  code: string;
}


interface Budget {
  _id: string;

  financialYear: string;

  periodType:
    | 'Annual'
    | 'Quarterly';

  quarter:
    | 'Q1'
    | 'Q2'
    | 'Q3'
    | 'Q4'
    | null;

  departmentId: Department;

  project: string;

  allocatedAmount: number;

  allocationDate: string;

  description: string;

  status:
    | 'Active'
    | 'Closed';
}


interface BudgetResponse {
  budgets: Budget[];
}


interface DepartmentResponse {
  departments: Department[];
}


interface BudgetForm {
  financialYear: string;

  periodType:
    | 'Annual'
    | 'Quarterly';

  quarter:
    | 'Q1'
    | 'Q2'
    | 'Q3'
    | 'Q4'
    | null;

  departmentId: string;

  project: string;

  allocatedAmount:
    | number
    | null;

  allocationDate: string;

  description: string;

  status:
    | 'Active'
    | 'Closed';
}


interface BudgetPayload {
  financialYear: string;

  periodType:
    | 'Annual'
    | 'Quarterly';

  quarter:
    | 'Q1'
    | 'Q2'
    | 'Q3'
    | 'Q4'
    | null;

  departmentId: string;

  project: string;

  allocatedAmount: number;

  allocationDate: string;

  description: string;

  status:
    | 'Active'
    | 'Closed';
}


/* =========================================================
   COMPONENT
   ========================================================= */

@Component({
  selector: 'app-budgets',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
  ],

  templateUrl: './budgets.html',

  styleUrl: './budgets.css',
})
export class Budgets implements OnInit {


  /* =======================================================
     API
     ======================================================= */

  private readonly budgetsApi =
    'https://ai-budget-utilization-system.onrender.com/api/budgets';

  private readonly departmentsApi =
    'https://ai-budget-utilization-system.onrender.com/api/departments';


  /* =======================================================
     DATA
     ======================================================= */

  budgets: Budget[] = [];

  departments: Department[] = [];


  /* =======================================================
     STATE
     ======================================================= */

  loading = false;

  departmentsLoading = false;

  submitting = false;

  deleting = false;


  errorMessage = '';

  successMessage = '';


  showForm = false;


  editingBudgetId:
    | string
    | null = null;


  deletingBudget:
    | Budget
    | null = null;


  form: BudgetForm =
    this.getEmptyForm();


  /* =======================================================
     CONSTRUCTOR
     ======================================================= */

  constructor(
    private readonly http: HttpClient,

    private readonly cdr: ChangeDetectorRef,
  ) {}


  /* =======================================================
     INIT
     ======================================================= */

  ngOnInit(): void {

    console.log(
      'Budget page initialized.'
    );

    this.loadDepartments();

    this.loadBudgets();
  }


  /* =======================================================
     EMPTY FORM
     ======================================================= */

  private getEmptyForm(): BudgetForm {

    return {

      financialYear:
        '2026-27',

      periodType:
        'Annual',

      quarter:
        null,

      departmentId:
        '',

      project:
        '',

      allocatedAmount:
        null,

      allocationDate:
        '2026-04-01',

      description:
        '',

      status:
        'Active',
    };
  }


  /* =======================================================
     LOAD DEPARTMENTS
     ======================================================= */

  loadDepartments(): void {

    this.departmentsLoading =
      true;

    this.http
      .get<DepartmentResponse>(
        this.departmentsApi
      )
      .pipe(
        finalize(() => {

          this.departmentsLoading =
            false;

          this.cdr.detectChanges();

        })
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Departments API response:',
            response
          );

          this.departments =
            response?.departments || [];

          console.log(
            'Departments loaded:',
            this.departments
          );

          this.cdr.detectChanges();
        },

        error: (error) => {

          console.error(
            'Failed to load departments:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to load departments.';

          this.cdr.detectChanges();
        },

      });
  }


  /* =======================================================
     LOAD BUDGETS
     ======================================================= */

  loadBudgets(): void {

    console.log(
      'Loading budgets from:',
      this.budgetsApi
    );


    this.loading =
      true;

    this.errorMessage =
      '';


    this.cdr.detectChanges();


    this.http
      .get<BudgetResponse>(
        this.budgetsApi
      )
      .pipe(

        finalize(() => {

          /*
           * This ALWAYS runs after the HTTP request
           * finishes, whether success or error.
           */

          this.loading =
            false;

          console.log(
            'Budget loading finished.'
          );

          this.cdr.detectChanges();

        })

      )
      .subscribe({

        next: (response) => {

          console.log(
            'FULL BUDGET API RESPONSE:',
            response
          );


          if (
            response &&
            Array.isArray(
              response.budgets
            )
          ) {

            this.budgets =
              response.budgets;

          } else {

            console.warn(
              'Unexpected budget API response:',
              response
            );

            this.budgets =
              [];
          }


          console.log(
            'Budgets loaded:',
            this.budgets
          );


          console.log(
            'Budget count:',
            this.budgets.length
          );


          /*
           * Force Angular to immediately
           * update the screen.
           */

          this.loading =
            false;

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'FAILED TO LOAD BUDGETS:',
            error
          );


          this.budgets =
            [];


          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Unable to load budgets.';


          this.loading =
            false;


          this.cdr.detectChanges();

        },

      });
  }


  /* =======================================================
     CREATE FORM
     ======================================================= */

  openCreateForm(): void {

    this.editingBudgetId =
      null;

    this.form =
      this.getEmptyForm();

    this.errorMessage =
      '';

    this.successMessage =
      '';

    this.showForm =
      true;

    this.scrollToForm();
  }


  /* =======================================================
     EDIT FORM
     ======================================================= */

  openEditForm(
    budget: Budget
  ): void {

    this.editingBudgetId =
      budget._id;


    this.form = {

      financialYear:
        budget.financialYear,

      periodType:
        budget.periodType,

      quarter:
        budget.quarter,

      departmentId:
        budget.departmentId?._id ||
        '',

      project:
        budget.project,

      allocatedAmount:
        budget.allocatedAmount,

      allocationDate:
        this.formatDateForInput(
          budget.allocationDate
        ),

      description:
        budget.description ||
        '',

      status:
        budget.status,
    };


    this.errorMessage =
      '';

    this.successMessage =
      '';

    this.showForm =
      true;

    this.scrollToForm();
  }


  /* =======================================================
     CLOSE FORM
     ======================================================= */

  closeForm(): void {

    if (this.submitting) {
      return;
    }


    this.showForm =
      false;

    this.editingBudgetId =
      null;

    this.form =
      this.getEmptyForm();

    this.errorMessage =
      '';

    this.cdr.detectChanges();
  }


  /* =======================================================
     PERIOD CHANGE
     ======================================================= */

  onPeriodTypeChange(): void {

    if (
      this.form.periodType ===
      'Annual'
    ) {

      this.form.quarter =
        null;
    }

    this.cdr.detectChanges();
  }


  /* =======================================================
     SUBMIT BUDGET
     ======================================================= */

  submitBudget(): void {

    this.errorMessage =
      '';

    this.successMessage =
      '';


    /* -----------------------------------------------------
       VALIDATION
       ----------------------------------------------------- */

    if (
      !this.form.financialYear.trim()
    ) {

      this.errorMessage =
        'Financial year is required.';

      return;
    }


    if (
      !this.form.departmentId
    ) {

      this.errorMessage =
        'Please select a department.';

      return;
    }


    if (
      !this.form.project.trim()
    ) {

      this.errorMessage =
        'Project name is required.';

      return;
    }


    if (
      this.form.allocatedAmount ===
        null ||
      this.form.allocatedAmount <=
        0
    ) {

      this.errorMessage =
        'Allocated amount must be greater than zero.';

      return;
    }


    if (
      !this.form.allocationDate
    ) {

      this.errorMessage =
        'Allocation date is required.';

      return;
    }


    if (
      this.form.periodType ===
        'Quarterly' &&
      !this.form.quarter
    ) {

      this.errorMessage =
        'Please select a quarter.';

      return;
    }


    if (
      this.form.periodType ===
      'Annual'
    ) {

      this.form.quarter =
        null;
    }


    /* -----------------------------------------------------
       PAYLOAD
       ----------------------------------------------------- */

    const payload: BudgetPayload = {

      financialYear:
        this.form.financialYear.trim(),

      periodType:
        this.form.periodType,

      quarter:
        this.form.quarter,

      departmentId:
        this.form.departmentId,

      project:
        this.form.project.trim(),

      allocatedAmount:
        Number(
          this.form.allocatedAmount
        ),

      allocationDate:
        this.form.allocationDate,

      description:
        this.form.description.trim(),

      status:
        this.form.status,
    };


    this.submitting =
      true;


    /* -----------------------------------------------------
       UPDATE
       ----------------------------------------------------- */

    if (
      this.editingBudgetId
    ) {

      this.updateBudget(
        this.editingBudgetId,
        payload
      );

      return;
    }


    /* -----------------------------------------------------
       CREATE
       ----------------------------------------------------- */

    this.createBudget(
      payload
    );
  }


  /* =======================================================
     CREATE BUDGET
     ======================================================= */

  private createBudget(
    payload: BudgetPayload
  ): void {

    this.http
      .post(
        this.budgetsApi,
        payload
      )
      .pipe(
        finalize(() => {

          this.submitting =
            false;

          this.cdr.detectChanges();

        })
      )
      .subscribe({

        next: (response: unknown) => {

          console.log(
            'Budget created:',
            response
          );


          /*
           * Close the create popup ONLY
           * after the backend confirms success.
           */

          this.showForm =
            false;

          this.editingBudgetId =
            null;

          this.successMessage =
            'Budget created successfully.';

          this.errorMessage =
            '';

          this.form =
            this.getEmptyForm();


          /*
           * Refresh the register so the
           * newly-created budget appears.
           */

          this.loadBudgets();

          this.scrollToTop();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Create budget error:',
            error
          );


          /*
           * Keep the popup open when
           * creation fails.
           */

          this.showForm =
            true;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Failed to create budget.';

          this.successMessage =
            '';

          this.cdr.detectChanges();

        },

      });
  }


  /* =======================================================
     UPDATE BUDGET
     ======================================================= */

  private updateBudget(
    budgetId: string,
    payload: BudgetPayload
  ): void {

    this.http
      .put(
        `${this.budgetsApi}/${budgetId}`,
        payload
      )
      .pipe(
        finalize(() => {

          this.submitting =
            false;

          this.cdr.detectChanges();

        })
      )
      .subscribe({

        next: (response: unknown) => {

          console.log(
            'Budget updated:',
            response
          );


          /*
           * Close the edit popup ONLY
           * after the backend confirms success.
           */

          this.showForm =
            false;

          this.editingBudgetId =
            null;

          this.successMessage =
            'Budget updated successfully.';

          this.errorMessage =
            '';

          this.form =
            this.getEmptyForm();


          /*
           * Refresh the register so the
           * updated budget appears immediately.
           */

          this.loadBudgets();

          this.scrollToTop();

          this.cdr.detectChanges();

        },


        error: (error) => {

          console.error(
            'Update budget error:',
            error
          );


          /*
           * Keep the popup open when
           * updating fails.
           */

          this.showForm =
            true;

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Failed to update budget.';

          this.successMessage =
            '';

          this.cdr.detectChanges();

        },

      });
  }


  /* =======================================================
     DELETE BUDGET
     ======================================================= */

  deleteBudget(
    budget: Budget
  ): void {

    this.errorMessage =
      '';

    this.successMessage =
      '';

    this.deletingBudget =
      budget;

    this.cdr.detectChanges();
  }


  /* =======================================================
     CANCEL DELETE
     ======================================================= */

  cancelDeleteBudget(): void {

    if (this.deleting) {
      return;
    }

    this.deletingBudget =
      null;

    this.cdr.detectChanges();
  }


  /* =======================================================
     CONFIRM DELETE
     ======================================================= */

  confirmDeleteBudget(): void {

    if (
      !this.deletingBudget ||
      this.deleting
    ) {

      return;
    }


    const budgetId =
      this.deletingBudget._id;


    this.deleting =
      true;

    this.errorMessage =
      '';

    this.successMessage =
      '';


    this.http
      .delete(
        `${this.budgetsApi}/${budgetId}`
      )
      .subscribe({

        next: () => {

          this.deleting =
            false;

          this.deletingBudget =
            null;

          this.successMessage =
            'Budget deleted successfully.';


          this.loadBudgets();

          this.cdr.detectChanges();
        },


        error: (error) => {

          console.error(
            'Delete budget error:',
            error
          );


          this.deleting =
            false;


          this.errorMessage =
            error?.error?.message ||
            'Failed to delete budget.';


          this.cdr.detectChanges();
        },

      });
  }


  /* =======================================================
     FORMAT CURRENCY
     ======================================================= */

  formatCurrency(
    amount: number
  ): string {

    if (
      amount === null ||
      amount === undefined
    ) {

      return '₹0';
    }


    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',

        currency: 'INR',

        maximumFractionDigits: 0,
      }
    ).format(amount);
  }


  /* =======================================================
     FORMAT DATE
     ======================================================= */

  formatDate(
    date: string
  ): string {

    if (!date) {
      return '—';
    }


    return new Intl.DateTimeFormat(
      'en-IN',
      {
        day: '2-digit',

        month: 'short',

        year: 'numeric',
      }
    ).format(
      new Date(date)
    );
  }


  /* =======================================================
     DATE FOR INPUT
     ======================================================= */

  private formatDateForInput(
    date: string
  ): string {

    if (!date) {
      return '';
    }


    const parsed =
      new Date(date);


    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {

      return '';
    }


    const year =
      parsed.getFullYear();


    const month =
      String(
        parsed.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    const day =
      String(
        parsed.getDate()
      ).padStart(
        2,
        '0'
      );


    return `${year}-${month}-${day}`;
  }


  /* =======================================================
     STATUS COUNT
     ======================================================= */

  getBudgetCountByStatus(
    status:
      | 'Active'
      | 'Closed'
  ): number {

    return this.budgets.filter(
      budget =>
        budget.status ===
        status
    ).length;
  }


  /* =======================================================
     TOTAL ALLOCATED
     ======================================================= */

  getTotalAllocated(): number {

    return this.budgets.reduce(
      (
        total,
        budget
      ) => {

        return (
          total +
          Number(
            budget.allocatedAmount ||
            0
          )
        );

      },
      0
    );
  }


  /* =======================================================
     TRACK BY
     ======================================================= */

  trackByBudgetId(
    index: number,
    budget: Budget
  ): string {

    return budget._id;
  }


  /* =======================================================
     SCROLL TO FORM
     ======================================================= */

  private scrollToForm(): void {

    setTimeout(() => {

      const formElement =
        document.querySelector(
          '.budget-form-panel'
        );


      formElement?.scrollIntoView({
        behavior: 'smooth',

        block: 'start',
      });

    }, 50);
  }


  /* =======================================================
     SCROLL TO TOP
     ======================================================= */

  private scrollToTop(): void {

    setTimeout(() => {

      window.scrollTo({

        top: 0,

        behavior: 'smooth',
      });

    }, 50);
  }

}