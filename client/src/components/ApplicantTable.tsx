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
import { setSearchTerm, toggleSearch, setVisibleColumns, setSortOrder } from '@/store/slices/applicantSlice';

type VisibleColumnKey = keyof Omit<Applicant, 'id'>;
type SortDirection = 'asc' | 'desc';

interface ColumnDef {
  key: VisibleColumnKey;
  label: string;
}

export function ApplicantTable() {
  const dispatch = useDispatch();
  const applicantState = useSelector((state: RootState) => state.applicant);
  const { applicants, tableConfig } = applicantState;

  // Type-safe column definitions
  const allColumns: ColumnDef[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'position', label: 'Position' },
    { key: 'appliedDate', label: 'Applied Date' },
  ];

  const filteredApplicants = applicants.filter((applicant: Applicant) => {
    if (!tableConfig.enableSearch || !tableConfig.searchTerm) return true;
    const searchTerm = tableConfig.searchTerm.toLowerCase();
    return Object.entries(applicant).some(([key, value]) => {
      if (!tableConfig.visibleColumns.includes(key as VisibleColumnKey)) return false;
      return String(value).toLowerCase().includes(searchTerm);
    });
  });

  const toggleColumn = (column: VisibleColumnKey) => {
    const newColumns = tableConfig.visibleColumns.includes(column)
      ? tableConfig.visibleColumns.filter((col: string) => col !== column)
      : [...tableConfig.visibleColumns, column];
    dispatch(setVisibleColumns(newColumns));
  };

  const handleSearchChange = (value: string) => {
    dispatch(setSearchTerm(value));
  };

  const handleSort = (column: VisibleColumnKey) => {
    const direction = column === tableConfig.sortBy && tableConfig.sortOrder === 'asc' ? 'desc' : 'asc';
    dispatch(setSortOrder({ column, direction }));
  };

  const sortedApplicants = [...filteredApplicants].sort((a: Applicant, b: Applicant) => {
    if (!tableConfig.sortBy || !tableConfig.sortOrder) return 0;
    const column = tableConfig.sortBy as VisibleColumnKey;
    const aValue = String(a[column]);
    const bValue = String(b[column]);
    return tableConfig.sortOrder === 'asc' ? 
      aValue.localeCompare(bValue) : 
      bValue.localeCompare(aValue);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-lg bg-muted p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enableSearch"
              checked={tableConfig.enableSearch}
              onCheckedChange={() => dispatch(toggleSearch())}
            />
            <Label htmlFor="enableSearch">Enable Search</Label>
          </div>
          {tableConfig.enableSearch && (
            <div className="flex-1">
              <Input
                placeholder="Search applicants..."
                value={tableConfig.searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
                className="max-w-full md:max-w-sm"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {allColumns.map(({ key, label }) => (
            <div key={String(key)} className="flex items-center gap-2">
              <Checkbox
                id={String(key)}
                checked={tableConfig.visibleColumns.includes(key)}
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
                    tableConfig.visibleColumns.includes(key) && (
                      <TableHead 
                        key={String(key)}
                        className="whitespace-nowrap px-4 py-3.5 cursor-pointer"
                        onClick={() => handleSort(key)}
                      >
                        {label}
                      </TableHead>
                    )
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedApplicants.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableConfig.visibleColumns.length}
                    className="py-4 text-center text-muted-foreground"
                  >
                    No applicants found
                  </TableCell>
                </TableRow>
              ) : (
                sortedApplicants.map((applicant: Applicant) => (
                  <TableRow key={applicant.id}>
                    {allColumns.map(
                      ({ key }) =>
                        tableConfig.visibleColumns.includes(key) && (
                          <TableCell key={`${applicant.id}-${String(key)}`} className="whitespace-nowrap px-4 py-3">
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