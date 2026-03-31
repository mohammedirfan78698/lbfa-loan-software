/**
 * Calculate EMI using Fixed Principal + Declining Interest Method
 * (Microfinance / Local Finance Model)
 *
 * EMI = Fixed Principal + (Remaining Balance × Monthly Rate)
 *
 * @param {number} principal - Loan amount
 * @param {number} monthlyRate - Monthly interest rate (e.g., 0.01 for 1%)
 * @param {number} months - Number of months
 * @returns {number} First month EMI (since EMI changes every month)
 */
export const calculateEMI = (principal, monthlyRate, months) => {
  if (!principal || !months) return 0;

  const fixedPrincipal = principal / months;
  const firstMonthInterest = principal * monthlyRate;
  const firstMonthEmi = fixedPrincipal + firstMonthInterest;

  return Math.round(firstMonthEmi * 100) / 100;
};

/**
 * Generate EMI Schedule using:
 * Fixed Principal + Declining Interest
 *
 * @param {number} principal - Loan amount
 * @param {number} monthlyRate - Monthly interest rate (e.g., 0.01 for 1%)
 * @param {number} months - Number of months
 * @returns {Array} EMI breakdown per month
 */
export const generateEMISchedule = (principal, monthlyRate, months) => {
  if (!principal || !months) return [];

  const schedule = [];
  let remainingBalance = Number(principal);
  const fixedPrincipal = Number(principal) / Number(months);

  for (let month = 1; month <= months; month++) {
    const interestAmount =
      Math.round(remainingBalance * monthlyRate * 100) / 100;

    const emi =
      Math.round((fixedPrincipal + interestAmount) * 100) / 100;

    const newBalance =
      Math.round((remainingBalance - fixedPrincipal) * 100) / 100;

    schedule.push({
      month,
      emi: emi,
      principal: Math.round(fixedPrincipal * 100) / 100,
      interest: interestAmount,
      balance: Math.max(0, newBalance), // Prevent negative balance
    });

    remainingBalance = newBalance;
  }

  return schedule;
};
