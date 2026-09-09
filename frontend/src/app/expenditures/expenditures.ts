import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormsModule,
  NgForm,
} from '@angular/forms';

import { finalize } from 'rxjs';

import {
  Expenditure,
  ExpenditureService,
} from '../core/services/expenditure.service';


interface BudgetDepartment {
  _id: string;
  name: string;
  code: string;
}


interface Budget {
  _id: string;
  financialYear: string;
  departmentId: BudgetDepartment | null;
  project: string;
  allocatedAmount: number;
  allocationDate: string;
}


interface ExpenditureForm {
  budgetId: string;
  amountSpent: number | null;
  expenseCategory: string;
  date: string;
  supportingDocumentReference: string;
}


@Component({
  selector: 'app-expenditures',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
  ],

  templateUrl: './expenditures.html',

  styleUrl: './expenditures.css',
})
export class Expenditures implements OnInit {

  private readonly expenditureService =
    inject(ExpenditureService);

  private readonly cdr =
    inject(ChangeDetectorRef);


  private readonly backendUrl =
    'https://ai-budget-utilization-system.onrender.com';


  expenditures: Expenditure[] = [];

  budgets: Budget[] = [];


  loading = true;

  budgetsLoading = true;

  submitting = false;

  deleting = false;


  errorMessage = '';

  successMessage = '';

  formErrorMessage = '';


  showForm = false;

  showDeleteModal = false;


  editingExpenditure:
    Expenditure | null = null;


  expenditureToDelete:
    Expenditure | null = null;


  selectedFile:
    File | null = null;


  selectedFileName = '';


  form: ExpenditureForm =
    this.getEmptyForm();


  readonly categories = [
    'Infrastructure',
    'Salaries',
    'Operations',
    'Procurement',
    'Services',
    'Other',
  ];


  ngOnInit(): void {

    this.loadBudgets();

    this.loadExpenditures();

  }


  private getEmptyForm():
    ExpenditureForm {

    return {

      budgetId: '',

      amountSpent: null,

      expenseCategory: '',

      date: '',

      supportingDocumentReference: '',
    };
  }


  loadBudgets(): void {

    this.budgetsLoading = true;


    this.expenditureService
      .getBudgets()

      .pipe(

        finalize(() => {

          this.budgetsLoading = false;

          this.cdr.detectChanges();

        })

      )

      .subscribe({

        next: (response) => {

          this.budgets =
            Array.isArray(
              response?.budgets
            )
              ? response.budgets
              : [];

        },


        error: (error) => {

          console.error(
            'Budget loading failed:',
            error
          );


          this.formErrorMessage =
            error?.error?.message ||
            'Unable to load approved budgets.';
        },

      });
  }


  loadExpenditures(): void {

    this.loading = true;

    this.errorMessage = '';


    this.expenditureService
      .getExpenditures()

      .pipe(

        finalize(() => {

          this.loading = false;

          this.cdr.detectChanges();

        })

      )

      .subscribe({

        next: (response) => {

          this.expenditures =
            Array.isArray(
              response?.expenditures
            )
              ? response.expenditures
              : [];

        },


        error: (error) => {

          console.error(
            'Expenditure loading failed:',
            error
          );


          this.errorMessage =
            error?.error?.message ||
            'Unable to load expenditure records.';
        },

      });
  }


  openCreateForm(): void {

    this.editingExpenditure = null;

    this.form =
      this.getEmptyForm();


    this.clearSelectedFile();


    this.formErrorMessage = '';

    this.successMessage = '';

    this.showForm = true;


    this.cdr.detectChanges();
  }


  openEditForm(
    expenditure: Expenditure
  ): void {

    this.editingExpenditure =
      expenditure;


    this.form = {

      budgetId:
        expenditure.budgetId || '',

      amountSpent:
        Number(
          expenditure.amountSpent || 0
        ),

      expenseCategory:
        expenditure.expenseCategory || '',

      date:
        this.formatDateForInput(
          expenditure.date
        ),

      supportingDocumentReference:
        expenditure.supportingDocumentReference ||
        '',
    };


    this.clearSelectedFile();


    this.formErrorMessage = '';

    this.successMessage = '';

    this.showForm = true;


    this.cdr.detectChanges();
  }


