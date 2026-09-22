import { useMemo } from 'react';
import usePicklistResponse from '../hooks/usePicklistResponse.js';
import useUserNames from '../hooks/useUserNames.js';
import DateSelector from '../components/DateSelector.jsx';
import Stats from '../components/Stats.jsx';

const Dashboard = () => {
  const { loading, error, picklistResponse, setDate, date } = usePicklistResponse();

  const records = picklistResponse?.picklistResponses ?? [];

  const employeeIds = useMemo(
    () => [...new Set(records.map((r) => r.employee_id).filter(Boolean))],
    [records]
  );

  // NOTE: we ignore `namesLoading` here — names stream in
  const { namesMap } = useUserNames(employeeIds);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500">Loading picklist data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <h3 className="text-base font-semibold text-red-800 mb-1">Something went wrong</h3>
          <p className="text-sm text-red-600 break-words">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">Picklist performance overview</p>
          </div>
          <div className="w-full sm:w-auto">
            <DateSelector setDate={setDate} date={date} label="Filter by Date" />
          </div>
        </div>

        <div className="bg-white rounded-2xl  p-4 sm:p-6 lg:p-8">
          <Stats records={records} namesMap={namesMap} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
