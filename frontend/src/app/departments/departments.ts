import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormsModule,
  NgForm,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';

interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DepartmentResponse {
  message: string;
  department: Department;
}

interface DepartmentListResponse {
  departments: Department[];
}

@Component({
  selector: 'app-departments',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
  ],

  templateUrl: './departments.html',
  styleUrl: './departments.css',
})
export class Departments implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly apiUrl =
    'http://localhost:5000/api/departments';

  departments: Department[] = [];

  loading = true;
  submitting = false;
  deleting = false;

  showForm = false;
  showDeleteModal = false;

  isEditMode = false;

  selectedDepartment: Department | null = null;

  errorMessage = '';
  successMessage = '';

  form = {
    name: '',
    code: '',
    description: '',
  };

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http
      .get<DepartmentListResponse>(this.apiUrl)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response) => {
          this.departments =
            Array.isArray(response?.departments)
              ? response.departments
              : [];

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error(
            'Department loading failed:',
            error
          );

          this.departments = [];

          this.errorMessage =
            error?.error?.message ||
            'Unable to load departments.';

          this.cdr.detectChanges();
        },
      });
  }

  openCreateForm(): void {
    this.clearMessages();

    this.isEditMode = false;
    this.selectedDepartment = null;

    this.form = {
      name: '',
      code: '',
      description: '',
    };

    this.showForm = true;
  }

  openEditForm(
    department: Department
  ): void {
    this.clearMessages();

    this.isEditMode = true;
    this.selectedDepartment = department;

    this.form = {
      name: department.name || '',
      code: department.code || '',
      description:
        department.description || '',
    };

    this.showForm = true;
  }

  closeForm(): void {
    if (this.submitting) {
      return;
    }

    this.showForm = false;
    this.selectedDepartment = null;
    this.isEditMode = false;

    this.form = {
      name: '',
      code: '',
      description: '',
    };
  }

  submitDepartment(form: NgForm): void {
    this.clearMessages();

    if (form.invalid) {
      this.errorMessage =
        'Department name and code are required.';

      return;
    }

    const name = this.form.name.trim();
    const code = this.form.code.trim().toUpperCase();
    const description =
      this.form.description.trim();

    if (!name || !code) {
      this.errorMessage =
        'Department name and code are required.';

      return;
    }

    this.submitting = true;

    const payload = {
      name,
      code,
      description,
    };

    const request$ =
      this.isEditMode &&
      this.selectedDepartment
        ? this.http.put<DepartmentResponse>(
            `${this.apiUrl}/${this.selectedDepartment._id}`,
            payload
          )
        : this.http.post<DepartmentResponse>(
            this.apiUrl,
            payload
          );

    request$
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
            (
              this.isEditMode
                ? 'Department updated successfully.'
                : 'Department created successfully.'
            );

          this.showForm = false;
          this.selectedDepartment = null;
          this.isEditMode = false;

          this.form = {
            name: '',
            code: '',
            description: '',
          };

          this.loadDepartments();
        },

        error: (error) => {
          console.error(
            'Department save failed:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            (
              this.isEditMode
                ? 'Unable to update department.'
                : 'Unable to create department.'
            );

          this.cdr.detectChanges();
        },
      });
  }

  openDeleteModal(
    department: Department
  ): void {
    this.clearMessages();

    this.selectedDepartment = department;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (this.deleting) {
      return;
    }

    this.showDeleteModal = false;
    this.selectedDepartment = null;
  }

  confirmDelete(): void {
    if (
      !this.selectedDepartment ||
      this.deleting
    ) {
      return;
    }

    this.deleting = true;
    this.clearMessages();

    const departmentId =
      this.selectedDepartment._id;

    this.http
      .delete<{
        message: string;
      }>(
        `${this.apiUrl}/${departmentId}`
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
            'Department deleted successfully.';

          this.showDeleteModal = false;
          this.selectedDepartment = null;

          this.loadDepartments();
        },

        error: (error) => {
          console.error(
            'Department deletion failed:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to delete department.';

          this.showDeleteModal = false;
          this.selectedDepartment = null;

          this.cdr.detectChanges();
        },
      });
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  trackByDepartmentId(
    _index: number,
    department: Department
  ): string {
    return department._id;
  }
}