  closeForm(): void {

    if (this.submitting) {
      return;
    }


    this.showForm = false;

    this.editingExpenditure = null;

    this.formErrorMessage = '';

    this.form =
      this.getEmptyForm();


    this.clearSelectedFile();


    this.cdr.detectChanges();
  }


  onFileSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    if (
      !input.files ||
      input.files.length === 0
    ) {

      this.clearSelectedFile();

      return;
    }


    const file =
      input.files[0];


    const allowedExtensions = [
      '.pdf',
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.csv',
      '.jpg',
      '.jpeg',
      '.png',
    ];


    const fileName =
      file.name.toLowerCase();


    const hasAllowedExtension =
      allowedExtensions.some(
        (extension) =>
          fileName.endsWith(
            extension
          )
      );


    if (!hasAllowedExtension) {

      this.formErrorMessage =
        'Unsupported supporting document format.';

      this.clearSelectedFile();

      input.value = '';

      return;
    }


    const maxFileSize =
      10 * 1024 * 1024;


    if (
      file.size >
      maxFileSize
    ) {

      this.formErrorMessage =
        'Supporting document must be 10 MB or smaller.';

      this.clearSelectedFile();

      input.value = '';

      return;
    }


    this.formErrorMessage = '';

    this.selectedFile = file;

    this.selectedFileName =
      file.name;


