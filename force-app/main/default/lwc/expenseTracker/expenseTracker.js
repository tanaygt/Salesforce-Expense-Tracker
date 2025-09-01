import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createExpense from '@salesforce/apex/ExpenseController.createExpense';
import getExpenses from '@salesforce/apex/ExpenseController.getExpenses';
import deleteExpense from '@salesforce/apex/ExpenseController.deleteExpense';

const CATS = ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Health', 'Misc'];

export default class ExpenseTracker extends LightningElement {
  @track expenses = [];
  @track form = { id:null, amount:null, category:'Food', date:this.defaultDate(), note:'' };
  @track filters = { search:'', category:'', month:'' };

  budget = 10000;

  get categoryOptions() { return CATS.map(c => ({ label:c, value:c })); }

  connectedCallback() {
    this.loadExpenses();
    this.loadBudgetFromStorage();
  }

  // ---- Load from server ----
  loadExpenses() {
    getExpenses()
      .then(data => {
        this.expenses = data.map(e => ({
          id: e.Id,
          amount: e.Amount__c,
          category: e.Category__c,
          date: e.Date__c,
          note: e.Notes__c
        }));
      })
      .catch(err => this.toast('Error', err.body.message, 'error'));
  }

  // ---- Helpers ----
  defaultDate() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ---- Form Handlers ----
  handleAmount(e){ this.form = { ...this.form, amount:e.target.value }; }
  handleCategory(e){ this.form = { ...this.form, category:e.target.value }; }
  handleDate(e){ this.form = { ...this.form, date:e.target.value }; }
  handleNote(e){ this.form = { ...this.form, note:e.target.value }; }

  resetForm(){ this.form = { id:null, amount:null, category:'Food', date:this.defaultDate(), note:'' }; }

  handleSubmit(){
    const { amount, category, date, note } = this.form;
    if (!amount) return this.toast('Validation', 'Enter amount', 'warning');
    createExpense({ amount, category, date, Notes__c:note })
      .then(() => {
        this.toast('Success', 'Expense saved', 'success');
        this.loadExpenses();
        this.resetForm();
      })
      .catch(err => this.toast('Error', err.body.message, 'error'));
  }

  // ---- Delete ----
  handleDelete(event){
    const id = event.target.dataset.id;
    deleteExpense({ expenseId:id })
      .then(() => {
        this.toast('Deleted', 'Expense removed', 'success');
        this.loadExpenses();
      })
      .catch(err => this.toast('Error', err.body.message, 'error'));
  }

  // ---- Budget ----
  handleBudget(e){ this.budget = Number(e.target.value||0); }
  saveBudget(){ localStorage.setItem('expense_budget', String(this.budget)); this.toast('Success','Budget saved','success'); }
  loadBudgetFromStorage(){ const b = localStorage.getItem('expense_budget'); if(b) this.budget = Number(b); }

  // ---- Toast ----
  toast(title, message, variant){ this.dispatchEvent(new ShowToastEvent({ title, message, variant })); }
}
