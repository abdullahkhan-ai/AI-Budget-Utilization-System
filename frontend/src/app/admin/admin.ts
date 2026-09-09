import {
  CommonModule,
} from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
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


interface Department {
  _id: string;
  name: string;
  code: string;
}


interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: Department | null;
  createdAt?: string;
}


interface AuditLog {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  createdAt: string;
}


interface ThresholdConfig {
  _id?: string;
  key?: string;
  underUtilizationThreshold: number;
  highUtilizationThreshold: number;
  criticalUtilizationThreshold: number;
  spendingSpikeThreshold: number;
  underUtilizationTimeThreshold: number;
  createdAt?: string;
  updatedAt?: string;
}


@Component({
  selector: 'app-admin',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
  ],

  templateUrl: './admin.html',
  styleUrl: './admin.css',
})


export class Admin implements OnInit {

  private readonly http =
    inject(HttpClient);

  private readonly cdr =
    inject(ChangeDetectorRef);


  private readonly usersApi =
    'https://ai-budget-utilization-system.onrender.com/api/users';

  private readonly auditApi =
    'https://ai-budget-utilization-system.onrender.com/api/audit-logs';

  private readonly departmentsApi =
    'https://ai-budget-utilization-system.onrender.com/api/departments';

  private readonly thresholdsApi =
    'https://ai-budget-utilization-system.onrender.com/api/thresholds';


  users: User[] = [];

  auditLogs: AuditLog[] = [];

  departments: Department[] = [];


  loadingUsers = true;

  loadingAuditLogs = true;

  loadingDepartments = true;

  loadingThresholds = true;

  savingThresholds = false;


  errorMessage = '';

  successMessage = '';


  activeSection:
    | 'users'
    | 'audit'
    | 'thresholds' =
    'users';


  searchTerm = '';


  editModalOpen = false;

  deleteModalOpen = false;


  selectedUser:
    User | null = null;


  editForm = {
    name: '',
    email: '',
    password: '',
    role: 'Department Head',
    departmentId: '',
  };


  thresholdForm: ThresholdConfig = {
    underUtilizationThreshold: 40,
    highUtilizationThreshold: 80,
    criticalUtilizationThreshold: 100,
    spendingSpikeThreshold: 50,
    underUtilizationTimeThreshold: 70,
  };


  savingUser = false;

  deletingUser = false;


  ngOnInit(): void {

    this.loadUsers();

    this.loadAuditLogs();

    this.loadDepartments();

    this.loadThresholds();

  }


  /* =========================
     DATA LOADING
     ========================= */


