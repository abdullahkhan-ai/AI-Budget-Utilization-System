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
  HttpClient,
} from '@angular/common/http';

import {
  finalize,
} from 'rxjs';

import ExcelJS from 'exceljs';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


interface ReportSummary {
  totalBudgets: number;
  totalAllocated: number;
  totalExpenditure: number;
  totalRemaining: number;
  overallUtilizationPercentage: number;
  totalExpenditures: number;
}


interface ReportDepartment {
  _id?: string;
  departmentId?: string;

  departmentName: string;
  departmentCode: string;

  allocatedAmount: number;
  expenditureAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  budgetCount: number;
}


interface ReportBudget {
  budgetId: string;

  financialYear: string;

  department?: {
    _id: string;
    name: string;
    code: string;
  } | null;

  project: string;

  allocatedAmount: number;
  expenditureAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  expenditureCount: number;
}


interface ReportExpenditure {
  _id?: string;

  transactionId: string;
  budgetId: string;

  amountSpent: number;
  expenseCategory: string;

  date: string;

  supportingDocumentReference?: string;
}


interface ReportsResponse {
  summary: ReportSummary;
  budgets: ReportBudget[];
  departments: ReportDepartment[];
  expenditures: ReportExpenditure[];
}


@Component({
  selector: 'app-reports',

  standalone: true,

  imports: [
    CommonModule,
  ],

  templateUrl: './reports.html',

  styleUrl: './reports.css',
})
export class Reports implements OnInit {

  private readonly http =
    inject(HttpClient);

  private readonly cdr =
    inject(ChangeDetectorRef);

  private readonly apiUrl =
    'https://ai-budget-utilization-system.onrender.com/api/reports';


  summary: ReportSummary = {
    totalBudgets: 0,
    totalAllocated: 0,
    totalExpenditure: 0,
    totalRemaining: 0,
    overallUtilizationPercentage: 0,
    totalExpenditures: 0,
  };


  budgets: ReportBudget[] = [];

  departments: ReportDepartment[] = [];

  expenditures: ReportExpenditure[] = [];


  loading = true;

  errorMessage = '';


  activeSection:
    | 'overview'
    | 'budgets'
    | 'departments'
    | 'expenditures' =
    'overview';


  exportMenuOpen = false;

  exporting = false;


  ngOnInit(): void {
    this.loadReports();
  }


  /* =========================
     LOAD REPORT
     ========================= */

