/*
THIS IS A COMPILED FILE. DO NOT EDIT DIRECTLY.
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => BankRegisterPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  accountName: "My Account"
};
var FINANCIALS_FOLDER = "Financials";
var REGISTER_FILE = "Financials/Bank Register.md";
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(amount);
}
function recalcBalances(data) {
  let running = data.startingBalance;
  const sorted = [...data.transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  for (const tx of sorted) {
    if (tx.type === "deposit") {
      running += tx.amount;
    } else {
      running -= tx.amount;
    }
    tx.balance = parseFloat(running.toFixed(2));
  }
  return { ...data, transactions: sorted };
}
function buildMarkdown(data, accountName) {
  const { startingDate, startingBalance, transactions } = data;
  const lines = [
    `# \u{1F3E6} ${accountName} \u2014 Bank Register`,
    "",
    `> **Starting Balance:** ${formatCurrency(startingBalance)}  `,
    `> **As of:** ${startingDate}`,
    "",
    "## Transactions",
    "",
    "| # | Date | Description | Type | Amount | Balance | Note |",
    "|---|------|-------------|------|--------|---------|------|"
  ];
  transactions.forEach((tx, idx) => {
    const sign = tx.type === "deposit" ? "+" : "-";
    const typeEmoji = tx.type === "deposit" ? "\u{1F49A} Deposit" : "\u{1F534} Withdrawal";
    lines.push(
      `| ${idx + 1} | ${tx.date} | ${tx.description} | ${typeEmoji} | ${sign}${formatCurrency(tx.amount)} | ${formatCurrency(tx.balance)} | ${tx.note || ""} |`
    );
  });
  if (transactions.length === 0) {
    lines.push("| \u2014 | \u2014 | No transactions yet | \u2014 | \u2014 | \u2014 | \u2014 |");
  }
  const current = transactions.length > 0 ? transactions[transactions.length - 1].balance : startingBalance;
  lines.push(
    "",
    "---",
    "",
    `**Current Balance: ${formatCurrency(current)}**`,
    "",
    `*Last updated: ${(0, import_obsidian.moment)().format("YYYY-MM-DD HH:mm")}*`,
    "",
    "<!-- bank-register-data",
    JSON.stringify(data),
    "-->"
  );
  return lines.join("\n");
}
function parseMarkdown(content) {
  const match = content.match(
    /<!-- bank-register-data\n([\s\S]*?)\n-->/
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch (e) {
    return null;
  }
}
var BankRegisterPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("landmark", "Open Bank Register", () => {
      this.openRegister();
    });
    this.addCommand({
      id: "open-bank-register",
      name: "Open Bank Register",
      callback: () => this.openRegister()
    });
    this.addSettingTab(new BankRegisterSettingTab(this.app, this));
  }
  async openRegister() {
    const data = await this.loadData_();
    new BankRegisterModal(this.app, this, data).open();
  }
  async loadData_() {
    const file = this.app.vault.getAbstractFileByPath(REGISTER_FILE);
    if (file instanceof import_obsidian.TFile) {
      const content = await this.app.vault.read(file);
      const parsed = parseMarkdown(content);
      if (parsed) return parsed;
    }
    return {
      startingBalance: 0,
      startingDate: (0, import_obsidian.moment)().format("YYYY-MM-DD"),
      transactions: []
    };
  }
  async saveData_(data) {
    const recalced = recalcBalances(data);
    const md = buildMarkdown(recalced, this.settings.accountName);
    const folder = this.app.vault.getAbstractFileByPath(FINANCIALS_FOLDER);
    if (!folder) {
      await this.app.vault.createFolder(FINANCIALS_FOLDER);
    }
    const file = this.app.vault.getAbstractFileByPath(REGISTER_FILE);
    if (file instanceof import_obsidian.TFile) {
      await this.app.vault.modify(file, md);
    } else {
      await this.app.vault.create(REGISTER_FILE, md);
    }
    new import_obsidian.Notice("\u2705 Bank Register saved!");
    return recalced;
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await super.loadData());
  }
  async saveSettings() {
    await super.saveData(this.settings);
  }
};
var BankRegisterModal = class extends import_obsidian.Modal {
  constructor(app, plugin, data) {
    super(app);
    this.editingId = null;
    this.filterType = "all";
    this.sortDesc = true;
    this.plugin = plugin;
    this.data = data;
  }
  onOpen() {
    this.modalEl.addClass("bank-register-modal");
    this.render();
  }
  render() {
    const { contentEl } = this;
    contentEl.empty();
    const header = contentEl.createDiv("br-header");
    header.createEl("h2", { text: `\u{1F3E6} ${this.plugin.settings.accountName}` });
    const currentBalance = this.data.transactions.length > 0 ? this.data.transactions[this.data.transactions.length - 1].balance : this.data.startingBalance;
    const balanceClass = currentBalance >= 0 ? "br-balance-positive" : "br-balance-negative";
    header.createEl("div", {
      text: formatCurrency(currentBalance),
      cls: `br-balance-display ${balanceClass}`
    });
    const startSection = contentEl.createDiv("br-section");
    startSection.createEl("h3", { text: "Starting Balance" });
    const startRow = startSection.createDiv("br-row");
    const startDateInput = startRow.createEl("input", {
      type: "date",
      cls: "br-input"
    });
    startDateInput.value = this.data.startingDate;
    const startBalInput = startRow.createEl("input", {
      type: "number",
      cls: "br-input",
      placeholder: "0.00"
    });
    startBalInput.value = this.data.startingBalance.toString();
    startBalInput.step = "0.01";
    const setStartBtn = startRow.createEl("button", {
      text: "Set",
      cls: "br-btn br-btn-secondary"
    });
    setStartBtn.onclick = async () => {
      const bal = parseFloat(startBalInput.value);
      if (isNaN(bal)) {
        new import_obsidian.Notice("Please enter a valid starting balance.");
        return;
      }
      this.data.startingBalance = parseFloat(bal.toFixed(2));
      this.data.startingDate = startDateInput.value;
      this.data = await this.plugin.saveData_(this.data);
      this.render();
    };
    const txSection = contentEl.createDiv("br-section");
    const isEditing = this.editingId !== null;
    txSection.createEl("h3", {
      text: isEditing ? "\u270F\uFE0F Edit Transaction" : "Add Transaction"
    });
    const editingTx = isEditing ? this.data.transactions.find((t) => t.id === this.editingId) : null;
    const form = txSection.createDiv("br-form");
    const row1 = form.createDiv("br-row");
    const dateInput = row1.createEl("input", {
      type: "date",
      cls: "br-input"
    });
    dateInput.value = editingTx ? editingTx.date : (0, import_obsidian.moment)().format("YYYY-MM-DD");
    const descInput = row1.createEl("input", {
      type: "text",
      cls: "br-input br-input-grow",
      placeholder: "Description"
    });
    descInput.value = editingTx ? editingTx.description : "";
    const row2 = form.createDiv("br-row");
    const typeSelect = row2.createEl("select", {
      cls: "br-select"
    });
    const optDeposit = typeSelect.createEl("option", {
      value: "deposit",
      text: "\u{1F49A} Deposit"
    });
    const optWithdraw = typeSelect.createEl("option", {
      value: "withdrawal",
      text: "\u{1F534} Withdrawal"
    });
    if ((editingTx == null ? void 0 : editingTx.type) === "withdrawal") optWithdraw.selected = true;
    else optDeposit.selected = true;
    const amtInput = row2.createEl("input", {
      type: "number",
      cls: "br-input",
      placeholder: "Amount"
    });
    amtInput.step = "0.01";
    amtInput.min = "0";
    amtInput.value = editingTx ? editingTx.amount.toString() : "";
    const noteInput = row2.createEl("input", {
      type: "text",
      cls: "br-input br-input-grow",
      placeholder: "Note (optional)"
    });
    noteInput.value = editingTx ? editingTx.note : "";
    const row3 = form.createDiv("br-row br-row-end");
    if (isEditing) {
      const cancelBtn = row3.createEl("button", {
        text: "Cancel",
        cls: "br-btn br-btn-ghost"
      });
      cancelBtn.onclick = () => {
        this.editingId = null;
        this.render();
      };
    }
    const saveBtn = row3.createEl("button", {
      text: isEditing ? "Update Transaction" : "Add Transaction",
      cls: "br-btn br-btn-primary"
    });
    saveBtn.onclick = async () => {
      const desc = descInput.value.trim();
      const amt = parseFloat(amtInput.value);
      const type = typeSelect.value;
      const date = dateInput.value;
      const note = noteInput.value.trim();
      if (!desc) {
        new import_obsidian.Notice("Please enter a description.");
        return;
      }
      if (isNaN(amt) || amt <= 0) {
        new import_obsidian.Notice("Please enter a valid amount greater than 0.");
        return;
      }
      if (!date) {
        new import_obsidian.Notice("Please select a date.");
        return;
      }
      if (isEditing && editingTx) {
        editingTx.date = date;
        editingTx.description = desc;
        editingTx.type = type;
        editingTx.amount = parseFloat(amt.toFixed(2));
        editingTx.note = note;
      } else {
        const newTx = {
          id: generateId(),
          date,
          description: desc,
          type,
          amount: parseFloat(amt.toFixed(2)),
          balance: 0,
          note
        };
        this.data.transactions.push(newTx);
      }
      this.editingId = null;
      this.data = await this.plugin.saveData_(this.data);
      this.render();
    };
    const filterBar = contentEl.createDiv("br-filter-bar");
    const filterGroup = filterBar.createDiv("br-filter-group");
    filterGroup.createEl("span", { text: "Filter:", cls: "br-label" });
    const filters = [
      { label: "All", value: "all" },
      { label: "\u{1F49A} Deposits", value: "deposit" },
      { label: "\u{1F534} Withdrawals", value: "withdrawal" }
    ];
    for (const f of filters) {
      const btn = filterGroup.createEl("button", {
        text: f.label,
        cls: `br-filter-btn ${this.filterType === f.value ? "active" : ""}`
      });
      btn.onclick = () => {
        this.filterType = f.value;
        this.render();
      };
    }
    const sortBtn = filterBar.createEl("button", {
      text: this.sortDesc ? "\u2B07 Newest" : "\u2B06 Oldest",
      cls: "br-btn br-btn-ghost br-btn-sm"
    });
    sortBtn.onclick = () => {
      this.sortDesc = !this.sortDesc;
      this.render();
    };
    const listSection = contentEl.createDiv("br-section");
    let txs = [...this.data.transactions];
    if (this.filterType !== "all") {
      txs = txs.filter((t) => t.type === this.filterType);
    }
    if (this.sortDesc) txs = txs.reverse();
    if (txs.length === 0) {
      listSection.createEl("p", {
        text: "No transactions yet. Add one above!",
        cls: "br-empty"
      });
    } else {
      const table = listSection.createEl("table", { cls: "br-table" });
      const thead = table.createEl("thead");
      const headerRow = thead.createEl("tr");
      ["Date", "Description", "Type", "Amount", "Balance", "Note", ""].forEach(
        (h) => headerRow.createEl("th", { text: h })
      );
      const tbody = table.createEl("tbody");
      for (const tx of txs) {
        const tr = tbody.createEl("tr", {
          cls: `br-tx-row ${tx.type}`
        });
        tr.createEl("td", { text: tx.date, cls: "br-td-date" });
        tr.createEl("td", { text: tx.description });
        const typeTd = tr.createEl("td");
        typeTd.createEl("span", {
          text: tx.type === "deposit" ? "Deposit" : "Withdrawal",
          cls: `br-badge ${tx.type}`
        });
        const amtTd = tr.createEl("td", { cls: "br-td-num" });
        amtTd.createEl("span", {
          text: `${tx.type === "deposit" ? "+" : "-"}${formatCurrency(tx.amount)}`,
          cls: tx.type === "deposit" ? "br-pos" : "br-neg"
        });
        tr.createEl("td", {
          text: formatCurrency(tx.balance),
          cls: `br-td-num ${tx.balance < 0 ? "br-neg" : ""}`
        });
        tr.createEl("td", { text: tx.note || "\u2014", cls: "br-td-note" });
        const actionTd = tr.createEl("td", { cls: "br-actions" });
        const editBtn = actionTd.createEl("button", {
          text: "\u270F\uFE0F",
          cls: "br-icon-btn",
          title: "Edit"
        });
        editBtn.onclick = () => {
          this.editingId = tx.id;
          this.render();
        };
        const delBtn = actionTd.createEl("button", {
          text: "\u{1F5D1}\uFE0F",
          cls: "br-icon-btn br-icon-btn-danger",
          title: "Delete"
        });
        delBtn.onclick = async () => {
          if (confirm(`Delete "${tx.description}"?`)) {
            this.data.transactions = this.data.transactions.filter(
              (t) => t.id !== tx.id
            );
            this.data = await this.plugin.saveData_(this.data);
            this.render();
          }
        };
      }
    }
    const summary = contentEl.createDiv("br-summary");
    const deposits = this.data.transactions.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
    const withdrawals = this.data.transactions.filter((t) => t.type === "withdrawal").reduce((s, t) => s + t.amount, 0);
    summary.createEl("div", {
      text: `Total Deposits: ${formatCurrency(deposits)}`,
      cls: "br-sum-item br-pos"
    });
    summary.createEl("div", {
      text: `Total Withdrawals: ${formatCurrency(withdrawals)}`,
      cls: "br-sum-item br-neg"
    });
    summary.createEl("div", {
      text: `Net: ${formatCurrency(deposits - withdrawals)}`,
      cls: "br-sum-item br-sum-net"
    });
    const footerRow = contentEl.createDiv("br-footer");
    const openNoteBtn = footerRow.createEl("button", {
      text: "\u{1F4C4} Open Register Note",
      cls: "br-btn br-btn-ghost"
    });
    openNoteBtn.onclick = async () => {
      const file = this.app.vault.getAbstractFileByPath(REGISTER_FILE);
      if (file instanceof import_obsidian.TFile) {
        this.close();
        await this.app.workspace.getLeaf(true).openFile(file);
      } else {
        new import_obsidian.Notice("Register note not found. Add a transaction first.");
      }
    };
  }
  onClose() {
    this.contentEl.empty();
  }
};
var BankRegisterSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Bank Register Settings" });
    new import_obsidian.Setting(containerEl).setName("Account Name").setDesc("Display name shown in the register header.").addText(
      (text) => text.setPlaceholder("My Account").setValue(this.plugin.settings.accountName).onChange(async (value) => {
        this.plugin.settings.accountName = value || "My Account";
        await this.plugin.saveSettings();
      })
    );
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBNb2RhbCxcbiAgTm90aWNlLFxuICBQbHVnaW4sXG4gIFBsdWdpblNldHRpbmdUYWIsXG4gIFNldHRpbmcsXG4gIFRGaWxlLFxuICBtb21lbnQsXG59IGZyb20gXCJvYnNpZGlhblwiO1xuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgVHlwZXMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmludGVyZmFjZSBUcmFuc2FjdGlvbiB7XG4gIGlkOiBzdHJpbmc7XG4gIGRhdGU6IHN0cmluZztcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgdHlwZTogXCJkZXBvc2l0XCIgfCBcIndpdGhkcmF3YWxcIjtcbiAgYW1vdW50OiBudW1iZXI7XG4gIGJhbGFuY2U6IG51bWJlcjtcbiAgbm90ZTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQmFua1JlZ2lzdGVyRGF0YSB7XG4gIHN0YXJ0aW5nQmFsYW5jZTogbnVtYmVyO1xuICBzdGFydGluZ0RhdGU6IHN0cmluZztcbiAgdHJhbnNhY3Rpb25zOiBUcmFuc2FjdGlvbltdO1xufVxuXG5pbnRlcmZhY2UgQmFua1JlZ2lzdGVyU2V0dGluZ3Mge1xuICBhY2NvdW50TmFtZTogc3RyaW5nO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBCYW5rUmVnaXN0ZXJTZXR0aW5ncyA9IHtcbiAgYWNjb3VudE5hbWU6IFwiTXkgQWNjb3VudFwiLFxufTtcblxuY29uc3QgRklOQU5DSUFMU19GT0xERVIgPSBcIkZpbmFuY2lhbHNcIjtcbmNvbnN0IFJFR0lTVEVSX0ZJTEUgPSBcIkZpbmFuY2lhbHMvQmFuayBSZWdpc3Rlci5tZFwiO1xuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgVXRpbGl0aWVzIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBnZW5lcmF0ZUlkKCk6IHN0cmluZyB7XG4gIHJldHVybiBEYXRlLm5vdygpLnRvU3RyaW5nKDM2KSArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDcpO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRDdXJyZW5jeShhbW91bnQ6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoXCJlbi1VU1wiLCB7XG4gICAgc3R5bGU6IFwiY3VycmVuY3lcIixcbiAgICBjdXJyZW5jeTogXCJVU0RcIixcbiAgICBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDIsXG4gIH0pLmZvcm1hdChhbW91bnQpO1xufVxuXG5mdW5jdGlvbiByZWNhbGNCYWxhbmNlcyhkYXRhOiBCYW5rUmVnaXN0ZXJEYXRhKTogQmFua1JlZ2lzdGVyRGF0YSB7XG4gIGxldCBydW5uaW5nID0gZGF0YS5zdGFydGluZ0JhbGFuY2U7XG4gIGNvbnN0IHNvcnRlZCA9IFsuLi5kYXRhLnRyYW5zYWN0aW9uc10uc29ydChcbiAgICAoYSwgYikgPT4gbmV3IERhdGUoYS5kYXRlKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZShiLmRhdGUpLmdldFRpbWUoKVxuICApO1xuICBmb3IgKGNvbnN0IHR4IG9mIHNvcnRlZCkge1xuICAgIGlmICh0eC50eXBlID09PSBcImRlcG9zaXRcIikge1xuICAgICAgcnVubmluZyArPSB0eC5hbW91bnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJ1bm5pbmcgLT0gdHguYW1vdW50O1xuICAgIH1cbiAgICB0eC5iYWxhbmNlID0gcGFyc2VGbG9hdChydW5uaW5nLnRvRml4ZWQoMikpO1xuICB9XG4gIHJldHVybiB7IC4uLmRhdGEsIHRyYW5zYWN0aW9uczogc29ydGVkIH07XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBNYXJrZG93biBCdWlsZGVyIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5mdW5jdGlvbiBidWlsZE1hcmtkb3duKGRhdGE6IEJhbmtSZWdpc3RlckRhdGEsIGFjY291bnROYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB7IHN0YXJ0aW5nRGF0ZSwgc3RhcnRpbmdCYWxhbmNlLCB0cmFuc2FjdGlvbnMgfSA9IGRhdGE7XG5cbiAgY29uc3QgbGluZXM6IHN0cmluZ1tdID0gW1xuICAgIGAjIFx1RDgzQ1x1REZFNiAke2FjY291bnROYW1lfSBcdTIwMTQgQmFuayBSZWdpc3RlcmAsXG4gICAgXCJcIixcbiAgICBgPiAqKlN0YXJ0aW5nIEJhbGFuY2U6KiogJHtmb3JtYXRDdXJyZW5jeShzdGFydGluZ0JhbGFuY2UpfSAgYCxcbiAgICBgPiAqKkFzIG9mOioqICR7c3RhcnRpbmdEYXRlfWAsXG4gICAgXCJcIixcbiAgICBcIiMjIFRyYW5zYWN0aW9uc1wiLFxuICAgIFwiXCIsXG4gICAgXCJ8ICMgfCBEYXRlIHwgRGVzY3JpcHRpb24gfCBUeXBlIHwgQW1vdW50IHwgQmFsYW5jZSB8IE5vdGUgfFwiLFxuICAgIFwifC0tLXwtLS0tLS18LS0tLS0tLS0tLS0tLXwtLS0tLS18LS0tLS0tLS18LS0tLS0tLS0tfC0tLS0tLXxcIixcbiAgXTtcblxuICB0cmFuc2FjdGlvbnMuZm9yRWFjaCgodHgsIGlkeCkgPT4ge1xuICAgIGNvbnN0IHNpZ24gPSB0eC50eXBlID09PSBcImRlcG9zaXRcIiA/IFwiK1wiIDogXCItXCI7XG4gICAgY29uc3QgdHlwZUVtb2ppID0gdHgudHlwZSA9PT0gXCJkZXBvc2l0XCIgPyBcIlx1RDgzRFx1REM5QSBEZXBvc2l0XCIgOiBcIlx1RDgzRFx1REQzNCBXaXRoZHJhd2FsXCI7XG4gICAgbGluZXMucHVzaChcbiAgICAgIGB8ICR7aWR4ICsgMX0gfCAke3R4LmRhdGV9IHwgJHt0eC5kZXNjcmlwdGlvbn0gfCAke3R5cGVFbW9qaX0gfCAke3NpZ259JHtmb3JtYXRDdXJyZW5jeSh0eC5hbW91bnQpfSB8ICR7Zm9ybWF0Q3VycmVuY3kodHguYmFsYW5jZSl9IHwgJHt0eC5ub3RlIHx8IFwiXCJ9IHxgXG4gICAgKTtcbiAgfSk7XG5cbiAgaWYgKHRyYW5zYWN0aW9ucy5sZW5ndGggPT09IDApIHtcbiAgICBsaW5lcy5wdXNoKFwifCBcdTIwMTQgfCBcdTIwMTQgfCBObyB0cmFuc2FjdGlvbnMgeWV0IHwgXHUyMDE0IHwgXHUyMDE0IHwgXHUyMDE0IHwgXHUyMDE0IHxcIik7XG4gIH1cblxuICBjb25zdCBjdXJyZW50ID1cbiAgICB0cmFuc2FjdGlvbnMubGVuZ3RoID4gMFxuICAgICAgPyB0cmFuc2FjdGlvbnNbdHJhbnNhY3Rpb25zLmxlbmd0aCAtIDFdLmJhbGFuY2VcbiAgICAgIDogc3RhcnRpbmdCYWxhbmNlO1xuXG4gIGxpbmVzLnB1c2goXG4gICAgXCJcIixcbiAgICBcIi0tLVwiLFxuICAgIFwiXCIsXG4gICAgYCoqQ3VycmVudCBCYWxhbmNlOiAke2Zvcm1hdEN1cnJlbmN5KGN1cnJlbnQpfSoqYCxcbiAgICBcIlwiLFxuICAgIGAqTGFzdCB1cGRhdGVkOiAke21vbWVudCgpLmZvcm1hdChcIllZWVktTU0tREQgSEg6bW1cIil9KmAsXG4gICAgXCJcIixcbiAgICBcIjwhLS0gYmFuay1yZWdpc3Rlci1kYXRhXCIsXG4gICAgSlNPTi5zdHJpbmdpZnkoZGF0YSksXG4gICAgXCItLT5cIlxuICApO1xuXG4gIHJldHVybiBsaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBwYXJzZU1hcmtkb3duKGNvbnRlbnQ6IHN0cmluZyk6IEJhbmtSZWdpc3RlckRhdGEgfCBudWxsIHtcbiAgY29uc3QgbWF0Y2ggPSBjb250ZW50Lm1hdGNoKFxuICAgIC88IS0tIGJhbmstcmVnaXN0ZXItZGF0YVxcbihbXFxzXFxTXSo/KVxcbi0tPi9cbiAgKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UobWF0Y2hbMV0pO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vLyBcdTI1MDBcdTI1MDBcdTI1MDAgTWFpbiBQbHVnaW4gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJhbmtSZWdpc3RlclBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBCYW5rUmVnaXN0ZXJTZXR0aW5ncztcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIHRoaXMuYWRkUmliYm9uSWNvbihcImxhbmRtYXJrXCIsIFwiT3BlbiBCYW5rIFJlZ2lzdGVyXCIsICgpID0+IHtcbiAgICAgIHRoaXMub3BlblJlZ2lzdGVyKCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwib3Blbi1iYW5rLXJlZ2lzdGVyXCIsXG4gICAgICBuYW1lOiBcIk9wZW4gQmFuayBSZWdpc3RlclwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHRoaXMub3BlblJlZ2lzdGVyKCksXG4gICAgfSk7XG5cbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEJhbmtSZWdpc3RlclNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5SZWdpc3RlcigpIHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5sb2FkRGF0YV8oKTtcbiAgICBuZXcgQmFua1JlZ2lzdGVyTW9kYWwodGhpcy5hcHAsIHRoaXMsIGRhdGEpLm9wZW4oKTtcbiAgfVxuXG4gIGFzeW5jIGxvYWREYXRhXygpOiBQcm9taXNlPEJhbmtSZWdpc3RlckRhdGE+IHtcbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKFJFR0lTVEVSX0ZJTEUpO1xuICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpO1xuICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VNYXJrZG93bihjb250ZW50KTtcbiAgICAgIGlmIChwYXJzZWQpIHJldHVybiBwYXJzZWQ7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBzdGFydGluZ0JhbGFuY2U6IDAsXG4gICAgICBzdGFydGluZ0RhdGU6IG1vbWVudCgpLmZvcm1hdChcIllZWVktTU0tRERcIiksXG4gICAgICB0cmFuc2FjdGlvbnM6IFtdLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBzYXZlRGF0YV8oZGF0YTogQmFua1JlZ2lzdGVyRGF0YSkge1xuICAgIGNvbnN0IHJlY2FsY2VkID0gcmVjYWxjQmFsYW5jZXMoZGF0YSk7XG4gICAgY29uc3QgbWQgPSBidWlsZE1hcmtkb3duKHJlY2FsY2VkLCB0aGlzLnNldHRpbmdzLmFjY291bnROYW1lKTtcblxuICAgIC8vIEVuc3VyZSBmb2xkZXIgZXhpc3RzXG4gICAgY29uc3QgZm9sZGVyID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKEZJTkFOQ0lBTFNfRk9MREVSKTtcbiAgICBpZiAoIWZvbGRlcikge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKEZJTkFOQ0lBTFNfRk9MREVSKTtcbiAgICB9XG5cbiAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKFJFR0lTVEVSX0ZJTEUpO1xuICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0Lm1vZGlmeShmaWxlLCBtZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShSRUdJU1RFUl9GSUxFLCBtZCk7XG4gICAgfVxuXG4gICAgbmV3IE5vdGljZShcIlx1MjcwNSBCYW5rIFJlZ2lzdGVyIHNhdmVkIVwiKTtcbiAgICByZXR1cm4gcmVjYWxjZWQ7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHN1cGVyLmxvYWREYXRhKCkpO1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgIGF3YWl0IHN1cGVyLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMFx1MjUwMCBNYWluIE1vZGFsIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5jbGFzcyBCYW5rUmVnaXN0ZXJNb2RhbCBleHRlbmRzIE1vZGFsIHtcbiAgcGx1Z2luOiBCYW5rUmVnaXN0ZXJQbHVnaW47XG4gIGRhdGE6IEJhbmtSZWdpc3RlckRhdGE7XG4gIGVkaXRpbmdJZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIGZpbHRlclR5cGU6IFwiYWxsXCIgfCBcImRlcG9zaXRcIiB8IFwid2l0aGRyYXdhbFwiID0gXCJhbGxcIjtcbiAgc29ydERlc2MgPSB0cnVlO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IEJhbmtSZWdpc3RlclBsdWdpbiwgZGF0YTogQmFua1JlZ2lzdGVyRGF0YSkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgfVxuXG4gIG9uT3BlbigpIHtcbiAgICB0aGlzLm1vZGFsRWwuYWRkQ2xhc3MoXCJiYW5rLXJlZ2lzdGVyLW1vZGFsXCIpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgY29uc3QgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgSGVhZGVyIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGhlYWRlciA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJici1oZWFkZXJcIik7XG4gICAgaGVhZGVyLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBgXHVEODNDXHVERkU2ICR7dGhpcy5wbHVnaW4uc2V0dGluZ3MuYWNjb3VudE5hbWV9YCB9KTtcblxuICAgIGNvbnN0IGN1cnJlbnRCYWxhbmNlID1cbiAgICAgIHRoaXMuZGF0YS50cmFuc2FjdGlvbnMubGVuZ3RoID4gMFxuICAgICAgICA/IHRoaXMuZGF0YS50cmFuc2FjdGlvbnNbdGhpcy5kYXRhLnRyYW5zYWN0aW9ucy5sZW5ndGggLSAxXS5iYWxhbmNlXG4gICAgICAgIDogdGhpcy5kYXRhLnN0YXJ0aW5nQmFsYW5jZTtcblxuICAgIGNvbnN0IGJhbGFuY2VDbGFzcyA9XG4gICAgICBjdXJyZW50QmFsYW5jZSA+PSAwID8gXCJici1iYWxhbmNlLXBvc2l0aXZlXCIgOiBcImJyLWJhbGFuY2UtbmVnYXRpdmVcIjtcbiAgICBoZWFkZXIuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgdGV4dDogZm9ybWF0Q3VycmVuY3koY3VycmVudEJhbGFuY2UpLFxuICAgICAgY2xzOiBgYnItYmFsYW5jZS1kaXNwbGF5ICR7YmFsYW5jZUNsYXNzfWAsXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgU3RhcnRpbmcgQmFsYW5jZSBTZWN0aW9uIFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHN0YXJ0U2VjdGlvbiA9IGNvbnRlbnRFbC5jcmVhdGVEaXYoXCJici1zZWN0aW9uXCIpO1xuICAgIHN0YXJ0U2VjdGlvbi5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJTdGFydGluZyBCYWxhbmNlXCIgfSk7XG5cbiAgICBjb25zdCBzdGFydFJvdyA9IHN0YXJ0U2VjdGlvbi5jcmVhdGVEaXYoXCJici1yb3dcIik7XG5cbiAgICBjb25zdCBzdGFydERhdGVJbnB1dCA9IHN0YXJ0Um93LmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJkYXRlXCIsXG4gICAgICBjbHM6IFwiYnItaW5wdXRcIixcbiAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHN0YXJ0RGF0ZUlucHV0LnZhbHVlID0gdGhpcy5kYXRhLnN0YXJ0aW5nRGF0ZTtcblxuICAgIGNvbnN0IHN0YXJ0QmFsSW5wdXQgPSBzdGFydFJvdy5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwibnVtYmVyXCIsXG4gICAgICBjbHM6IFwiYnItaW5wdXRcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIjAuMDBcIixcbiAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIHN0YXJ0QmFsSW5wdXQudmFsdWUgPSB0aGlzLmRhdGEuc3RhcnRpbmdCYWxhbmNlLnRvU3RyaW5nKCk7XG4gICAgc3RhcnRCYWxJbnB1dC5zdGVwID0gXCIwLjAxXCI7XG5cbiAgICBjb25zdCBzZXRTdGFydEJ0biA9IHN0YXJ0Um93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IFwiU2V0XCIsXG4gICAgICBjbHM6IFwiYnItYnRuIGJyLWJ0bi1zZWNvbmRhcnlcIixcbiAgICB9KTtcbiAgICBzZXRTdGFydEJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYmFsID0gcGFyc2VGbG9hdChzdGFydEJhbElucHV0LnZhbHVlKTtcbiAgICAgIGlmIChpc05hTihiYWwpKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJQbGVhc2UgZW50ZXIgYSB2YWxpZCBzdGFydGluZyBiYWxhbmNlLlwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5kYXRhLnN0YXJ0aW5nQmFsYW5jZSA9IHBhcnNlRmxvYXQoYmFsLnRvRml4ZWQoMikpO1xuICAgICAgdGhpcy5kYXRhLnN0YXJ0aW5nRGF0ZSA9IHN0YXJ0RGF0ZUlucHV0LnZhbHVlO1xuICAgICAgdGhpcy5kYXRhID0gYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZURhdGFfKHRoaXMuZGF0YSk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH07XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgQWRkIC8gRWRpdCBUcmFuc2FjdGlvbiBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCB0eFNlY3Rpb24gPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiYnItc2VjdGlvblwiKTtcbiAgICBjb25zdCBpc0VkaXRpbmcgPSB0aGlzLmVkaXRpbmdJZCAhPT0gbnVsbDtcbiAgICB0eFNlY3Rpb24uY3JlYXRlRWwoXCJoM1wiLCB7XG4gICAgICB0ZXh0OiBpc0VkaXRpbmcgPyBcIlx1MjcwRlx1RkUwRiBFZGl0IFRyYW5zYWN0aW9uXCIgOiBcIkFkZCBUcmFuc2FjdGlvblwiLFxuICAgIH0pO1xuXG4gICAgY29uc3QgZWRpdGluZ1R4ID0gaXNFZGl0aW5nXG4gICAgICA/IHRoaXMuZGF0YS50cmFuc2FjdGlvbnMuZmluZCgodCkgPT4gdC5pZCA9PT0gdGhpcy5lZGl0aW5nSWQpXG4gICAgICA6IG51bGw7XG5cbiAgICBjb25zdCBmb3JtID0gdHhTZWN0aW9uLmNyZWF0ZURpdihcImJyLWZvcm1cIik7XG5cbiAgICAvLyBSb3cgMTogZGF0ZSArIGRlc2NyaXB0aW9uXG4gICAgY29uc3Qgcm93MSA9IGZvcm0uY3JlYXRlRGl2KFwiYnItcm93XCIpO1xuICAgIGNvbnN0IGRhdGVJbnB1dCA9IHJvdzEuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG4gICAgICB0eXBlOiBcImRhdGVcIixcbiAgICAgIGNsczogXCJici1pbnB1dFwiLFxuICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgZGF0ZUlucHV0LnZhbHVlID0gZWRpdGluZ1R4XG4gICAgICA/IGVkaXRpbmdUeC5kYXRlXG4gICAgICA6IG1vbWVudCgpLmZvcm1hdChcIllZWVktTU0tRERcIik7XG5cbiAgICBjb25zdCBkZXNjSW5wdXQgPSByb3cxLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICBjbHM6IFwiYnItaW5wdXQgYnItaW5wdXQtZ3Jvd1wiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiRGVzY3JpcHRpb25cIixcbiAgICB9KSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgIGRlc2NJbnB1dC52YWx1ZSA9IGVkaXRpbmdUeCA/IGVkaXRpbmdUeC5kZXNjcmlwdGlvbiA6IFwiXCI7XG5cbiAgICAvLyBSb3cgMjogdHlwZSArIGFtb3VudCArIG5vdGVcbiAgICBjb25zdCByb3cyID0gZm9ybS5jcmVhdGVEaXYoXCJici1yb3dcIik7XG5cbiAgICBjb25zdCB0eXBlU2VsZWN0ID0gcm93Mi5jcmVhdGVFbChcInNlbGVjdFwiLCB7XG4gICAgICBjbHM6IFwiYnItc2VsZWN0XCIsXG4gICAgfSkgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgY29uc3Qgb3B0RGVwb3NpdCA9IHR5cGVTZWxlY3QuY3JlYXRlRWwoXCJvcHRpb25cIiwge1xuICAgICAgdmFsdWU6IFwiZGVwb3NpdFwiLFxuICAgICAgdGV4dDogXCJcdUQ4M0RcdURDOUEgRGVwb3NpdFwiLFxuICAgIH0pO1xuICAgIGNvbnN0IG9wdFdpdGhkcmF3ID0gdHlwZVNlbGVjdC5jcmVhdGVFbChcIm9wdGlvblwiLCB7XG4gICAgICB2YWx1ZTogXCJ3aXRoZHJhd2FsXCIsXG4gICAgICB0ZXh0OiBcIlx1RDgzRFx1REQzNCBXaXRoZHJhd2FsXCIsXG4gICAgfSk7XG4gICAgaWYgKGVkaXRpbmdUeD8udHlwZSA9PT0gXCJ3aXRoZHJhd2FsXCIpIG9wdFdpdGhkcmF3LnNlbGVjdGVkID0gdHJ1ZTtcbiAgICBlbHNlIG9wdERlcG9zaXQuc2VsZWN0ZWQgPSB0cnVlO1xuXG4gICAgY29uc3QgYW10SW5wdXQgPSByb3cyLmNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuICAgICAgdHlwZTogXCJudW1iZXJcIixcbiAgICAgIGNsczogXCJici1pbnB1dFwiLFxuICAgICAgcGxhY2Vob2xkZXI6IFwiQW1vdW50XCIsXG4gICAgfSkgYXMgSFRNTElucHV0RWxlbWVudDtcbiAgICBhbXRJbnB1dC5zdGVwID0gXCIwLjAxXCI7XG4gICAgYW10SW5wdXQubWluID0gXCIwXCI7XG4gICAgYW10SW5wdXQudmFsdWUgPSBlZGl0aW5nVHggPyBlZGl0aW5nVHguYW1vdW50LnRvU3RyaW5nKCkgOiBcIlwiO1xuXG4gICAgY29uc3Qgbm90ZUlucHV0ID0gcm93Mi5jcmVhdGVFbChcImlucHV0XCIsIHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgY2xzOiBcImJyLWlucHV0IGJyLWlucHV0LWdyb3dcIixcbiAgICAgIHBsYWNlaG9sZGVyOiBcIk5vdGUgKG9wdGlvbmFsKVwiLFxuICAgIH0pIGFzIEhUTUxJbnB1dEVsZW1lbnQ7XG4gICAgbm90ZUlucHV0LnZhbHVlID0gZWRpdGluZ1R4ID8gZWRpdGluZ1R4Lm5vdGUgOiBcIlwiO1xuXG4gICAgLy8gUm93IDM6IGJ1dHRvbnNcbiAgICBjb25zdCByb3czID0gZm9ybS5jcmVhdGVEaXYoXCJici1yb3cgYnItcm93LWVuZFwiKTtcblxuICAgIGlmIChpc0VkaXRpbmcpIHtcbiAgICAgIGNvbnN0IGNhbmNlbEJ0biA9IHJvdzMuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICB0ZXh0OiBcIkNhbmNlbFwiLFxuICAgICAgICBjbHM6IFwiYnItYnRuIGJyLWJ0bi1naG9zdFwiLFxuICAgICAgfSk7XG4gICAgICBjYW5jZWxCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5lZGl0aW5nSWQgPSBudWxsO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCBzYXZlQnRuID0gcm93My5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICB0ZXh0OiBpc0VkaXRpbmcgPyBcIlVwZGF0ZSBUcmFuc2FjdGlvblwiIDogXCJBZGQgVHJhbnNhY3Rpb25cIixcbiAgICAgIGNsczogXCJici1idG4gYnItYnRuLXByaW1hcnlcIixcbiAgICB9KTtcblxuICAgIHNhdmVCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGRlc2MgPSBkZXNjSW5wdXQudmFsdWUudHJpbSgpO1xuICAgICAgY29uc3QgYW10ID0gcGFyc2VGbG9hdChhbXRJbnB1dC52YWx1ZSk7XG4gICAgICBjb25zdCB0eXBlID0gdHlwZVNlbGVjdC52YWx1ZSBhcyBcImRlcG9zaXRcIiB8IFwid2l0aGRyYXdhbFwiO1xuICAgICAgY29uc3QgZGF0ZSA9IGRhdGVJbnB1dC52YWx1ZTtcbiAgICAgIGNvbnN0IG5vdGUgPSBub3RlSW5wdXQudmFsdWUudHJpbSgpO1xuXG4gICAgICBpZiAoIWRlc2MpIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlBsZWFzZSBlbnRlciBhIGRlc2NyaXB0aW9uLlwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKGlzTmFOKGFtdCkgfHwgYW10IDw9IDApIHtcbiAgICAgICAgbmV3IE5vdGljZShcIlBsZWFzZSBlbnRlciBhIHZhbGlkIGFtb3VudCBncmVhdGVyIHRoYW4gMC5cIik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghZGF0ZSkge1xuICAgICAgICBuZXcgTm90aWNlKFwiUGxlYXNlIHNlbGVjdCBhIGRhdGUuXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0VkaXRpbmcgJiYgZWRpdGluZ1R4KSB7XG4gICAgICAgIGVkaXRpbmdUeC5kYXRlID0gZGF0ZTtcbiAgICAgICAgZWRpdGluZ1R4LmRlc2NyaXB0aW9uID0gZGVzYztcbiAgICAgICAgZWRpdGluZ1R4LnR5cGUgPSB0eXBlO1xuICAgICAgICBlZGl0aW5nVHguYW1vdW50ID0gcGFyc2VGbG9hdChhbXQudG9GaXhlZCgyKSk7XG4gICAgICAgIGVkaXRpbmdUeC5ub3RlID0gbm90ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG5ld1R4OiBUcmFuc2FjdGlvbiA9IHtcbiAgICAgICAgICBpZDogZ2VuZXJhdGVJZCgpLFxuICAgICAgICAgIGRhdGUsXG4gICAgICAgICAgZGVzY3JpcHRpb246IGRlc2MsXG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICBhbW91bnQ6IHBhcnNlRmxvYXQoYW10LnRvRml4ZWQoMikpLFxuICAgICAgICAgIGJhbGFuY2U6IDAsXG4gICAgICAgICAgbm90ZSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kYXRhLnRyYW5zYWN0aW9ucy5wdXNoKG5ld1R4KTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5lZGl0aW5nSWQgPSBudWxsO1xuICAgICAgdGhpcy5kYXRhID0gYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZURhdGFfKHRoaXMuZGF0YSk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH07XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgRmlsdGVyIC8gU29ydCBCYXIgXHUyNTAwXHUyNTAwXG4gICAgY29uc3QgZmlsdGVyQmFyID0gY29udGVudEVsLmNyZWF0ZURpdihcImJyLWZpbHRlci1iYXJcIik7XG5cbiAgICBjb25zdCBmaWx0ZXJHcm91cCA9IGZpbHRlckJhci5jcmVhdGVEaXYoXCJici1maWx0ZXItZ3JvdXBcIik7XG4gICAgZmlsdGVyR3JvdXAuY3JlYXRlRWwoXCJzcGFuXCIsIHsgdGV4dDogXCJGaWx0ZXI6XCIsIGNsczogXCJici1sYWJlbFwiIH0pO1xuXG4gICAgY29uc3QgZmlsdGVyczogQXJyYXk8eyBsYWJlbDogc3RyaW5nOyB2YWx1ZTogXCJhbGxcIiB8IFwiZGVwb3NpdFwiIHwgXCJ3aXRoZHJhd2FsXCIgfT4gPSBbXG4gICAgICB7IGxhYmVsOiBcIkFsbFwiLCB2YWx1ZTogXCJhbGxcIiB9LFxuICAgICAgeyBsYWJlbDogXCJcdUQ4M0RcdURDOUEgRGVwb3NpdHNcIiwgdmFsdWU6IFwiZGVwb3NpdFwiIH0sXG4gICAgICB7IGxhYmVsOiBcIlx1RDgzRFx1REQzNCBXaXRoZHJhd2Fsc1wiLCB2YWx1ZTogXCJ3aXRoZHJhd2FsXCIgfSxcbiAgICBdO1xuICAgIGZvciAoY29uc3QgZiBvZiBmaWx0ZXJzKSB7XG4gICAgICBjb25zdCBidG4gPSBmaWx0ZXJHcm91cC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgIHRleHQ6IGYubGFiZWwsXG4gICAgICAgIGNsczogYGJyLWZpbHRlci1idG4gJHt0aGlzLmZpbHRlclR5cGUgPT09IGYudmFsdWUgPyBcImFjdGl2ZVwiIDogXCJcIn1gLFxuICAgICAgfSk7XG4gICAgICBidG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5maWx0ZXJUeXBlID0gZi52YWx1ZTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3Qgc29ydEJ0biA9IGZpbHRlckJhci5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICB0ZXh0OiB0aGlzLnNvcnREZXNjID8gXCJcdTJCMDcgTmV3ZXN0XCIgOiBcIlx1MkIwNiBPbGRlc3RcIixcbiAgICAgIGNsczogXCJici1idG4gYnItYnRuLWdob3N0IGJyLWJ0bi1zbVwiLFxuICAgIH0pO1xuICAgIHNvcnRCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgIHRoaXMuc29ydERlc2MgPSAhdGhpcy5zb3J0RGVzYztcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfTtcblxuICAgIC8vIFx1MjUwMFx1MjUwMCBUcmFuc2FjdGlvbiBMaXN0IFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IGxpc3RTZWN0aW9uID0gY29udGVudEVsLmNyZWF0ZURpdihcImJyLXNlY3Rpb25cIik7XG5cbiAgICBsZXQgdHhzID0gWy4uLnRoaXMuZGF0YS50cmFuc2FjdGlvbnNdO1xuICAgIGlmICh0aGlzLmZpbHRlclR5cGUgIT09IFwiYWxsXCIpIHtcbiAgICAgIHR4cyA9IHR4cy5maWx0ZXIoKHQpID0+IHQudHlwZSA9PT0gdGhpcy5maWx0ZXJUeXBlKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc29ydERlc2MpIHR4cyA9IHR4cy5yZXZlcnNlKCk7XG5cbiAgICBpZiAodHhzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgbGlzdFNlY3Rpb24uY3JlYXRlRWwoXCJwXCIsIHtcbiAgICAgICAgdGV4dDogXCJObyB0cmFuc2FjdGlvbnMgeWV0LiBBZGQgb25lIGFib3ZlIVwiLFxuICAgICAgICBjbHM6IFwiYnItZW1wdHlcIixcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB0YWJsZSA9IGxpc3RTZWN0aW9uLmNyZWF0ZUVsKFwidGFibGVcIiwgeyBjbHM6IFwiYnItdGFibGVcIiB9KTtcbiAgICAgIGNvbnN0IHRoZWFkID0gdGFibGUuY3JlYXRlRWwoXCJ0aGVhZFwiKTtcbiAgICAgIGNvbnN0IGhlYWRlclJvdyA9IHRoZWFkLmNyZWF0ZUVsKFwidHJcIik7XG4gICAgICBbXCJEYXRlXCIsIFwiRGVzY3JpcHRpb25cIiwgXCJUeXBlXCIsIFwiQW1vdW50XCIsIFwiQmFsYW5jZVwiLCBcIk5vdGVcIiwgXCJcIl0uZm9yRWFjaChcbiAgICAgICAgKGgpID0+IGhlYWRlclJvdy5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogaCB9KVxuICAgICAgKTtcblxuICAgICAgY29uc3QgdGJvZHkgPSB0YWJsZS5jcmVhdGVFbChcInRib2R5XCIpO1xuXG4gICAgICBmb3IgKGNvbnN0IHR4IG9mIHR4cykge1xuICAgICAgICBjb25zdCB0ciA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIiwge1xuICAgICAgICAgIGNsczogYGJyLXR4LXJvdyAke3R4LnR5cGV9YCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdHIuY3JlYXRlRWwoXCJ0ZFwiLCB7IHRleHQ6IHR4LmRhdGUsIGNsczogXCJici10ZC1kYXRlXCIgfSk7XG4gICAgICAgIHRyLmNyZWF0ZUVsKFwidGRcIiwgeyB0ZXh0OiB0eC5kZXNjcmlwdGlvbiB9KTtcblxuICAgICAgICBjb25zdCB0eXBlVGQgPSB0ci5jcmVhdGVFbChcInRkXCIpO1xuICAgICAgICB0eXBlVGQuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgICAgICB0ZXh0OiB0eC50eXBlID09PSBcImRlcG9zaXRcIiA/IFwiRGVwb3NpdFwiIDogXCJXaXRoZHJhd2FsXCIsXG4gICAgICAgICAgY2xzOiBgYnItYmFkZ2UgJHt0eC50eXBlfWAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IGFtdFRkID0gdHIuY3JlYXRlRWwoXCJ0ZFwiLCB7IGNsczogXCJici10ZC1udW1cIiB9KTtcbiAgICAgICAgYW10VGQuY3JlYXRlRWwoXCJzcGFuXCIsIHtcbiAgICAgICAgICB0ZXh0OiBgJHt0eC50eXBlID09PSBcImRlcG9zaXRcIiA/IFwiK1wiIDogXCItXCJ9JHtmb3JtYXRDdXJyZW5jeSh0eC5hbW91bnQpfWAsXG4gICAgICAgICAgY2xzOiB0eC50eXBlID09PSBcImRlcG9zaXRcIiA/IFwiYnItcG9zXCIgOiBcImJyLW5lZ1wiLFxuICAgICAgICB9KTtcblxuICAgICAgICB0ci5jcmVhdGVFbChcInRkXCIsIHtcbiAgICAgICAgICB0ZXh0OiBmb3JtYXRDdXJyZW5jeSh0eC5iYWxhbmNlKSxcbiAgICAgICAgICBjbHM6IGBici10ZC1udW0gJHt0eC5iYWxhbmNlIDwgMCA/IFwiYnItbmVnXCIgOiBcIlwifWAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRyLmNyZWF0ZUVsKFwidGRcIiwgeyB0ZXh0OiB0eC5ub3RlIHx8IFwiXHUyMDE0XCIsIGNsczogXCJici10ZC1ub3RlXCIgfSk7XG5cbiAgICAgICAgY29uc3QgYWN0aW9uVGQgPSB0ci5jcmVhdGVFbChcInRkXCIsIHsgY2xzOiBcImJyLWFjdGlvbnNcIiB9KTtcblxuICAgICAgICBjb25zdCBlZGl0QnRuID0gYWN0aW9uVGQuY3JlYXRlRWwoXCJidXR0b25cIiwge1xuICAgICAgICAgIHRleHQ6IFwiXHUyNzBGXHVGRTBGXCIsXG4gICAgICAgICAgY2xzOiBcImJyLWljb24tYnRuXCIsXG4gICAgICAgICAgdGl0bGU6IFwiRWRpdFwiLFxuICAgICAgICB9KTtcbiAgICAgICAgZWRpdEJ0bi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZWRpdGluZ0lkID0gdHguaWQ7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBkZWxCdG4gPSBhY3Rpb25UZC5jcmVhdGVFbChcImJ1dHRvblwiLCB7XG4gICAgICAgICAgdGV4dDogXCJcdUQ4M0RcdURERDFcdUZFMEZcIixcbiAgICAgICAgICBjbHM6IFwiYnItaWNvbi1idG4gYnItaWNvbi1idG4tZGFuZ2VyXCIsXG4gICAgICAgICAgdGl0bGU6IFwiRGVsZXRlXCIsXG4gICAgICAgIH0pO1xuICAgICAgICBkZWxCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICBpZiAoY29uZmlybShgRGVsZXRlIFwiJHt0eC5kZXNjcmlwdGlvbn1cIj9gKSkge1xuICAgICAgICAgICAgdGhpcy5kYXRhLnRyYW5zYWN0aW9ucyA9IHRoaXMuZGF0YS50cmFuc2FjdGlvbnMuZmlsdGVyKFxuICAgICAgICAgICAgICAodCkgPT4gdC5pZCAhPT0gdHguaWRcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmRhdGEgPSBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlRGF0YV8odGhpcy5kYXRhKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFx1MjUwMFx1MjUwMCBTdW1tYXJ5IFx1MjUwMFx1MjUwMFxuICAgIGNvbnN0IHN1bW1hcnkgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiYnItc3VtbWFyeVwiKTtcbiAgICBjb25zdCBkZXBvc2l0cyA9IHRoaXMuZGF0YS50cmFuc2FjdGlvbnNcbiAgICAgIC5maWx0ZXIoKHQpID0+IHQudHlwZSA9PT0gXCJkZXBvc2l0XCIpXG4gICAgICAucmVkdWNlKChzLCB0KSA9PiBzICsgdC5hbW91bnQsIDApO1xuICAgIGNvbnN0IHdpdGhkcmF3YWxzID0gdGhpcy5kYXRhLnRyYW5zYWN0aW9uc1xuICAgICAgLmZpbHRlcigodCkgPT4gdC50eXBlID09PSBcIndpdGhkcmF3YWxcIilcbiAgICAgIC5yZWR1Y2UoKHMsIHQpID0+IHMgKyB0LmFtb3VudCwgMCk7XG5cbiAgICBzdW1tYXJ5LmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIHRleHQ6IGBUb3RhbCBEZXBvc2l0czogJHtmb3JtYXRDdXJyZW5jeShkZXBvc2l0cyl9YCxcbiAgICAgIGNsczogXCJici1zdW0taXRlbSBici1wb3NcIixcbiAgICB9KTtcbiAgICBzdW1tYXJ5LmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIHRleHQ6IGBUb3RhbCBXaXRoZHJhd2FsczogJHtmb3JtYXRDdXJyZW5jeSh3aXRoZHJhd2Fscyl9YCxcbiAgICAgIGNsczogXCJici1zdW0taXRlbSBici1uZWdcIixcbiAgICB9KTtcbiAgICBzdW1tYXJ5LmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIHRleHQ6IGBOZXQ6ICR7Zm9ybWF0Q3VycmVuY3koZGVwb3NpdHMgLSB3aXRoZHJhd2Fscyl9YCxcbiAgICAgIGNsczogXCJici1zdW0taXRlbSBici1zdW0tbmV0XCIsXG4gICAgfSk7XG5cbiAgICAvLyBcdTI1MDBcdTI1MDAgT3BlbiBOb3RlIEJ1dHRvbiBcdTI1MDBcdTI1MDBcbiAgICBjb25zdCBmb290ZXJSb3cgPSBjb250ZW50RWwuY3JlYXRlRGl2KFwiYnItZm9vdGVyXCIpO1xuICAgIGNvbnN0IG9wZW5Ob3RlQnRuID0gZm9vdGVyUm93LmNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcbiAgICAgIHRleHQ6IFwiXHVEODNEXHVEQ0M0IE9wZW4gUmVnaXN0ZXIgTm90ZVwiLFxuICAgICAgY2xzOiBcImJyLWJ0biBici1idG4tZ2hvc3RcIixcbiAgICB9KTtcbiAgICBvcGVuTm90ZUJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChSRUdJU1RFUl9GSUxFKTtcbiAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKS5vcGVuRmlsZShmaWxlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJSZWdpc3RlciBub3RlIG5vdCBmb3VuZC4gQWRkIGEgdHJhbnNhY3Rpb24gZmlyc3QuXCIpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBvbkNsb3NlKCkge1xuICAgIHRoaXMuY29udGVudEVsLmVtcHR5KCk7XG4gIH1cbn1cblxuLy8gXHUyNTAwXHUyNTAwXHUyNTAwIFNldHRpbmdzIFRhYiBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuY2xhc3MgQmFua1JlZ2lzdGVyU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IEJhbmtSZWdpc3RlclBsdWdpbjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBCYW5rUmVnaXN0ZXJQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCkge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJCYW5rIFJlZ2lzdGVyIFNldHRpbmdzXCIgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKFwiQWNjb3VudCBOYW1lXCIpXG4gICAgICAuc2V0RGVzYyhcIkRpc3BsYXkgbmFtZSBzaG93biBpbiB0aGUgcmVnaXN0ZXIgaGVhZGVyLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+XG4gICAgICAgIHRleHRcbiAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJNeSBBY2NvdW50XCIpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLmFjY291bnROYW1lKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmFjY291bnROYW1lID0gdmFsdWUgfHwgXCJNeSBBY2NvdW50XCI7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICB9KVxuICAgICAgKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsc0JBU087QUF3QlAsSUFBTSxtQkFBeUM7QUFBQSxFQUM3QyxhQUFhO0FBQ2Y7QUFFQSxJQUFNLG9CQUFvQjtBQUMxQixJQUFNLGdCQUFnQjtBQUl0QixTQUFTLGFBQXFCO0FBQzVCLFNBQU8sS0FBSyxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksS0FBSyxPQUFPLEVBQUUsU0FBUyxFQUFFLEVBQUUsTUFBTSxHQUFHLENBQUM7QUFDeEU7QUFFQSxTQUFTLGVBQWUsUUFBd0I7QUFDOUMsU0FBTyxJQUFJLEtBQUssYUFBYSxTQUFTO0FBQUEsSUFDcEMsT0FBTztBQUFBLElBQ1AsVUFBVTtBQUFBLElBQ1YsdUJBQXVCO0FBQUEsRUFDekIsQ0FBQyxFQUFFLE9BQU8sTUFBTTtBQUNsQjtBQUVBLFNBQVMsZUFBZSxNQUEwQztBQUNoRSxNQUFJLFVBQVUsS0FBSztBQUNuQixRQUFNLFNBQVMsQ0FBQyxHQUFHLEtBQUssWUFBWSxF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
