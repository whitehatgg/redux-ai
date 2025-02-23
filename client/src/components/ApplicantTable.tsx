import { useDispatch, useSelector } from 'react-redux';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RootState } from '@/store';
import { setSearchTerm, setVisibleColumns, toggleSearch } from '@/store/slices/applicantSlice';
import type { Applicant } from '@/store/slices/applicantSlice';

export function ApplicantTable() {
  const dispatch = useDispatch();
  const { applicants, tableConfig } = useSelector((state: RootState) => state.applicant);

  // Ensure visibleColumns is always an array
  const visibleColumns = tableConfig?.visibleColumns || [];

  const filteredApplicants = applicants.filter(applicant => {
    if (!tableConfig?.enableSearch || !tableConfig?.searchTerm) return true;
    const searchLower = tableConfig.searchTerm.toLowerCase();
    return Object.entries(applicant).some(([key, value]) => {
      if (!visibleColumns.includes(key as keyof Applicant)) return false;
      return String(value).toLowerCase().includes(searchLower);
    });
  });

  const allColumns: Array<{ key: keyof Applicant; label: string }> = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'position', label: 'Position' },
    { key: 'appliedDate', label: 'Applied Date' },
  ];

  const toggleColumn = (column: keyof Applicant) => {
    const newColumns = visibleColumns.includes(column)
      ? visibleColumns.filter(col => col !== column)
      : [...visibleColumns, column];
    dispatch(setVisibleColumns(newColumns));
  };

  return (
    <div className="space-y-4">
      {/* Controls Section */}
      <div className="flex flex-col gap-4 rounded-lg bg-muted p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enableSearch"
              checked={tableConfig?.enableSearch || false}
              onCheckedChange={checked => dispatch(toggleSearch(checked))}
            />
            <Label htmlFor="enableSearch">Enable Search</Label>
          </div>
          {tableConfig?.enableSearch && (
            <div className="flex-1">
              <Input
                placeholder="Search applicants..."
                value={tableConfig?.searchTerm || ''}
                onChange={e => dispatch(setSearchTerm(e.target.value))}
                className="max-w-full md:max-w-sm"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {allColumns.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={visibleColumns.includes(key)}
                onCheckedChange={() => toggleColumn(key)}
              />
              <Label htmlFor={key} className="text-sm">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="-mx-4 overflow-x-auto sm:mx-0 sm:rounded-lg sm:border">
        <div className="min-w-full align-middle">
          <Table>
            <TableHeader>
              <TableRow>
                {allColumns.map(
                  ({ key, label }) =>
                    visibleColumns.includes(key) && (
                      <TableHead key={key} className="whitespace-nowrap px-4 py-3.5">
                        {label}
                      </TableHead>
                    )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplicants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="py-4 text-center text-muted-foreground"
                  >
                    No applicants found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplicants.map(applicant => (
                  <TableRow key={applicant.id}>
                    {allColumns.map(
                      ({ key }) =>
                        visibleColumns.includes(key) && (
                          <TableCell key={key} className="whitespace-nowrap px-4 py-3">
                            {applicant[key]}
                          </TableCell>
                        )
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
