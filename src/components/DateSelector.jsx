import { useState } from 'react';

const DateSelector = ({ setDate, date, label = 'Select Date', min, max }) => {
  return (
    <div className="w-full sm:w-auto">
      {label && (
        <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1.5 sm:mb-2 tracking-wide uppercase">
          {label}
        </label>
      )}

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>

        <input
          type="date"
          value={date}
          min={min}
          max={max}
          onChange={(e) => setDate(e.target.value)}
          className="
            w-full sm:w-56
            pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3
            text-sm sm:text-base font-medium text-slate-800
            bg-white
            border border-slate-200
            rounded-xl sm:rounded-2xl
            shadow-sm
            outline-none
            cursor-pointer
            transition-all duration-200
            hover:border-slate-300 hover:shadow
            focus:border-blue-500 focus:ring-4 focus:ring-blue-100
            [color-scheme:light]
            appearance-none
          "
        />

        {date && (
          <button
            type="button"
            onClick={() => setDate('')}
            className="
              absolute inset-y-0 right-0 pr-3 sm:pr-4
              flex items-center
              text-slate-300 hover:text-slate-600
              transition-colors
            "
            aria-label="Clear date"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// ---- Wrapper: single date + optional range mode ----
const PicklistDateFilter = ({ onFetch }) => {
  const [isRange, setIsRange] = useState(false);
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleFetch = () => {
    if (isRange) {
      if (!startDate || !endDate) return;
      onFetch({ startDate, endDate });
    } else {
      onFetch(date ? { date } : {});
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={isRange}
            onChange={(e) => {
              setIsRange(e.target.checked);
              setDate('');
              setStartDate('');
              setEndDate('');
            }}
            className="rounded border-slate-300"
          />
          Date range
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        {isRange ? (
          <>
            <DateSelector
              label="Start Date"
              date={startDate}
              setDate={setStartDate}
              max={endDate || undefined}
            />
            <DateSelector
              label="End Date"
              date={endDate}
              setDate={setEndDate}
              min={startDate || undefined}
            />
          </>
        ) : (
          <DateSelector label="Select Date" date={date} setDate={setDate} />
        )}

        <button
          type="button"
          onClick={handleFetch}
          disabled={isRange && (!startDate || !endDate)}
          className="
            px-5 py-2.5 sm:py-3
            text-sm sm:text-base font-semibold text-white
            bg-blue-600 hover:bg-blue-700
            disabled:bg-slate-300 disabled:cursor-not-allowed
            rounded-xl sm:rounded-2xl
            shadow-sm
            transition-colors
          "
        >
          Fetch
        </button>
      </div>
    </div>
  );
};

export default DateSelector;
export { PicklistDateFilter };
