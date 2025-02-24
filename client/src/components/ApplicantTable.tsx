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
import type { Applicant } from '@/store/schema';
import { setSearchTerm, setVisibleColumns, toggleSearch } from '@/store/slices/applicantSlice';

type VisibleColumnKey = Exclude<keyof Applicant, 'id'>;

export function ApplicantTable() {
  const dispatch = useDispatch();
  const applicantState = useSelector((state: RootState) => state.applicant) as { 
    applicants: Applicant[];
    tableConfig: {
      visibleColumns: VisibleColumnKey[];
      enableSearch: boolean;
      searchTerm: string;
    };
  };
  const { applicants, tableConfig } = applicantState;

  // Ensure visibleColumns is always an array
  const visibleColumns = (tableConfig?.visibleColumns || []) as VisibleColumnKey[];

  const filteredApplicants = applicants.filter((applicant: Applicant) => {
    if (!tableConfig?.enableSearch || !tableConfig?.searchTerm) return true;
    const searchTerm = String(tableConfig.searchTerm).toLowerCase();
    return Object.entries(applicant).some(([key, value]) => {
      if (!visibleColumns.includes(key as VisibleColumnKey)) return false;
      return String(value).toLowerCase().includes(searchTerm);
    });
  });

  const allColumns: Array<{ key: VisibleColumnKey; label: string }> = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'position', label: 'Position' },
    { key: 'appliedDate', label: 'Applied Date' },
  ];

  const toggleColumn = (column: VisibleColumnKey) => {
    const newColumns = visibleColumns.includes(column)
      ? visibleColumns.filter((col: VisibleColumnKey) => col !== column)
      : [...visibleColumns, column];
    dispatch(setVisibleColumns(newColumns));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-lg bg-muted p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enableSearch"
              checked={Boolean(tableConfig?.enableSearch)}
              onCheckedChange={() => dispatch(toggleSearch())}
            />
            <Label htmlFor="enableSearch">Enable Search</Label>
          </div>
          {Boolean(tableConfig?.enableSearch) && (
            <div className="flex-1">
              <Input
                placeholder="Search applicants..."
                value={String(tableConfig?.searchTerm || '')}
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
                id={String(key)}
                checked={visibleColumns.includes(key)}
                onCheckedChange={() => toggleColumn(key)}
              />
              <Label htmlFor={String(key)} className="text-sm">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

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
                filteredApplicants.map((applicant: Applicant) => (
                  <TableRow key={String(applicant.id)}>
                    {allColumns.map(
                      ({ key }) =>
                        visibleColumns.includes(key) && (
                          <TableCell key={key} className="whitespace-nowrap px-4 py-3">
                            {String(applicant[key])}
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