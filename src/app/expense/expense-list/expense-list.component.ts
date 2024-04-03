import { Component } from '@angular/core';
import { addMonths, set } from 'date-fns';
import { InfiniteScrollCustomEvent, ModalController, RefresherCustomEvent } from '@ionic/angular';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';
import { Expense, ExpenseCriteria } from '../../shared/domain';
import { FormBuilder, FormGroup } from '@angular/forms';
import { formatPeriod } from '../../shared/period';
import { finalize, from, groupBy, mergeMap, toArray } from 'rxjs';
import { ExpensesService } from '../expenses.service';
import { CategoryService } from '../../category/category.service';
import { ToastService } from '../../shared/service/toast.service';

interface ExpenseGroup {
  date: string;
  expenses: Expense[];
}

@Component({
  selector: 'app-expense-overview',
  templateUrl: './expense-list.component.html',
})
export class ExpenseListComponent {
  expenseGroups: ExpenseGroup[] | null = null;
  expenses: Expense[] | null = null;
  date = set(new Date(), { date: 1 });
  readonly initialSort = 'name,asc';
  searchCriteria: ExpenseCriteria = { page: 0, size: 25, sort: this.initialSort };
  loading = false;
  lastPageReached = false;
  private searchFormSubscription: any;

  constructor(
    private readonly modalCtrl: ModalController,
    private readonly expenseService: ExpensesService,
    private readonly categoryService: CategoryService,
    private readonly toastService: ToastService,
  ) {}

  addMonths = (number: number): void => {
    this.date = addMonths(this.date, number);
  };
  searchForm: FormGroup | undefined;

  async openModal(expense?: Expense): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: { expense: expense ? { ...expense } : {} },
    });
    modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'refresh') this.reloadExpenses();
  }
  private loadExpenses(next: () => void = () => {}): void {
    this.searchCriteria.yearMonth = formatPeriod(this.date);
    if (!this.searchCriteria.categoryIds?.length) delete this.searchCriteria.categoryIds;
    if (!this.searchCriteria.name) delete this.searchCriteria.name;
    this.loading = true;
    this.expenseService
      .getExpenses(this.searchCriteria)
      .pipe(
        mergeMap((expensePage) => {
          this.lastPageReached = expensePage.last;
          next();
          this.loading = false;
          if (this.searchCriteria.page === 0 || this.expenseGroups) this.expenseGroups = [];
          return from(expensePage.content).pipe(
            groupBy((expense) => expense.date),
            mergeMap((group) => group.pipe(toArray())),
          );
        }),
      )
      .subscribe({
        next: (expenses: Expense[]) => {
          const expenseGroup: ExpenseGroup = {
            date: expenses[0].date,
            expenses: this.sortExpenses(expenses),
          };
          const expenseGroupWithSameDate = this.expenseGroups!.find((other) => other.date === expenseGroup.date);
          if (!expenseGroupWithSameDate) this.expenseGroups!.push(expenseGroup);
          else
            expenseGroupWithSameDate.expenses = this.sortExpenses([
              ...expenseGroupWithSameDate.expenses,
              ...expenseGroup.expenses,
            ]);
        },
        error: (error) => {
          this.toastService.displayErrorToast('Could not load expenses', error);
          this.loading = false;
        },
      });
  }

  ionViewDidEnter(): void {
    this.loadExpenses();
  }

  loadNextExpensePage($event: any) {
    this.searchCriteria.page++;
    this.loadExpenses(() => ($event as InfiniteScrollCustomEvent).target.complete());
  }
  reloadExpenses($event?: any): void {
    this.searchCriteria.page = 0;
    this.loadExpenses(() => ($event ? ($event as RefresherCustomEvent).target.complete() : {}));
  }
  private sortExpenses = (expenses: Expense[]): Expense[] => expenses.sort((a, b) => a.name.localeCompare(b.name));
}
