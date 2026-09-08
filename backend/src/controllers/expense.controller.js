import Expense from "../models/expense.model.js";

// @desc    Create a new expense
// @route   POST /api/v1/expenses
// @access  Private (expense:write)
export const createExpense = async (req, res) => {
  try {
    const { title, category, amount, date, referenceNumber } = req.body;

    const expense = await Expense.create({
      title,
      category,
      amount,
      date: date || Date.now(),
      referenceNumber,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all expenses
// @route   GET /api/v1/expenses
// @access  Private (expense:read)
export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("createdBy", "name email")
      .sort("-createdAt");
    
    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update expense
// @route   PUT /api/v1/expenses/:id
// @access  Private (expense:write)
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete expense
// @route   DELETE /api/v1/expenses/:id
// @access  Private (expense:delete)
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
