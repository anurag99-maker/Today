/**
 * LedgerMind Pro - Frontend Controller (script.js)
 * Connects HTML UI elements to the Spring Boot REST API.
 */

const API_BASE_URL = 'http://localhost:8080/api/v1/finance';

// Global state variables for tracking overall metrics
let currentAppState = {
  grossSalary: 6200.00,
  netIncome: 5000.00,
  totalDeductions: 1200.00,
  loanPrincipal: 15000.00,
  monthlyEmi: 466.61,
  liquidSavings: 1800.00,
  financeChart: null
};

document.addEventListener('DOMContentLoaded', () => {
  initChart();
  bindSalaryForm();
  bindEmiForm();
  bindAiAuditButton();
});

/**
 * Initialize Chart.js Doughnut Breakdown
 */
function initChart() {
  const ctx = document.getElementById('financeChart').getContext('2d');
  
  const livingExpenses = Math.max(0, currentAppState.netIncome - currentAppState.monthlyEmi - currentAppState.liquidSavings);

  currentAppState.financeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Net Savings', 'Loan EMI', 'Living Expenses', 'Deductions'],
      datasets: [{
        data: [
          currentAppState.liquidSavings, 
          currentAppState.monthlyEmi, 
          livingExpenses, 
          currentAppState.totalDeductions
        ],
        backgroundColor: ['#34d399', '#f87171', '#38bdf8', '#818cf8'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { 
          position: 'bottom', 
          labels: { color: '#94a3b8' } 
        } 
      }
    }
  });
}

/**
 * Handle Paycheck & Salary Calculations
 */
function bindSalaryForm() {
  const salaryForm = document.getElementById('salaryForm');
  if (!salaryForm) return;

  salaryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const grossSalary = parseFloat(document.getElementById('gross').value) || 0;
    const taxDeduction = parseFloat(document.getElementById('tax').value) || 0;
    const healthInsurance = parseFloat(document.getElementById('insurance').value) || 0;
    const retirementContribution = parseFloat(document.getElementById('retirement').value) || 0;

    const requestPayload = {
      grossSalary: grossSalary,
      taxDeduction: taxDeduction,
      healthInsurance: healthInsurance,
      retirementContribution: retirementContribution
    };

    try {
      const response = await fetch(`${API_BASE_URL}/calculate-salary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // Update global state
      currentAppState.grossSalary = data.grossSalary;
      currentAppState.totalDeductions = data.totalDeductions;
      currentAppState.netIncome = data.netTakeHome;

      // Update UI Output Box
      document.getElementById('salaryOutput').innerHTML = `
        <div class="output-row"><span>Gross Earnings:</span> <strong>$${data.grossSalary.toFixed(2)}</strong></div>
        <div class="output-row"><span>Total Deductions:</span> <strong class="text-red">-$${data.totalDeductions.toFixed(2)}</strong></div>
        <div class="output-row" style="border-top: 1px dashed var(--border-color); padding-top: 8px;">
          <span>Net Take-Home Pay:</span> <strong class="text-green">$${data.netTakeHome.toFixed(2)}</strong>
        </div>
      `;

      // Update Top Metrics
      document.getElementById('netIncomeDisplay').innerText = `$${data.netTakeHome.toFixed(2)}`;
      document.getElementById('grossPayDisplay').innerText = `$${data.grossSalary.toFixed(2)}`;

      // Update Savings Buffer Metric
      updateSavingsMetrics();
      
      // Refresh Chart
      updateChartData();

    } catch (error) {
      console.error('Salary API error:', error);
      alert('Failed to calculate salary. Please ensure the Spring Boot server is running at ' + API_BASE_URL);
    }
  });
}

/**
 * Handle Loan & EMI Calculations
 */
function bindEmiForm() {
  const emiForm = document.getElementById('emiForm');
  if (!emiForm) return;

  emiForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const principal = parseFloat(document.getElementById('loanPrincipal').value) || 0;
    const annualInterestRate = parseFloat(document.getElementById('interest').value) || 0;
    const tenureMonths = parseInt(document.getElementById('tenure').value) || 1;

    const requestPayload = {
      principal: principal,
      annualInterestRate: annualInterestRate,
      tenureMonths: tenureMonths
    };

    try {
      const response = await fetch(`${API_BASE_URL}/calculate-emi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // Update global state
      currentAppState.loanPrincipal = principal;
      currentAppState.monthlyEmi = data.monthlyEmi;

      // Update UI Output Box
      document.getElementById('emiOutput').innerHTML = `
        <div class="output-row"><span>Monthly EMI:</span> <strong class="text-accent">$${data.monthlyEmi.toFixed(2)}</strong></div>
        <div class="output-row"><span>Total Interest Payable:</span> <strong>$${data.totalInterestPayable.toFixed(2)}</strong></div>
        <div class="output-row"><span>Total Loan Cost:</span> <strong>$${data.totalRepaymentCost.toFixed(2)}</strong></div>
      `;

      // Update Top Metrics
      document.getElementById('totalDebtDisplay').innerText = `$${principal.toFixed(2)}`;
      document.getElementById('emiDisplay').innerText = `$${data.monthlyEmi.toFixed(2)}/mo`;

      // Refresh Chart
      updateChartData();

    } catch (error) {
      console.error('EMI API error:', error);
      alert('Failed to calculate EMI. Please ensure the Spring Boot backend is active.');
    }
  });
}

