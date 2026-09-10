import React, { useState } from 'react';
import { api } from '../api/client';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded: () => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onExpenseAdded,
  onShowToast,
}) => {
  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getTodayDate());
  const [foodPrice, setFoodPrice] = useState('');
  const [ingredientPrice, setIngredientPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFood = parseFloat(foodPrice || '0');
    const parsedIngredient = parseFloat(ingredientPrice || '0');

    if (isNaN(parsedFood) || parsedFood < 0) {
      setError('Please enter a valid food price');
      return;
    }
    if (isNaN(parsedIngredient) || parsedIngredient < 0) {
      setError('Please enter a valid ingredient price');
      return;
    }
    if (parsedFood === 0 && parsedIngredient === 0) {
      setError('Please enter at least one positive expense amount');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.dailyCosts.create({
        date,
        foodPrice: parsedFood,
        ingredientPrice: parsedIngredient,
      });

      onShowToast(`Logged daily cost: $${(parsedFood + parsedIngredient).toFixed(2)}`, 'check_circle');
      onExpenseAdded();
      setFoodPrice('');
      setIngredientPrice('');
      onClose();
    } catch (err: any) {
      console.error('Failed to create daily cost:', err);
      setError(err.message || 'Failed to submit expense. Admin token required.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-surface-container-high relative">
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Add Daily Cost
              </h2>
              <p className="font-body-sm text-xs text-on-surface-variant">
                POST /api/v1/daily-costs (Admin only)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-error-container/30 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">
              Date (YYYY-MM-DD)
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">
                Food Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-on-surface-variant font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={foodPrice}
                  onChange={(e) => setFoodPrice(e.target.value)}
                  className="w-full h-11 pl-7 pr-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1 block">
                Split among diners who EAT
              </span>
            </div>

            <div>
              <label className="block font-label-md text-xs font-semibold text-on-surface mb-1">
                Ingredient Price ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-on-surface-variant font-bold text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={ingredientPrice}
                  onChange={(e) => setIngredientPrice(e.target.value)}
                  className="w-full h-11 pl-7 pr-3 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <span className="text-[10px] text-on-surface-variant mt-1 block">
                Split across all active members
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low text-on-surface-variant text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">cloud_upload</span>
            <span>Recorded directly to backend database and updates ledger automatically.</span>
          </div>

          <div className="flex items-center gap-2.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-surface-container text-on-surface font-label-md text-xs font-bold hover:bg-surface-container-high"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-label-md text-xs font-bold shadow-md hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Submit Expense</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