  loadUsers(): void {

    this.loadingUsers = true;

    this.http
      .get<{
        count: number;
        users: User[];
      }>(this.usersApi)

      .pipe(
        finalize(() => {

          this.loadingUsers = false;

          this.cdr.detectChanges();

        })
      )

      .subscribe({

        next: (response) => {

          this.users =
            response.users || [];

        },

        error: (error) => {

          console.error(
            'Users loading error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Failed to load users.';

        },

      });

  }


  loadAuditLogs(): void {

    this.loadingAuditLogs = true;

    this.http
      .get<{
        count: number;
        auditLogs: AuditLog[];
      }>(this.auditApi)

      .pipe(
        finalize(() => {

          this.loadingAuditLogs =
            false;

          this.cdr.detectChanges();

        })
      )

      .subscribe({

        next: (response) => {

          this.auditLogs =
            response.auditLogs || [];

        },

        error: (error) => {

          console.error(
            'Audit logs loading error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Failed to load audit logs.';

        },

      });

  }


  loadDepartments(): void {

    this.loadingDepartments =
      true;

    this.http
      .get<{
        count: number;
        departments: Department[];
      }>(this.departmentsApi)

      .pipe(
        finalize(() => {

          this.loadingDepartments =
            false;

          this.cdr.detectChanges();

        })
      )

      .subscribe({

        next: (response) => {

          this.departments =
            response.departments || [];

        },

        error: (error) => {

          console.error(
            'Departments loading error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Failed to load departments.';

        },

      });

  }


  loadThresholds(): void {

    this.loadingThresholds =
      true;

    this.http
      .get<{
        thresholds: ThresholdConfig;
      }>(this.thresholdsApi)

      .pipe(
        finalize(() => {

          this.loadingThresholds =
            false;

          this.cdr.detectChanges();

        })
      )

      .subscribe({

        next: (response) => {

          if (response.thresholds) {

            this.thresholdForm = {
              underUtilizationThreshold:
                Number(
                  response.thresholds
                    .underUtilizationThreshold
                ),

              highUtilizationThreshold:
                Number(
                  response.thresholds
                    .highUtilizationThreshold
                ),

              criticalUtilizationThreshold:
                Number(
                  response.thresholds
                    .criticalUtilizationThreshold
                ),

              spendingSpikeThreshold:
                Number(
                  response.thresholds
                    .spendingSpikeThreshold
                ),

              underUtilizationTimeThreshold:
                Number(
                  response.thresholds
                    .underUtilizationTimeThreshold
                ),
            };

          }

        },

        error: (error) => {

          console.error(
            'Threshold loading error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Failed to load threshold configuration.';

        },

      });

  }


  /* =========================
     SECTION
     ========================= */


  setSection(
    section:
      | 'users'
      | 'audit'
      | 'thresholds'
  ): void {

    this.activeSection =
      section;

    this.clearMessages();

  }


  /* =========================
     USER SEARCH
     ========================= */


  get filteredUsers(): User[] {

    const search =
      this.searchTerm
        .trim()
        .toLowerCase();

    if (!search) {

      return this.users;

    }

    return this.users.filter(
      (user) =>
        user.name
          ?.toLowerCase()
          .includes(search) ||

        user.email
          ?.toLowerCase()
          .includes(search) ||

        user.role
          ?.toLowerCase()
          .includes(search) ||

        user.departmentId?.name
          ?.toLowerCase()
          .includes(search) ||

        user.departmentId?.code
          ?.toLowerCase()
          .includes(search)
    );

  }


  /* =========================
     EDIT USER
     ========================= */


  openEditModal(
    user: User
  ): void {

    this.clearMessages();

    this.selectedUser =
      user;

    this.editForm = {

      name:
        user.name || '',

      email:
        user.email || '',

      password:
        '',

      role:
        user.role ||
        'Department Head',

      departmentId:
        user.departmentId?._id ||
        '',

    };

    this.editModalOpen =
      true;

  }


  closeEditModal(): void {

    if (this.savingUser) {

      return;

    }

    this.editModalOpen =
      false;

    this.selectedUser =
      null;

  }


  saveUser(): void {

    if (
      !this.selectedUser ||
      this.savingUser
    ) {

      return;

    }

    this.clearMessages();


    if (
      !this.editForm.name.trim()
    ) {

      this.errorMessage =
        'Name is required.';

      return;

    }


    if (
      !this.editForm.email.trim()
    ) {

      this.errorMessage =
        'Email is required.';

      return;

    }


    this.savingUser =
      true;


    const payload: any = {

      name:
        this.editForm.name.trim(),

      email:
        this.editForm.email.trim(),

      role:
        this.editForm.role,

      departmentId:
        this.editForm.departmentId ||
        null,

    };


    if (
      this.editForm.password.trim()
    ) {

      payload.password =
        this.editForm.password.trim();

    }


    this.http
      .put<{
        message: string;
        user: User;
      }>(
        `${this.usersApi}/${this.selectedUser._id}`,
        payload
      )

      .pipe(
        finalize(() => {

          this.savingUser =
            false;

          this.cdr.detectChanges();

        })
      )

      .subscribe({

        next: (response) => {

          this.editModalOpen =
            false;

          this.selectedUser =
            null;

          this.successMessage =
            response.message ||
            'User updated successfully.';

          this.loadUsers();

          this.loadAuditLogs();

        },

        error: (error) => {

          console.error(
            'User update error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Failed to update user.';

        },

      });

  }


  /* =========================
     DELETE USER
     ========================= */


  openDeleteModal(
    user: User
  ): void {

    this.clearMessages();

    this.selectedUser =
      user;

    this.deleteModalOpen =
      true;

  }


  closeDeleteModal(): void {

    if (this.deletingUser) {

      return;

    }

    this.deleteModalOpen =
      false;

    this.selectedUser =
      null;

  }


  deleteUser(): void {

    if (
      !this.selectedUser ||
      this.deletingUser
    ) {

      return;

    }

    this.clearMessages();

    this.deletingUser =
      true;


    this.http
      .delete<{
        message: string;
      }>(
        `${this.usersApi}/${this.selectedUser._id}`
      )

      .pipe(
        finalize(() => {

          this.deletingUser =
            false;

          this.cdr.detectChanges();

        })
      )

      .subscribe({

        next: (response) => {

          this.deleteModalOpen =
            false;

          this.successMessage =
            response.message ||
            'User deleted successfully.';

          this.selectedUser =
            null;

          this.loadUsers();

          this.loadAuditLogs();

        },

        error: (error) => {

          console.error(
            'User delete error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Failed to delete user.';

        },

      });

  }


  /* =========================
     THRESHOLD CONFIGURATION
     ========================= */


  saveThresholds(): void {

    if (this.savingThresholds) {

      return;

    }

    this.clearMessages();


    const values = [
      this.thresholdForm
        .underUtilizationThreshold,

      this.thresholdForm
        .highUtilizationThreshold,

      this.thresholdForm
        .criticalUtilizationThreshold,

      this.thresholdForm
        .spendingSpikeThreshold,

      this.thresholdForm
        .underUtilizationTimeThreshold,
    ];


    const invalidValue =
      values.some(
        (value) =>
          value === null ||
          value === undefined ||
          !Number.isFinite(
            Number(value)
          ) ||
          Number(value) < 0 ||
          Number(value) > 100
      );


    if (invalidValue) {

      this.errorMessage =
        'All threshold values must be between 0 and 100.';

      return;

    }


    if (
      Number(
        this.thresholdForm
          .underUtilizationThreshold
      ) >=
      Number(
        this.thresholdForm
          .highUtilizationThreshold
      )
    ) {

      this.errorMessage =
        'Under-utilization threshold must be lower than high utilization threshold.';

      return;

    }


    if (
      Number(
        this.thresholdForm
          .highUtilizationThreshold
      ) >=
      Number(
        this.thresholdForm
          .criticalUtilizationThreshold
      )
    ) {

      this.errorMessage =
        'High utilization threshold must be lower than critical utilization threshold.';

      return;

    }


    const payload = {

      underUtilizationThreshold:
        Number(
          this.thresholdForm
            .underUtilizationThreshold
        ),

      highUtilizationThreshold:
        Number(
          this.thresholdForm
            .highUtilizationThreshold
        ),

      criticalUtilizationThreshold:
        Number(
          this.thresholdForm
            .criticalUtilizationThreshold
        ),

      spendingSpikeThreshold:
        Number(
          this.thresholdForm
            .spendingSpikeThreshold
        ),

      underUtilizationTimeThreshold:
        Number(
          this.thresholdForm
            .underUtilizationTimeThreshold
        ),

    };


    this.savingThresholds =
      true;


    this.http
      .put<{
        message: string;
        thresholds: ThresholdConfig;
      }>(
        this.thresholdsApi,
        payload
      )

      .pipe(
        finalize(() => {

          this.savingThresholds =
            false;

          this.cdr.detectChanges();

        })
      )

      .subscribe({

        next: (response) => {

          if (response.thresholds) {

            this.thresholdForm = {
              underUtilizationThreshold:
                Number(
                  response.thresholds
                    .underUtilizationThreshold
                ),

              highUtilizationThreshold:
                Number(
                  response.thresholds
                    .highUtilizationThreshold
                ),

              criticalUtilizationThreshold:
                Number(
                  response.thresholds
                    .criticalUtilizationThreshold
                ),

              spendingSpikeThreshold:
                Number(
                  response.thresholds
                    .spendingSpikeThreshold
                ),

              underUtilizationTimeThreshold:
                Number(
                  response.thresholds
                    .underUtilizationTimeThreshold
                ),
            };

          }


          this.successMessage =
            response.message ||
            'Threshold configuration updated successfully.';

          this.loadAuditLogs();

        },

        error: (error) => {

          console.error(
            'Threshold update error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Failed to update threshold configuration.';

        },

      });

  }


  /* =========================
     REFRESH
     ========================= */


  refresh(): void {

    this.clearMessages();

    this.loadUsers();

    this.loadAuditLogs();

    this.loadDepartments();

    this.loadThresholds();

  }


  /* =========================
     HELPERS
     ========================= */


  getDepartmentName(
    user: User
  ): string {

    return (
      user.departmentId?.name ||
      'Unassigned'
    );

  }


  getDepartmentCode(
    user: User
  ): string {

    return (
      user.departmentId?.code ||
      '—'
    );

  }


  getRoleClass(
    role: string
  ): string {

    return (
      role ||
      'Department Head'
    )
      .toLowerCase()
      .replace(/\s+/g, '-');

  }


  getActionClass(
    action: string
  ): string {

    return (
      action ||
      'UNKNOWN'
    )
      .toLowerCase();

  }


  formatDate(
    value?: string
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

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );

  }


  formatDateTime(
    value?: string
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

    return date.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );

  }


  trackUser(
    index: number,
    user: User
  ): string {

    return (
      user._id ||
      String(index)
    );

  }


  trackAuditLog(
    index: number,
    log: AuditLog
  ): string {

    return (
      log._id ||
      String(index)
    );

  }


  clearMessages(): void {

    this.errorMessage = '';

    this.successMessage = '';

  }

}