/**
 * Handle AI Financial Audit Call
 */
function bindAiAuditButton() {
  const aiBtn = document.getElementById('aiBtn');
  const aiOutput = document.getElementById('aiOutput');
  if (!aiBtn || !aiOutput) return;

  aiBtn.addEventListener('click', async () => {
    aiOutput.innerText = "⏳ Running financial diagnostics with Spring Boot backend...";

    const requestPayload = {
      netMonthlyIncome: currentAppState.netIncome,
      monthlyEmi: currentAppState.monthlyEmi,
      liquidSavings: currentAppState.liquidSavings
    };

    try {
      const response = await fetch(`${API_BASE_URL}/run-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // Build recommendation bullet points
      const recommendationList = data.recommendations
        .map(rec => `• ${rec}`)
        .join('\n');

      aiOutput.innerHTML = `✨ AI Audit Diagnosis:
• Status: <strong>${data.healthStatus}</strong>
• Debt-to-Income (DTI): <strong>${data.debtToIncomeRatio}%</strong>

Recommendations:
${recommendationList}`;

    } catch (error) {
      console.error('AI Audit API error:', error);
      aiOutput.innerText = "⚠️ Unable to reach AI Engine. Check if the server is running.";
    }
  });
}

/**
 * Helper to update savings displays based on Net Income
 */
function updateSavingsMetrics() {
  const savingsAmountDisplay = document.getElementById('savingsAmountDisplay');
  const savingsRateDisplay = document.getElementById('savingsRateDisplay');

  if (savingsAmountDisplay && currentAppState.netIncome > 0) {
    const estimatedSavings = currentAppState.netIncome * 0.36; // 36% default target
    currentAppState.liquidSavings = estimatedSavings;
    savingsAmountDisplay.innerText = `$${estimatedSavings.toFixed(2)}`;
  }
}

/**
 * Helper to update the Chart.js dataset dynamically
 */
function updateChartData() {
  if (!currentAppState.financeChart) return;

  const livingExpenses = Math.max(0, currentAppState.netIncome - currentAppState.monthlyEmi - currentAppState.liquidSavings);

  currentAppState.financeChart.data.datasets[0].data = [
    currentAppState.liquidSavings,
    currentAppState.monthlyEmi,
    livingExpenses,
    currentAppState.totalDeductions
  ];

  currentAppState.financeChart.update();
}