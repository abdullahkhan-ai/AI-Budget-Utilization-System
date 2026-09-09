import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';


export interface Expenditure {

  _id?: string;

  transactionId: string;

  budgetId: string;

  amountSpent: number;

  expenseCategory: string;

  date: string;

  supportingDocumentReference?: string;

  supportingDocument?: {

    originalName: string;

    fileName: string;

    fileUrl?: string;

    mimeType: string;

    size: number;

  };

  createdAt?: string;

  updatedAt?: string;

}


export interface ExpenditureResponse {

  expenditures: Expenditure[];

}


export interface ExpenditureCreateResponse {

  message: string;

  expenditure: Expenditure;

}


export interface BudgetDepartment {

  _id: string;

  name: string;

  code: string;

}


export interface Budget {

  _id: string;

  financialYear: string;

  departmentId: BudgetDepartment | null;

  project: string;

  allocatedAmount: number;

  allocationDate: string;

}


export interface BudgetResponse {

  budgets: Budget[];

}


@Injectable({
  providedIn: 'root',
})


export class ExpenditureService {

  private readonly http =
    inject(HttpClient);


  private readonly apiUrl =
    'http://localhost:5000/api/expenditures';


  private readonly budgetApiUrl =
    'http://localhost:5000/api/budgets';


  getExpenditures():
    Observable<ExpenditureResponse> {

    return this.http.get<ExpenditureResponse>(
      this.apiUrl
    );

  }


  getBudgets():
    Observable<BudgetResponse> {

    return this.http.get<BudgetResponse>(
      this.budgetApiUrl
    );

  }


  createExpenditure(
    formData: FormData
  ):
    Observable<ExpenditureCreateResponse> {

    return this.http.post<ExpenditureCreateResponse>(
      this.apiUrl,
      formData
    );

  }


  updateExpenditure(
    id: string,
    formData: FormData
  ):
    Observable<ExpenditureCreateResponse> {

    return this.http.put<ExpenditureCreateResponse>(
      `${this.apiUrl}/${id}`,
      formData
    );

  }


  deleteExpenditure(
    id: string
  ):
    Observable<{
      message: string;
    }> {

    return this.http.delete<{
      message: string;
    }>(
      `${this.apiUrl}/${id}`
    );

  }

}