  loadReports(): void {

    this.loading = true;

    this.errorMessage = '';

    this.http
      .get<ReportsResponse>(
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

          this.summary =
            response.summary ??
            this.summary;

          this.budgets =
            response.budgets ??
            [];

          this.departments =
            response.departments ??
            [];

          this.expenditures =
            response.expenditures ??
            [];

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Reports loading error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Failed to load reports.';

          this.cdr.detectChanges();

        },

      });
  }


  /* =========================
     SECTION
     ========================= */

  setSection(
    section:
      | 'overview'
      | 'budgets'
      | 'departments'
      | 'expenditures'
  ): void {

    this.activeSection =
      section;

  }


  /* =========================
     EXPORT MENU
     ========================= */

  toggleExportMenu(): void {

    if (this.exporting) {
      return;
    }

    this.exportMenuOpen =
      !this.exportMenuOpen;
  }


  closeExportMenu(): void {

    this.exportMenuOpen =
      false;
  }


  /* =========================
     PDF EXPORT
     ========================= */

  async exportPDF(): Promise<void> {

    if (this.exporting) {
      return;
    }

    this.exportMenuOpen =
      false;

    this.exporting = true;

    this.cdr.detectChanges();

    try {

      const pdf =
        new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });


      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();


      const leftMargin = 14;

      const rightMargin = 14;


      /*
       * HEADER
       */

      pdf.setFont(
        'helvetica',
        'bold'
      );

      pdf.setFontSize(20);

      pdf.setTextColor(
        20,
        20,
        20
      );

      pdf.text(
        'BUDGET MONITORING REPORT',
        leftMargin,
        18
      );


      pdf.setFont(
        'helvetica',
        'normal'
      );

      pdf.setFontSize(9);

      pdf.setTextColor(
        90,
        90,
        90
      );

      pdf.text(
        'AI-Based Budget Utilization Monitoring System',
        leftMargin,
        25
      );


      const generatedDate =
        new Date().toLocaleDateString(
          'en-IN',
          {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }
        );


      pdf.text(
        `Generated: ${generatedDate}`,
        pageWidth - rightMargin,
        18,
        {
          align: 'right',
        }
      );


      /*
       * HEADER LINE
       */

      pdf.setDrawColor(
        25,
        25,
        25
      );

      pdf.setLineWidth(0.6);

      pdf.line(
        leftMargin,
        30,
        pageWidth - rightMargin,
        30
      );


      /*
       * SUMMARY TITLE
       */

      pdf.setFont(
        'helvetica',
        'bold'
      );

      pdf.setFontSize(12);

      pdf.setTextColor(
        20,
        20,
        20
      );

      pdf.text(
        'Financial Summary',
        leftMargin,
        40
      );


      /*
       * SUMMARY DATA
       *
       * Use ASCII "INR" instead of
       * the rupee symbol so jsPDF's
       * standard font cannot produce
       * missing-glyph squares.
       */

      const summaryY = 48;

      const cardWidth =
        (pageWidth -
          leftMargin -
          rightMargin -
          18) /
        4;


      const summaryCards = [

        {
          label: 'TOTAL ALLOCATED',
          value:
            this.formatPdfCurrency(
              this.summary.totalAllocated
            ),
        },

        {
          label: 'TOTAL EXPENDITURE',
          value:
            this.formatPdfCurrency(
              this.summary.totalExpenditure
            ),
        },

        {
          label: 'TOTAL REMAINING',
          value:
            this.formatPdfCurrency(
              this.summary.totalRemaining
            ),
        },

        {
          label: 'OVERALL UTILIZATION',
          value:
            this.formatPercentage(
              this.summary
                .overallUtilizationPercentage
            ),
        },

      ];


      summaryCards.forEach(
        (card, index) => {

          const x =
            leftMargin +
            index *
              (cardWidth + 6);


          pdf.setFillColor(
            248,
            248,
            248
          );

          pdf.setDrawColor(
            35,
            35,
            35
          );

          pdf.setLineWidth(0.4);

          pdf.roundedRect(
            x,
            summaryY,
            cardWidth,
            25,
            2,
            2,
            'FD'
          );


          pdf.setFont(
            'helvetica',
            'bold'
          );

          pdf.setFontSize(7);

          pdf.setTextColor(
            95,
            95,
            95
          );

          pdf.text(
            card.label,
            x + 5,
            summaryY + 7
          );


          pdf.setFontSize(13);

          pdf.setTextColor(
            20,
            20,
            20
          );

          pdf.text(
            card.value,
            x + 5,
            summaryY + 18
          );

        }
      );


      /*
       * BUDGET REPORT
       */

      let currentY =
        summaryY + 35;


      pdf.setFont(
        'helvetica',
        'bold'
      );

      pdf.setFontSize(12);

      pdf.setTextColor(
        20,
        20,
        20
      );

      pdf.text(
        'Budget Utilization Report',
        leftMargin,
        currentY
      );


      currentY += 5;


      const budgetRows =
        this.budgets.map(
          (budget) => [

            budget.financialYear || '—',

            this.getDepartmentName(
              budget.department
            ),

            budget.project || '—',

            this.formatPdfCurrency(
              budget.allocatedAmount
            ),

            this.formatPdfCurrency(
              budget.expenditureAmount
            ),

            this.formatPdfCurrency(
              budget.remainingAmount
            ),

            this.formatPercentage(
              budget.utilizationPercentage
            ),

            String(
              budget.expenditureCount || 0
            ),

          ]
        );


      autoTable(
        pdf,
        {
          startY: currentY,

          head: [[
            'Financial Year',
            'Department',
            'Project',
            'Allocated',
            'Expenditure',
            'Remaining',
            'Utilization',
            'Transactions',
          ]],

          body: budgetRows,

          theme: 'grid',

          styles: {
            font: 'helvetica',
            fontSize: 7.5,
            cellPadding: 3,

            textColor: [
              35,
              35,
              35,
            ],

            lineColor: [
              210,
              210,
              210,
            ],

            lineWidth: 0.2,
          },

          headStyles: {
            font: 'helvetica',
            fontStyle: 'bold',

            fontSize: 7.5,

            textColor: [
              255,
              255,
              255,
            ],

            fillColor: [
              35,
              35,
              35,
            ],

            lineColor: [
              35,
              35,
              35,
            ],
          },

          alternateRowStyles: {
            fillColor: [
              248,
              248,
              248,
            ],
          },

          margin: {
            left: leftMargin,
            right: rightMargin,
          },

          tableWidth: 'auto',

          didDrawPage: (
            data
          ) => {

            this.drawPdfFooter(
              pdf,
              pageWidth,
              pageHeight
            );

          },
        }
      );


      /*
       * DEPARTMENT REPORT
       */

      currentY =
        (
          pdf as any
        ).lastAutoTable.finalY +
        14;


      if (
        currentY >
        pageHeight - 45
      ) {

        pdf.addPage();

        currentY = 18;

      }


      pdf.setFont(
        'helvetica',
        'bold'
      );

      pdf.setFontSize(12);

      pdf.setTextColor(
        20,
        20,
        20
      );

      pdf.text(
        'Department Utilization Report',
        leftMargin,
        currentY
      );


      currentY += 5;


      const departmentRows =
        this.departments.map(
          (department) => [

            department.departmentName ||
              '—',

            department.departmentCode ||
              '—',

            String(
              department.budgetCount || 0
            ),

            this.formatPdfCurrency(
              department.allocatedAmount
            ),

            this.formatPdfCurrency(
              department.expenditureAmount
            ),

            this.formatPdfCurrency(
              department.remainingAmount
            ),

            this.formatPercentage(
              department.utilizationPercentage
            ),

          ]
        );


      autoTable(
        pdf,
        {
          startY: currentY,

          head: [[
            'Department',
            'Code',
            'Budgets',
            'Allocated',
            'Expenditure',
            'Remaining',
            'Utilization',
          ]],

          body: departmentRows,

          theme: 'grid',

          styles: {
            font: 'helvetica',
            fontSize: 7.5,
            cellPadding: 3,

            textColor: [
              35,
              35,
              35,
            ],

            lineColor: [
              210,
              210,
              210,
            ],

            lineWidth: 0.2,
          },

          headStyles: {
            font: 'helvetica',
            fontStyle: 'bold',

            fontSize: 7.5,

            textColor: [
              255,
              255,
              255,
            ],

            fillColor: [
              35,
              35,
              35,
            ],
          },

          alternateRowStyles: {
            fillColor: [
              248,
              248,
              248,
            ],
          },

          margin: {
            left: leftMargin,
            right: rightMargin,
          },

          didDrawPage: () => {

            this.drawPdfFooter(
              pdf,
              pageWidth,
              pageHeight
            );

          },
        }
      );


      /*
       * EXPENDITURE REPORT
       */

      currentY =
        (
          pdf as any
        ).lastAutoTable.finalY +
        14;


      if (
        currentY >
        pageHeight - 50
      ) {

        pdf.addPage();

        currentY = 18;

      }


      pdf.setFont(
        'helvetica',
        'bold'
      );

      pdf.setFontSize(12);

      pdf.setTextColor(
        20,
        20,
        20
      );

      pdf.text(
        'Expenditure Report',
        leftMargin,
        currentY
      );


      currentY += 5;


      const expenditureRows =
        this.expenditures.map(
          (expenditure) => [

            expenditure.transactionId ||
              '—',

            this.shortText(
              expenditure.budgetId,
              18
            ),

            expenditure.expenseCategory ||
              '—',

            this.formatDate(
              expenditure.date
            ),

            this.formatPdfCurrency(
              expenditure.amountSpent
            ),

            expenditure
              .supportingDocumentReference ||
              '—',

          ]
        );


      autoTable(
        pdf,
        {
          startY: currentY,

          head: [[
            'Transaction ID',
            'Budget ID',
            'Category',
            'Date',
            'Amount',
            'Document Reference',
          ]],

          body: expenditureRows,

          theme: 'grid',

          styles: {
            font: 'helvetica',
            fontSize: 7.5,
            cellPadding: 3,

            textColor: [
              35,
              35,
              35,
            ],

            lineColor: [
              210,
              210,
              210,
            ],

            lineWidth: 0.2,
          },

          headStyles: {
            font: 'helvetica',
            fontStyle: 'bold',

            fontSize: 7.5,

            textColor: [
              255,
              255,
              255,
            ],

            fillColor: [
              35,
              35,
              35,
            ],
          },

          alternateRowStyles: {
            fillColor: [
              248,
              248,
              248,
            ],
          },

          margin: {
            left: leftMargin,
            right: rightMargin,
          },

          didDrawPage: () => {

            this.drawPdfFooter(
              pdf,
              pageWidth,
              pageHeight
            );

          },
        }
      );


      /*
       * FINAL SAVE
       */

      const filename =
        `Budget-Monitoring-Report-${this.getFileDate()}.pdf`;


      pdf.save(filename);

    } catch (error) {

      console.error(
        'PDF export error:',
        error
      );

      this.errorMessage =
        'Unable to generate PDF report.';

    } finally {

      this.exporting = false;

      this.cdr.detectChanges();

    }

  }


  /* =========================
     EXCEL EXPORT
     ========================= */

  async exportExcel(): Promise<void> {

    if (this.exporting) {
      return;
    }

    this.exportMenuOpen =
      false;

    this.exporting = true;

    this.cdr.detectChanges();


    try {

      const workbook =
        new ExcelJS.Workbook();


      workbook.creator =
        'AI-Based Budget Utilization Monitoring System';

      workbook.lastModifiedBy =
        'Budget Monitor';

      workbook.created =
        new Date();

      workbook.modified =
        new Date();


      /*
       * SUMMARY SHEET
       */

      const summarySheet =
        workbook.addWorksheet(
          'Summary'
        );


      summarySheet.views = [
        {
          state: 'frozen',
          ySplit: 4,
        },
      ];


      summarySheet.columns = [

        {
          header: 'Metric',
          key: 'metric',
          width: 30,
        },

        {
          header: 'Value',
          key: 'value',
          width: 28,
        },

      ];


      this.styleExcelTitle(
        summarySheet,
        'BUDGET MONITORING REPORT',
        2
      );


      summarySheet.getRow(3).values = [
        'Generated',
        new Date(),
      ];


      summarySheet.getRow(3).getCell(2)
        .numFmt =
        'dd mmmm yyyy';


      const summaryRows = [

        [
          'Total Budgets',
          this.summary.totalBudgets,
        ],

        [
          'Total Allocated',
          this.summary.totalAllocated,
        ],

        [
          'Total Expenditure',
          this.summary.totalExpenditure,
        ],

        [
          'Total Remaining',
          this.summary.totalRemaining,
        ],

        [
          'Overall Utilization',
          this.summary
            .overallUtilizationPercentage /
          100,
        ],

        [
          'Total Expenditure Transactions',
          this.summary.totalExpenditures,
        ],

      ];


      summaryRows.forEach(
        (row) => {

          const excelRow =
            summarySheet.addRow(
              row
            );


          excelRow.getCell(1)
            .font = {
              bold: true,
            };


          if (
            typeof row[1] ===
            'number'
          ) {

            if (
              row[0] ===
              'Overall Utilization'
            ) {

              excelRow.getCell(2)
                .numFmt =
                '0.00%';

            } else if (
              row[0] ===
                'Total Allocated' ||
              row[0] ===
                'Total Expenditure' ||
              row[0] ===
                'Total Remaining'
            ) {

              excelRow.getCell(2)
                .numFmt =
                '"INR " #,##0.00';

            }

          }

        }
      );


      this.styleExcelHeader(
        summarySheet,
        2
      );


      /*
       * BUDGET SHEET
       */

      const budgetSheet =
        workbook.addWorksheet(
          'Budget Report'
        );


      budgetSheet.views = [
        {
          state: 'frozen',
          ySplit: 1,
        },
      ];


      budgetSheet.columns = [

        {
          header: 'Financial Year',
          key: 'financialYear',
          width: 18,
        },

        {
          header: 'Department',
          key: 'department',
          width: 26,
        },

        {
          header: 'Department Code',
          key: 'departmentCode',
          width: 18,
        },

        {
          header: 'Project',
          key: 'project',
          width: 32,
        },

        {
          header: 'Allocated Amount',
          key: 'allocated',
          width: 20,
        },

        {
          header: 'Expenditure',
          key: 'expenditure',
          width: 20,
        },

        {
          header: 'Remaining',
          key: 'remaining',
          width: 20,
        },

        {
          header: 'Utilization',
          key: 'utilization',
          width: 16,
        },

        {
          header: 'Transactions',
          key: 'transactions',
          width: 15,
        },

      ];


      this.budgets.forEach(
        (budget) => {

          const row =
            budgetSheet.addRow({

              financialYear:
                budget.financialYear,

              department:
                this.getDepartmentName(
                  budget.department
                ),

              departmentCode:
                this.getDepartmentCode(
                  budget.department
                ),

              project:
                budget.project,

              allocated:
                budget.allocatedAmount,

              expenditure:
                budget.expenditureAmount,

              remaining:
                budget.remainingAmount,

              utilization:
                budget
                  .utilizationPercentage /
                100,

              transactions:
                budget.expenditureCount,

            });


          this.formatExcelCurrency(
            row.getCell(5)
          );

          this.formatExcelCurrency(
            row.getCell(6)
          );

          this.formatExcelCurrency(
            row.getCell(7)
          );

          row.getCell(8)
            .numFmt =
            '0.00%';

        }
      );


      this.styleExcelHeader(
        budgetSheet,
        1
      );

      this.addExcelAutoFilter(
        budgetSheet
      );


      /*
       * DEPARTMENT SHEET
       */

      const departmentSheet =
        workbook.addWorksheet(
          'Department Report'
        );


      departmentSheet.views = [
        {
          state: 'frozen',
          ySplit: 1,
        },
      ];


      departmentSheet.columns = [

        {
          header: 'Department',
          key: 'department',
          width: 30,
        },

        {
          header: 'Code',
          key: 'code',
          width: 16,
        },

        {
          header: 'Budgets',
          key: 'budgets',
          width: 14,
        },

        {
          header: 'Allocated Amount',
          key: 'allocated',
          width: 20,
        },

        {
          header: 'Expenditure',
          key: 'expenditure',
          width: 20,
        },

        {
          header: 'Remaining',
          key: 'remaining',
          width: 20,
        },

        {
          header: 'Utilization',
          key: 'utilization',
          width: 16,
        },

      ];


      this.departments.forEach(
        (department) => {

          const row =
            departmentSheet.addRow({

              department:
                department.departmentName,

              code:
                department.departmentCode,

              budgets:
                department.budgetCount,

              allocated:
                department.allocatedAmount,

              expenditure:
                department.expenditureAmount,

              remaining:
                department.remainingAmount,

              utilization:
                department
                  .utilizationPercentage /
                100,

            });


          this.formatExcelCurrency(
            row.getCell(4)
          );

          this.formatExcelCurrency(
            row.getCell(5)
          );

          this.formatExcelCurrency(
            row.getCell(6)
          );

          row.getCell(7)
            .numFmt =
            '0.00%';

        }
      );


      this.styleExcelHeader(
        departmentSheet,
        1
      );

      this.addExcelAutoFilter(
        departmentSheet
      );


      /*
       * EXPENDITURE SHEET
       */

      const expenditureSheet =
        workbook.addWorksheet(
          'Expenditure Report'
        );


      expenditureSheet.views = [
        {
          state: 'frozen',
          ySplit: 1,
        },
      ];


      expenditureSheet.columns = [

        {
          header: 'Transaction ID',
          key: 'transactionId',
          width: 22,
        },

        {
          header: 'Budget ID',
          key: 'budgetId',
          width: 28,
        },

        {
          header: 'Expense Category',
          key: 'category',
          width: 24,
        },

        {
          header: 'Date',
          key: 'date',
          width: 18,
        },

        {
          header: 'Amount Spent',
          key: 'amount',
          width: 20,
        },

        {
          header: 'Supporting Document Reference',
          key: 'reference',
          width: 35,
        },

      ];


      this.expenditures.forEach(
        (expenditure) => {

          const row =
            expenditureSheet.addRow({

              transactionId:
                expenditure.transactionId,

              budgetId:
                expenditure.budgetId,

              category:
                expenditure.expenseCategory,

              date:
                expenditure.date
                  ? new Date(
                      expenditure.date
                    )
                  : null,

              amount:
                expenditure.amountSpent,

              reference:
                expenditure
                  .supportingDocumentReference ||
                '',

            });


          row.getCell(4)
            .numFmt =
            'dd mmm yyyy';

          this.formatExcelCurrency(
            row.getCell(5)
          );

        }
      );


      this.styleExcelHeader(
        expenditureSheet,
        1
      );

      this.addExcelAutoFilter(
        expenditureSheet
      );


      /*
       * DOWNLOAD EXCEL
       */

      const buffer =
        await workbook.xlsx.writeBuffer();


      const blob =
        new Blob(
          [
            buffer,
          ],
          {
            type:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }
        );


      const url =
        window.URL.createObjectURL(
          blob
        );


      const anchor =
        document.createElement(
          'a'
        );


      anchor.href = url;

      anchor.download =
        `Budget-Monitoring-Report-${this.getFileDate()}.xlsx`;


      document.body.appendChild(
        anchor
      );

      anchor.click();

      document.body.removeChild(
        anchor
      );

      window.URL.revokeObjectURL(
        url
      );


    } catch (error) {

      console.error(
        'Excel export error:',
        error
      );

      this.errorMessage =
        'Unable to generate Excel report.';

    } finally {

      this.exporting = false;

      this.cdr.detectChanges();

    }

  }


  /* =========================
     CSV EXPORT
     ========================= */

  exportCSV(): void {

    if (this.exporting) {
      return;
    }

    this.exportMenuOpen = false;
    this.exporting = true;
    this.cdr.detectChanges();

    try {
      const rows: string[][] = [
        [
          'Transaction ID',
          'Budget ID',
          'Expense Category',
          'Date',
          'Amount Spent',
          'Supporting Document Reference',
        ],
      ];

      this.expenditures.forEach((expenditure) => {
        rows.push([
          expenditure.transactionId || '',
          expenditure.budgetId || '',
          expenditure.expenseCategory || '',
          expenditure.date ? this.formatDate(expenditure.date) : '',
          String(Number(expenditure.amountSpent || 0)),
          expenditure.supportingDocumentReference || '',
        ]);
      });

      const csv = rows
        .map((row) =>
          row
            .map((value) => {
              const text = String(value ?? '');
              return `"${text.replace(/"/g, '""')}"`;
            })
            .join(',')
        )
        .join('\r\n');

      const blob = new Blob([csv], {
        type: 'text/csv;charset=utf-8;',
      });

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');

      anchor.href = url;
      anchor.download =
        `Budget-Monitoring-Expenditures-${this.getFileDate()}.csv`;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      window.URL.revokeObjectURL(url);

    } catch (error) {

      console.error(
        'CSV export error:',
        error
      );

      this.errorMessage =
        'Unable to generate CSV report.';

    } finally {

      this.exporting = false;
      this.cdr.detectChanges();

    }
  }


  /* =========================
     EXCEL HELPERS
     ========================= */

  private styleExcelTitle(
    sheet: ExcelJS.Worksheet,
    title: string,
    rowNumber: number
  ): void {

    sheet.mergeCells(
      `A${rowNumber}:B${rowNumber}`
    );


    const cell =
      sheet.getCell(
        `A${rowNumber}`
      );


    cell.value =
      title;


    cell.font = {
      name: 'Arial',
      size: 16,
      bold: true,
    };


    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
    };


    sheet.getRow(
      rowNumber
    ).height = 28;

  }


  private styleExcelHeader(
    sheet: ExcelJS.Worksheet,
    rowNumber: number
  ): void {

    const row =
      sheet.getRow(
        rowNumber
      );


    row.height = 24;


    row.eachCell(
      (cell) => {

        cell.font = {
          name: 'Arial',
          size: 10,
          bold: true,
        };


        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
        };


        cell.border = {
          top: {
            style: 'thin',
          },

          bottom: {
            style: 'thin',
          },

          left: {
            style: 'thin',
          },

          right: {
            style: 'thin',
          },
        };

      }
    );

  }


  private formatExcelCurrency(
    cell: ExcelJS.Cell
  ): void {

    cell.numFmt =
      '"INR " #,##0.00';


    cell.alignment = {
      horizontal: 'right',
    };

  }


  private addExcelAutoFilter(
    sheet: ExcelJS.Worksheet
  ): void {

    const lastColumn =
      sheet.columnCount;


    const lastColumnLetter =
      this.getExcelColumnLetter(
        lastColumn
      );


    sheet.autoFilter = {
      from: 'A1',
      to: `${lastColumnLetter}1`,
    };

  }


  private getExcelColumnLetter(
    columnNumber: number
  ): string {

    let result = '';

    let number =
      columnNumber;


    while (
      number > 0
    ) {

      const remainder =
        (number - 1) %
        26;

      result =
        String.fromCharCode(
          65 + remainder
        ) +
        result;

      number =
        Math.floor(
          (number - 1) /
          26
        );

    }

    return result;

  }


  /* =========================
     PDF HELPERS
     ========================= */

  private drawPdfFooter(
    pdf: jsPDF,
    pageWidth: number,
    pageHeight: number
  ): void {

    const pageNumber =
      pdf.getNumberOfPages();


    pdf.setFont(
      'helvetica',
      'normal'
    );

    pdf.setFontSize(7);

    pdf.setTextColor(
      110,
      110,
      110
    );


    pdf.text(
      'AI-Based Budget Utilization Monitoring System',
      14,
      pageHeight - 8
    );


    pdf.text(
      `Page ${pageNumber}`,
      pageWidth - 14,
      pageHeight - 8,
      {
        align: 'right',
      }
    );

  }


  private formatPdfCurrency(
    value: number
  ): string {

    const number =
      Number(value || 0);


    return `INR ${new Intl.NumberFormat(
      'en-IN',
      {
        maximumFractionDigits: 0,
      }
    ).format(number)}`;

  }


  private shortText(
    value: string,
    maxLength: number
  ): string {

    if (!value) {
      return '—';
    }


    if (
      value.length <=
      maxLength
    ) {

      return value;

    }


    return (
      value.substring(
        0,
        maxLength - 3
      ) +
      '...'
    );

  }


  /* =========================
     GENERAL HELPERS
     ========================= */

  get utilizationClass(): string {

    const utilization =
      this.summary
        .overallUtilizationPercentage;


    if (
      utilization >= 100
    ) {

      return 'critical';

    }


    if (
      utilization >= 80
    ) {

      return 'high';

    }


    if (
      utilization >= 40
    ) {

      return 'normal';

    }


    return 'low';

  }


  getBudgetUtilizationClass(
    utilization: number
  ): string {

    if (
      utilization >= 100
    ) {

      return 'critical';

    }


    if (
      utilization >= 80
    ) {

      return 'high';

    }


    if (
      utilization >= 40
    ) {

      return 'normal';

    }


    return 'low';

  }


  formatCurrency(
    value: number
  ): string {

    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }
    ).format(
      value || 0
    );

  }


  formatPercentage(
    value: number
  ): string {

    return `${Number(
      value || 0
    ).toFixed(2)}%`;

  }


  formatDate(
    value: string
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


  getDepartmentName(
    department:
      ReportBudget['department']
  ): string {

    return (
      department?.name ||
      '—'
    );

  }


  getDepartmentCode(
    department:
      ReportBudget['department']
  ): string {

    return (
      department?.code ||
      '—'
    );

  }


  getBudgetCount(): number {

    return this.budgets.length;

  }


  getDepartmentCount(): number {

    return this.departments.length;

  }


  getExpenditureCount(): number {

    return this.expenditures.length;

  }


  trackBudget(
    index: number,
    budget: ReportBudget
  ): string {

    return (
      budget.budgetId ||
      String(index)
    );

  }


  trackDepartment(
    index: number,
    department: ReportDepartment
  ): string {

    return (
      department.departmentId ||
      department._id ||
      String(index)
    );

  }


  trackExpenditure(
    index: number,
    expenditure: ReportExpenditure
  ): string {

    return (
      expenditure._id ||
      expenditure.transactionId ||
      String(index)
    );

  }


  private getFileDate(): string {

    const date =
      new Date();


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

}