    this.cdr.detectChanges();
  }


  clearSelectedFile(): void {

    this.selectedFile = null;

    this.selectedFileName = '';
  }


  submitExpenditure(
    form: NgForm
  ): void {

    this.formErrorMessage = '';

    this.successMessage = '';


    if (form.invalid) {

      this.formErrorMessage =
        'Please complete all required fields.';

      return;
    }


    const amount =
      Number(
        this.form.amountSpent
      );


    if (!this.form.budgetId) {

      this.formErrorMessage =
        'Please select a budget.';

      return;
    }


    if (!this.form.expenseCategory) {

      this.formErrorMessage =
        'Please select an expense category.';

      return;
    }


    if (!this.form.date) {

      this.formErrorMessage =
        'Please select the expenditure date.';

      return;
    }


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      this.formErrorMessage =
        'Amount spent must be greater than zero.';

      return;
    }


    const formData =
      new FormData();


    formData.append(
      'budgetId',
      this.form.budgetId
    );


    formData.append(
      'amountSpent',
      String(amount)
    );


    formData.append(
      'expenseCategory',
      this.form.expenseCategory
    );


    formData.append(
      'date',
      this.form.date
    );


    formData.append(
      'supportingDocumentReference',
      this.form.supportingDocumentReference.trim()
    );


    if (this.selectedFile) {

      formData.append(
        'supportingDocument',
        this.selectedFile
      );
    }


    this.submitting = true;


    if (
      this.editingExpenditure?._id
    ) {

      this.expenditureService
        .updateExpenditure(
          this.editingExpenditure._id,
          formData
        )

        .pipe(

          finalize(() => {

            this.submitting = false;

            this.cdr.detectChanges();

          })

        )

        .subscribe({

          next: (response) => {

            this.successMessage =
              response?.message ||
              'Expenditure updated successfully.';


            this.showForm = false;

            this.editingExpenditure =
              null;


            this.form =
              this.getEmptyForm();


            this.clearSelectedFile();


            form.resetForm();


            this.loadExpenditures();
          },


          error: (error) => {

            console.error(
              'Expenditure update failed:',
              error
            );


            this.formErrorMessage =
              error?.error?.message ||
              'Unable to update expenditure.';
          },

        });


      return;
    }


    this.expenditureService
      .createExpenditure(
        formData
      )

      .pipe(

        finalize(() => {

          this.submitting = false;

          this.cdr.detectChanges();

        })

      )

      .subscribe({

        next: (response) => {

          this.successMessage =
            response?.message ||
            'Expenditure recorded successfully.';


          this.showForm = false;


          this.form =
            this.getEmptyForm();


          this.clearSelectedFile();


          form.resetForm();


          this.loadExpenditures();
        },


        error: (error) => {

          console.error(
            'Expenditure creation failed:',
            error
          );


          this.formErrorMessage =
            error?.error?.message ||
            'Unable to record expenditure.';
        },

      });
  }


  openDeleteModal(
    expenditure: Expenditure
  ): void {

    this.expenditureToDelete =
      expenditure;


    this.showDeleteModal = true;

    this.deleting = false;


    this.cdr.detectChanges();
  }


  closeDeleteModal(): void {

    if (this.deleting) {
      return;
    }


    this.showDeleteModal = false;

    this.expenditureToDelete =
      null;


    this.cdr.detectChanges();
  }


  confirmDelete(): void {

    const expenditure =
      this.expenditureToDelete;


    if (!expenditure?._id) {
      return;
    }


    this.deleting = true;


    this.expenditureService
      .deleteExpenditure(
        expenditure._id
      )

      .pipe(

        finalize(() => {

          this.deleting = false;

          this.cdr.detectChanges();

        })

      )

      .subscribe({

        next: (response) => {

          this.showDeleteModal = false;

          this.expenditureToDelete =
            null;


          this.successMessage =
            response?.message ||
            'Expenditure deleted successfully.';


          this.loadExpenditures();
        },


        error: (error) => {

          console.error(
            'Expenditure deletion failed:',
            error
          );


          this.successMessage = '';


          this.errorMessage =
            error?.error?.message ||
            'Unable to delete expenditure.';
        },

      });
  }


  getBudgetLabel(
    budgetId: string
  ): string {

    const budget =
      this.budgets.find(
        (item) =>
          item._id === budgetId
      );


    if (!budget) {
      return budgetId;
    }


    const department =
      budget.departmentId
        ? `${budget.departmentId.code} — ${budget.departmentId.name}`
        : 'Department not assigned';


    return `${budget.project} · ${department} · ${budget.financialYear}`;
  }


  getBudgetProject(
    budgetId: string
  ): string {

    const budget =
      this.budgets.find(
        (item) =>
          item._id === budgetId
      );


    return (
      budget?.project ||
      '—'
    );
  }


  formatCurrency(
    value:
      number |
      null |
      undefined
  ): string {

    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',

        currency: 'INR',

        maximumFractionDigits: 0,
      }
    ).format(
      Number(
        value || 0
      )
    );
  }


  formatDateForInput(
    value: string
  ): string {

    if (!value) {
      return '';
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return '';
    }


    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      );


    return `${year}-${month}-${day}`;
  }


  get totalExpenditure(): number {

    return this.expenditures.reduce(
      (
        total,
        expenditure
      ) =>
        total +
        Number(
          expenditure.amountSpent ||
          0
        ),
      0
    );
  }


  getDocumentUrl(
    fileUrl:
      string |
      null |
      undefined
  ): string {

    if (!fileUrl) {
      return '';
    }


    if (
      fileUrl.startsWith(
        'http://'
      ) ||
      fileUrl.startsWith(
        'https://'
      )
    ) {

      return fileUrl;
    }


    if (
      fileUrl.startsWith('/')
    ) {

      return `${this.backendUrl}${fileUrl}`;
    }


    return `${this.backendUrl}/${fileUrl}`;
  }


  getDocumentName(
    document:
      string |
      {
        originalName?: string;
        fileName?: string;
        fileUrl?: string;
        mimeType?: string;
        size?: number;
      } |
      null |
      undefined
  ): string {

    if (!document) {
      return 'View document';
    }


    if (
      typeof document === 'string'
    ) {

      return document;
    }


    return (
      document.originalName ||
      document.fileName ||
      'View document'
    );
  }


  trackByExpenditureId(
    index: number,
    expenditure: Expenditure
  ): string {

    return (
      expenditure._id ||
      expenditure.transactionId ||
      String(index)
    );
  }

}