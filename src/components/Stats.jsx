import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const invalidRackSpaces = ['default', 'virtual', '`virtual', '`default'];

const isInvalidRackSpace = (rackSpace) => {
  if (!rackSpace) return true;
  const normalized = rackSpace.toLowerCase().replace(/['"`]/g, '').trim();
  const parts = normalized.split(',').map((p) => p.trim());
  return parts.some((part) => invalidRackSpaces.includes(part));
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// const Stats = ({ records = [], namesMap = {} }) => {
//   const [expandedEmployee, setExpandedEmployee] = useState(null);

//   const employeeStats = useMemo(() => {
//     const employeeGroups = {};

//     records.forEach((r) => {
//       const empKey = r.employee_id ?? 'unknown';
//       const channelKey = r.channel ?? 'unknown';

//       if (!employeeGroups[empKey]) {
//         employeeGroups[empKey] = {
//           employee_id: r.employee_id,
//           channels: {}, // channelKey -> items[]
//           createdAt: r.createdAt,
//           picklistIds: new Set(),
//         };
//       }

//       const empGroup = employeeGroups[empKey];
//       empGroup.picklistIds.add(r.picklist_id);

//       if (
//         r.createdAt &&
//         (!empGroup.createdAt || new Date(r.createdAt) < new Date(empGroup.createdAt))
//       ) {
//         empGroup.createdAt = r.createdAt;
//       }

//       if (!empGroup.channels[channelKey]) {
//         empGroup.channels[channelKey] = {
//           channel: r.channel,
//           items: [],
//         };
//       }
//       empGroup.channels[channelKey].items.push(r);
//     });

//     return Object.values(employeeGroups)
//       .map((empGroup) => {
//         const channelStats = Object.values(empGroup.channels)
//           .map((chGroup) => {
//             const expectedItems = chGroup.items.filter((r) => !isInvalidRackSpace(r.rackSpace));
//             const foundItems = expectedItems.filter((r) => r.status?.toLowerCase() === 'found');
//             const missingItems = expectedItems.filter((r) => r.status?.toLowerCase() !== 'found');

//             const expected = expectedItems.length;
//             const found = foundItems.length;
//             const efficiency = expected > 0 ? Math.round((found / expected) * 100) : 0;

//             return {
//               channel: chGroup.channel,
//               expected,
//               found,
//               missing: missingItems.length,
//               efficiency,
//               foundItems,
//               missingItems,
//             };
//           })
//           .sort((a, b) => String(a.channel ?? '').localeCompare(String(b.channel ?? '')));

//         const totalExpected = channelStats.reduce((sum, c) => sum + c.expected, 0);
//         const totalFound = channelStats.reduce((sum, c) => sum + c.found, 0);
//         const totalMissing = channelStats.reduce((sum, c) => sum + c.missing, 0);
//         const overallEfficiency =
//           totalExpected > 0 ? Math.round((totalFound / totalExpected) * 100) : 0;

//         return {
//           employee_id: empGroup.employee_id,
//           employee_name: namesMap[empGroup.employee_id] || '',
//           createdAt: empGroup.createdAt,
//           channelCount: channelStats.length,
//           picklistCount: empGroup.picklistIds.size,
//           totalExpected,
//           totalFound,
//           totalMissing,
//           overallEfficiency,
//           channels: channelStats,
//         };
//       })
//       .sort((a, b) => {
//         const idA = Number(a.employee_id);
//         const idB = Number(b.employee_id);
//         if (!isNaN(idA) && !isNaN(idB)) return idA - idB;
//         return String(a.employee_id ?? '').localeCompare(String(b.employee_id ?? ''));
//       });
//   }, [records, namesMap]);

//   /* ---------- PDF Export (single employee, all channels) ---------- */
//   const exportEmployeePDF = (data) => {
//     const doc = new jsPDF({
//       orientation: 'portrait',
//       unit: 'pt',
//       format: 'a4',
//     });
//     const pageWidth = doc.internal.pageSize.getWidth();

//     doc.setFontSize(16);
//     doc.setFont('helvetica', 'bold');
//     doc.text('Missing Pieces Report', pageWidth / 2, 40, { align: 'center' });

//     doc.setFontSize(10);
//     doc.setFont('helvetica', 'normal');
//     const metaY = 70;

//     const employeeLine = data.employee_name
//       ? `Employee: ${data.employee_id ?? '—'} (${data.employee_name})`
//       : `Employee ID: ${data.employee_id ?? '—'}`;

//     doc.text(employeeLine, 40, metaY);
//     doc.text(`Channels: ${data.channelCount}   Picklists: ${data.picklistCount}`, 40, metaY + 16);
//     doc.text(`Earliest Picklist Time: ${formatDateTime(data.createdAt)}`, 40, metaY + 32);
//     doc.text(
//       `Expected: ${data.totalExpected}   Found: ${data.totalFound}   Missing: ${data.totalMissing}   Efficiency: ${data.overallEfficiency}%`,
//       40,
//       metaY + 48
//     );

//     // Flatten missing items across channels, with a Channel column
//     const allMissing = data.channels.flatMap((ch) =>
//       ch.missingItems.map((item) => ({ ...item, __channel: ch.channel }))
//     );

//     autoTable(doc, {
//       startY: metaY + 68,
//       head: [['#', 'Channel', 'Style Number', 'Size', 'Rack Space']],
//       body: allMissing.map((item, idx) => [
//         idx + 1,
//         item.__channel ?? '—',
//         item.style_number ?? '—',
//         item.size ?? '—',
//         item.rackSpace?.replace(/['"`]/g, '') ?? '—',
//       ]),
//       theme: 'grid',
//       styles: { fontSize: 9, cellPadding: 6 },
//       headStyles: {
//         fillColor: [220, 38, 38],
//         textColor: 255,
//         fontStyle: 'bold',
//       },
//       alternateRowStyles: { fillColor: [254, 242, 242] },
//       didDrawPage: () => {
//         const total = doc.internal.pageSize.getNumberOfPages?.() || doc.internal.getNumberOfPages();
//         doc.setFontSize(9);
//         doc.text(
//           `Page ${total}`,
//           doc.internal.pageSize.getWidth() - 60,
//           doc.internal.pageSize.getHeight() - 20
//         );
//       },
//     });

//     doc.save(`Missing_Employee_${data.employee_id}_${new Date().toISOString().slice(0, 10)}.pdf`);
//   };

//   if (!employeeStats.length) {
//     return (
//       <div className="w-full my-4 sm:my-6 p-6 sm:p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
//         No records available.
//       </div>
//     );
//   }

//   return (
//     <div className="w-full my-4 sm:my-6 bg-white rounded-xl">
//       {/* Header */}
//       <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
//         <div>
//           <h2 className="text-lg sm:text-xl font-semibold text-slate-900 m-0">
//             Employee Performance
//           </h2>
//           <p className="text-xs sm:text-sm text-slate-500 mt-1">
//             {employeeStats.length} employee
//             {employeeStats.length > 1 ? 's' : ''} · Grouped by <strong>employee_id</strong>
//           </p>
//         </div>
//         <button
//           onClick={() => exportEmployeePDF(employeeStats[0])}
//           className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors w-full sm:w-auto"
//         >
//           <PdfIcon />
//           Export Missing (PDF)
//         </button>
//       </div>

//       {/* ---------- List: employee cards, expandable to channel breakdown ---------- */}
//       <div>
//         {employeeStats.map((emp) => {
//           const isOpen = expandedEmployee === emp.employee_id;
//           const effText =
//             emp.overallEfficiency >= 80
//               ? 'text-green-600'
//               : emp.overallEfficiency >= 50
//                 ? 'text-amber-600'
//                 : 'text-red-600';
//           const effBar =
//             emp.overallEfficiency >= 80
//               ? 'bg-green-500'
//               : emp.overallEfficiency >= 50
//                 ? 'bg-amber-500'
//                 : 'bg-red-500';

//           return (
//             <div key={emp.employee_id} className="border-b  border-b-gray-200 overflow-hidden">
//               {/* Employee summary row */}
//               <button
//                 type="button"
//                 onClick={() => setExpandedEmployee(isOpen ? null : emp.employee_id)}
//                 className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-white hover:bg-slate-50 transition-colors text-left"
//               >
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 flex-wrap">
//                     <span className="text-sm font-semibold text-slate-800">
//                       #{emp.employee_id ?? '—'}
//                     </span>
//                     {emp.employee_name ? (
//                       <span className="text-xs text-slate-500">{emp.employee_name}</span>
//                     ) : (
//                       <span className="text-xs text-slate-300">loading…</span>
//                     )}
//                     <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-700">
//                       {emp.channelCount} channel{emp.channelCount > 1 ? 's' : ''}
//                     </span>
//                   </div>
//                   <p className="text-xs text-slate-500 mt-1">
//                     {formatDateTime(emp.createdAt)} · {emp.picklistCount} picklist
//                     {emp.picklistCount > 1 ? 's' : ''}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-4 sm:gap-6 text-sm">
//                   <div className="text-center">
//                     <div className="font-semibold text-blue-600">{emp.totalExpected}</div>
//                     <div className="text-[10px] uppercase text-slate-400">Expected</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="font-semibold text-green-600">{emp.totalFound}</div>
//                     <div className="text-[10px] uppercase text-slate-400">Found</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="font-semibold text-red-600">{emp.totalMissing}</div>
//                     <div className="text-[10px] uppercase text-slate-400">Missing</div>
//                   </div>
//                   <div className="w-28">
//                     <div className="flex items-center gap-2">
//                       <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
//                         <div
//                           className={`h-full rounded-full ${effBar}`}
//                           style={{ width: `${emp.overallEfficiency}%` }}
//                         />
//                       </div>
//                       <span className={`text-xs font-bold ${effText}`}>
//                         {emp.overallEfficiency}%
//                       </span>
//                     </div>
//                   </div>
//                   <button
//                     type="button"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       exportEmployeePDF(emp);
//                     }}
//                     title="Export missing as PDF"
//                     className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors whitespace-nowrap"
//                   >
//                     <PdfIcon className="w-3.5 h-3.5" />
//                     PDF
//                   </button>
//                   <span className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</span>
//                 </div>
//               </button>

//               {/* Channel breakdown */}
//               {isOpen && (
//                 <div className="border-t border-slate-200 bg-slate-50 overflow-x-auto">
//                   <table className="w-full border-collapse text-sm">
//                     <thead>
//                       <tr>
//                         <Th>Channel</Th>
//                         <Th className="text-center">Expected</Th>
//                         <Th className="text-center">Found</Th>
//                         <Th className="text-center">Missing</Th>
//                         <Th>Efficiency</Th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {emp.channels.map((ch, idx) => {
//                         const chEffText =
//                           ch.efficiency >= 80
//                             ? 'text-green-600'
//                             : ch.efficiency >= 50
//                               ? 'text-amber-600'
//                               : 'text-red-600';
//                         const chEffBar =
//                           ch.efficiency >= 80
//                             ? 'bg-green-500'
//                             : ch.efficiency >= 50
//                               ? 'bg-amber-500'
//                               : 'bg-red-500';

//                         return (
//                           <tr
//                             key={ch.channel ?? idx}
//                             className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
//                           >
//                             <Td className="whitespace-nowrap">
//                               <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-700">
//                                 {ch.channel || '—'}
//                               </span>
//                             </Td>
//                             <Td className="text-center font-semibold text-blue-600">
//                               {ch.expected}
//                             </Td>
//                             <Td className="text-center font-semibold text-green-600">{ch.found}</Td>
//                             <Td className="text-center font-semibold text-red-600">{ch.missing}</Td>
//                             <Td>
//                               <div className="flex items-center gap-2 min-w-[110px]">
//                                 <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
//                                   <div
//                                     className={`h-full rounded-full ${chEffBar}`}
//                                     style={{ width: `${ch.efficiency}%` }}
//                                   />
//                                 </div>
//                                 <span className={`text-xs font-bold ${chEffText}`}>
//                                   {ch.efficiency}%
//                                 </span>
//                               </div>
//                             </Td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

const Stats = ({ records = [], namesMap = {} }) => {
  const [expandedEmployee, setExpandedEmployee] = useState(null);

  const employeeStats = useMemo(() => {
    const employeeGroups = {};

    records.forEach((r) => {
      const empKey = r.employee_id ?? 'unknown';
      const channelKey = r.channel ?? 'unknown';

      if (!employeeGroups[empKey]) {
        employeeGroups[empKey] = {
          employee_id: r.employee_id,
          channels: {}, // channelKey -> items[]
          createdAt: r.createdAt,
          picklistIds: new Set(),
        };
      }

      const empGroup = employeeGroups[empKey];
      empGroup.picklistIds.add(r.picklist_id);

      if (
        r.createdAt &&
        (!empGroup.createdAt || new Date(r.createdAt) < new Date(empGroup.createdAt))
      ) {
        empGroup.createdAt = r.createdAt;
      }

      if (!empGroup.channels[channelKey]) {
        empGroup.channels[channelKey] = {
          channel: r.channel,
          items: [],
        };
      }
      empGroup.channels[channelKey].items.push(r);
    });

    return Object.values(employeeGroups)
      .map((empGroup) => {
        const channelStats = Object.values(empGroup.channels)
          .map((chGroup) => {
            const totalOrders = chGroup.items.length;

            const expectedItems = chGroup.items.filter((r) => !isInvalidRackSpace(r.rackSpace));
            const otherItems = chGroup.items.filter((r) => isInvalidRackSpace(r.rackSpace));

            const expectedFoundItems = expectedItems.filter(
              (r) => r.status?.toLowerCase() === 'found'
            );
            const otherFoundItems = otherItems.filter((r) => r.status?.toLowerCase() === 'found');
            const missingItems = expectedItems.filter((r) => r.status?.toLowerCase() !== 'found');

            const expected = expectedItems.length;
            const expectedFound = expectedFoundItems.length;
            const otherFound = otherFoundItems.length;
            const totalFound = expectedFound + otherFound;
            const missing = missingItems.length;
            const efficiency = expected > 0 ? Math.round((expectedFound / expected) * 100) : 0;

            return {
              channel: chGroup.channel,
              totalOrders,
              expected,
              expectedFound,
              otherFound,
              totalFound,
              missing,
              efficiency,
              expectedFoundItems,
              otherFoundItems,
              missingItems,
            };
          })
          .sort((a, b) => String(a.channel ?? '').localeCompare(String(b.channel ?? '')));

        const totalOrders = channelStats.reduce((sum, c) => sum + c.totalOrders, 0);
        const totalExpected = channelStats.reduce((sum, c) => sum + c.expected, 0);
        const totalExpectedFound = channelStats.reduce((sum, c) => sum + c.expectedFound, 0);
        const totalOtherFound = channelStats.reduce((sum, c) => sum + c.otherFound, 0);
        const totalFoundAll = totalExpectedFound + totalOtherFound;
        const totalMissing = channelStats.reduce((sum, c) => sum + c.missing, 0);
        const overallEfficiency =
          totalExpected > 0 ? Math.round((totalExpectedFound / totalExpected) * 100) : 0;

        return {
          employee_id: empGroup.employee_id,
          employee_name: namesMap[empGroup.employee_id] || '',
          createdAt: empGroup.createdAt,
          channelCount: channelStats.length,
          picklistCount: empGroup.picklistIds.size,
          totalOrders,
          totalExpected,
          totalExpectedFound,
          totalOtherFound,
          totalFoundAll,
          totalMissing,
          overallEfficiency,
          channels: channelStats,
        };
      })
      .sort((a, b) => {
        const idA = Number(a.employee_id);
        const idB = Number(b.employee_id);
        if (!isNaN(idA) && !isNaN(idB)) return idA - idB;
        return String(a.employee_id ?? '').localeCompare(String(b.employee_id ?? ''));
      });
  }, [records, namesMap]);

  /* ---------- PDF Export (single employee, all channels) ---------- */
  const exportEmployeePDF = (data) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Missing Pieces Report', pageWidth / 2, 40, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const metaY = 70;

    const employeeLine = data.employee_name
      ? `Employee: ${data.employee_id ?? '—'} (${data.employee_name})`
      : `Employee ID: ${data.employee_id ?? '—'}`;

    doc.text(employeeLine, 40, metaY);
    doc.text(`Channels: ${data.channelCount}   Picklists: ${data.picklistCount}`, 40, metaY + 16);
    doc.text(`Earliest Picklist Time: ${formatDateTime(data.createdAt)}`, 40, metaY + 32);
    doc.text(
      `Total Orders: ${data.totalOrders}   Expected Found: ${data.totalExpectedFound}   Other Found: ${data.totalOtherFound}   Total Found: ${data.totalFoundAll}   Missing: ${data.totalMissing}   Efficiency: ${data.overallEfficiency}%`,
      40,
      metaY + 48
    );

    const allMissing = data.channels.flatMap((ch) =>
      ch.missingItems.map((item) => ({ ...item, __channel: ch.channel }))
    );

    autoTable(doc, {
      startY: metaY + 68,
      head: [['#', 'Channel', 'Style Number', 'Size', 'Rack Space']],
      body: allMissing.map((item, idx) => [
        idx + 1,
        item.__channel ?? '—',
        item.style_number ?? '—',
        item.size ?? '—',
        item.rackSpace?.replace(/['"`]/g, '') ?? '—',
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 6 },
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      didDrawPage: () => {
        const total = doc.internal.pageSize.getNumberOfPages?.() || doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(
          `Page ${total}`,
          doc.internal.pageSize.getWidth() - 60,
          doc.internal.pageSize.getHeight() - 20
        );
      },
    });

    doc.save(`Missing_Employee_${data.employee_id}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (!employeeStats.length) {
    return (
      <div className="w-full my-4 sm:my-6 p-6 sm:p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        No records available.
      </div>
    );
  }

  return (
    <div className="w-full my-4 sm:my-6 bg-white rounded-xl">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 m-0">
            Employee Performance
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {employeeStats.length} employee
            {employeeStats.length > 1 ? 's' : ''} · Grouped by <strong>employee_id</strong>
          </p>
        </div>
        <button
          onClick={() => exportEmployeePDF(employeeStats[0])}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors w-full sm:w-auto"
        >
          <PdfIcon />
          Export Missing (PDF)
        </button>
      </div>

      {/* ---------- List: employee cards, expandable to channel breakdown ---------- */}
      <div>
        {employeeStats.map((emp) => {
          const isOpen = expandedEmployee === emp.employee_id;
          const effText =
            emp.overallEfficiency >= 80
              ? 'text-green-600'
              : emp.overallEfficiency >= 50
                ? 'text-amber-600'
                : 'text-red-600';
          const effBar =
            emp.overallEfficiency >= 80
              ? 'bg-green-500'
              : emp.overallEfficiency >= 50
                ? 'bg-amber-500'
                : 'bg-red-500';

          return (
            <div key={emp.employee_id} className="border-b  border-b-gray-200 overflow-hidden">
              {/* Employee summary row */}
              <button
                type="button"
                onClick={() => setExpandedEmployee(isOpen ? null : emp.employee_id)}
                className="w-full flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-white hover:bg-slate-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-slate-800">
                      #{emp.employee_id ?? '—'}
                    </span>
                    {emp.employee_name ? (
                      <span className="text-xs text-slate-500">{emp.employee_name}</span>
                    ) : (
                      <span className="text-xs text-slate-300">loading…</span>
                    )}
                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-700">
                      {emp.channelCount} channel{emp.channelCount > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDateTime(emp.createdAt)} · {emp.picklistCount} picklist
                    {emp.picklistCount > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-slate-700">{emp.totalOrders}</div>
                    <div className="text-[10px] uppercase text-slate-400">Total Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-600">{emp.totalExpected}</div>
                    <div className="text-[10px] uppercase text-slate-400">Total Expected</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{emp.totalExpectedFound}</div>
                    <div className="text-[10px] uppercase text-slate-400">Expected Found</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">{emp.totalOtherFound}</div>
                    <div className="text-[10px] uppercase text-slate-400">Other Found</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{emp.totalFoundAll}</div>
                    <div className="text-[10px] uppercase text-slate-400">Total Found</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">{emp.totalMissing}</div>
                    <div className="text-[10px] uppercase text-slate-400">Missing</div>
                  </div>
                  <div className="w-28">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${effBar}`}
                          style={{ width: `${emp.overallEfficiency}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${effText}`}>
                        {emp.overallEfficiency}%
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      exportEmployeePDF(emp);
                    }}
                    title="Export missing as PDF"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors whitespace-nowrap"
                  >
                    <PdfIcon className="w-3.5 h-3.5" />
                    PDF
                  </button>
                  <span className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {/* Channel breakdown */}
              {isOpen && (
                <div className="border-t border-slate-200 bg-slate-50 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        <Th>Channel</Th>
                        <Th className="text-center">Total Orders</Th>
                        <Th className="text-center">Expected</Th>
                        <Th className="text-center">Expected Found</Th>
                        <Th className="text-center">Other Found</Th>
                        <Th className="text-center">Total Found</Th>
                        <Th className="text-center">Missing</Th>
                        <Th>Efficiency</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {emp.channels.map((ch, idx) => {
                        const chEffText =
                          ch.efficiency >= 80
                            ? 'text-green-600'
                            : ch.efficiency >= 50
                              ? 'text-amber-600'
                              : 'text-red-600';
                        const chEffBar =
                          ch.efficiency >= 80
                            ? 'bg-green-500'
                            : ch.efficiency >= 50
                              ? 'bg-amber-500'
                              : 'bg-red-500';

                        return (
                          <tr
                            key={ch.channel ?? idx}
                            className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                          >
                            <Td className="whitespace-nowrap">
                              <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-700">
                                {ch.channel || '—'}
                              </span>
                            </Td>
                            <Td className="text-center font-semibold text-slate-700">
                              {ch.totalOrders}
                            </Td>
                            <Td className="text-center font-semibold text-slate-600">
                              {ch.expected}
                            </Td>
                            <Td className="text-center font-semibold text-blue-600">
                              {ch.expectedFound}
                            </Td>
                            <Td className="text-center font-semibold text-purple-600">
                              {ch.otherFound}
                            </Td>
                            <Td className="text-center font-semibold text-green-600">
                              {ch.totalFound}
                            </Td>
                            <Td className="text-center font-semibold text-red-600">{ch.missing}</Td>
                            <Td>
                              <div className="flex items-center gap-2 min-w-[110px]">
                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${chEffBar}`}
                                    style={{ width: `${ch.efficiency}%` }}
                                  />
                                </div>
                                <span className={`text-xs font-bold ${chEffText}`}>
                                  {ch.efficiency}%
                                </span>
                              </div>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- Mobile Card ---------- */

const PicklistCard = ({ data, onView, onExport }) => {
  const effText =
    data.efficiency >= 80
      ? 'text-green-600'
      : data.efficiency >= 50
        ? 'text-amber-600'
        : 'text-red-600';
  const effBar =
    data.efficiency >= 80 ? 'bg-green-500' : data.efficiency >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="rounded-xl p-4 bg-white ">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
            Picklist
          </div>
          <div className="text-base font-bold text-slate-900 truncate">#{data.picklist_id}</div>
        </div>
        <span className="shrink-0 inline-block px-2.5 py-1 bg-slate-100 rounded-md text-xs font-semibold text-slate-700">
          {data.channel || '—'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
            Employee
          </div>
          <div className="text-sm font-semibold text-slate-800 truncate">
            {data.employee_id ?? '—'}
          </div>
          {data.employee_name ? (
            <div className="text-xs text-slate-500 truncate">{data.employee_name}</div>
          ) : (
            <div className="text-xs text-slate-300 truncate">loading…</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
            Time
          </div>
          <div className="text-xs font-medium text-slate-700">{formatDateTime(data.createdAt)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 py-2 flex flex-col items-center">
          <span className="text-lg font-bold text-blue-600 leading-tight">{data.expected}</span>
          <span className="text-[10px] text-slate-600 uppercase tracking-wide mt-0.5">
            Expected
          </span>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 py-2 flex flex-col items-center">
          <span className="text-lg font-bold text-green-600 leading-tight">{data.found}</span>
          <span className="text-[10px] text-slate-600 uppercase tracking-wide mt-0.5">Found</span>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 py-2 flex flex-col items-center">
          <span className="text-lg font-bold text-red-600 leading-tight">{data.missing}</span>
          <span className="text-[10px] text-slate-600 uppercase tracking-wide mt-0.5">Missing</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
            Efficiency
          </span>
          <span className={`text-xs font-bold ${effText}`}>{data.efficiency}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${effBar}`}
            style={{ width: `${data.efficiency}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={onView}
          className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          View Details
        </button>
        <button
          onClick={onExport}
          className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
          title="Export missing as PDF"
        >
          <PdfIcon className="w-3.5 h-3.5" />
          PDF
        </button>
      </div>
    </div>
  );
};

/* ---------- Modal ---------- */

const PicklistModal = ({ data, onClose, onExport }) => {
  const [activeTab, setActiveTab] = useState('missing');

  const effText =
    data.efficiency >= 80
      ? 'text-green-600'
      : data.efficiency >= 50
        ? 'text-amber-600'
        : 'text-red-600';
  const effBar =
    data.efficiency >= 80 ? 'bg-green-500' : data.efficiency >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 p-4 sm:p-5 border-b border-slate-200">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 m-0">
              Picklist #{data.picklist_id}
            </h3>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
              <Badge
                label="Employee"
                value={
                  data.employee_name
                    ? `${data.employee_id ?? '—'} · ${data.employee_name}`
                    : data.employee_id
                }
              />
              <Badge label="Channel" value={data.channel} />
              <Badge label="Time" value={formatDateTime(data.createdAt)} />
              <Badge label="Efficiency" value={`${data.efficiency}%`} valueClass={effText} />
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              <PdfIcon className="w-3.5 h-3.5" />
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-100"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-4 sm:px-5 pt-4">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${effBar}`}
              style={{ width: `${data.efficiency}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 p-4 sm:p-5">
          <KpiCard
            label="Expected"
            value={data.expected}
            className="bg-blue-50 border-blue-500 text-blue-600"
          />
          <KpiCard
            label="Found"
            value={data.found}
            className="bg-green-50 border-green-500 text-green-600"
          />
          <KpiCard
            label="Missing"
            value={data.missing}
            className="bg-red-50 border-red-500 text-red-600"
          />
        </div>

        <div className="flex gap-1 sm:gap-2 border-b border-slate-200 px-2 sm:px-5">
          <TabBtn
            active={activeTab === 'missing'}
            onClick={() => setActiveTab('missing')}
            label={`Missing (${data.missing})`}
            activeClass="text-red-600 border-red-600 font-semibold"
          />
          <TabBtn
            active={activeTab === 'found'}
            onClick={() => setActiveTab('found')}
            label={`Found (${data.found})`}
            activeClass="text-green-600 border-green-600 font-semibold"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-3 sm:px-5 pb-4 sm:pb-5">
          {activeTab === 'missing' ? (
            <ItemsTable
              items={data.missingItems}
              emptyText="🎉 No missing items — everything is found!"
              accent="red"
              showStatus
            />
          ) : (
            <ItemsTable items={data.foundItems} emptyText="No found items yet." accent="green" />
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------- Sub-components ---------- */

const PdfIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <polyline points="9 15 12 18 15 15" />
  </svg>
);

const Badge = ({ label, value, valueClass = 'text-slate-800' }) => (
  <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs max-w-full">
    <span className="text-slate-500 uppercase tracking-wide shrink-0">{label}:</span>
    <span className={`font-semibold truncate ${valueClass}`}>{value ?? '—'}</span>
  </span>
);

const KpiCard = ({ label, value, className }) => (
  <div className={`px-2 sm:px-4 py-3 rounded-lg border flex flex-col items-center ${className}`}>
    <span className="text-xl sm:text-2xl font-bold leading-tight">{value}</span>
    <span className="text-[10px] sm:text-xs text-slate-600 mt-1 uppercase tracking-wide">
      {label}
    </span>
  </div>
);

const TabBtn = ({ active, onClick, label, activeClass }) => (
  <button
    onClick={onClick}
    className={`bg-transparent border-none px-3 sm:px-4 py-2.5 text-xs sm:text-sm cursor-pointer transition-all border-b-[3px] whitespace-nowrap ${
      active ? activeClass : 'text-slate-500 border-transparent hover:text-slate-700'
    }`}
  >
    {label}
  </button>
);

const ItemsTable = ({ items, emptyText, accent, showStatus = false }) => {
  const accentClasses = {
    red: 'border-red-500 text-red-600',
    green: 'border-green-500 text-green-600',
  };

  if (!items.length) {
    return <div className="p-6 sm:p-8 text-center text-slate-500 text-sm">{emptyText}</div>;
  }

  return (
    <div className="overflow-x-auto -mx-1 sm:mx-0">
      <table className="w-full border-collapse text-sm mt-4 min-w-[480px]">
        <thead>
          <tr>
            <Th>#</Th>
            <Th>Style Number</Th>
            <Th>Size</Th>
            <Th>Rack Space</Th>
            {showStatus && <Th>Status</Th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item._id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <Td>{idx + 1}</Td>
              <Td className="font-semibold whitespace-nowrap">{item.style_number || '—'}</Td>
              <Td>
                <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs font-semibold text-slate-700">
                  {item.size || '—'}
                </span>
              </Td>
              <Td>
                <span
                  className={`inline-block px-2 py-0.5 bg-white border rounded text-xs font-semibold whitespace-nowrap ${accentClasses[accent]}`}
                >
                  {item.rackSpace?.replace(/['"`]/g, '') || '—'}
                </span>
              </Td>
              {showStatus && (
                <Td>
                  <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-semibold whitespace-nowrap">
                    {item.status || '—'}
                  </span>
                </Td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Th = ({ children, className = '' }) => (
  <th
    className={`text-left px-3 sm:px-3.5 py-2.5 bg-slate-50 text-slate-600 font-semibold text-[11px] sm:text-xs uppercase tracking-wide border-b border-slate-200 whitespace-nowrap ${className}`}
  >
    {children}
  </th>
);

const Td = ({ children, className = '' }) => (
  <td className={`px-3 sm:px-3.5 py-2.5 text-slate-800 ${className}`}>{children}</td>
);

export default Stats;
