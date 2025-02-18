import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import {
  setVisibleColumns,
  toggleSearch,
  setSearchTerm,
  type Applicant
} from '@/store/slices/applicantSlice';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';

export function ApplicantTable() {
  const dispatch = useDispatch();
  const { applicants, tableConfig } = useSelector((state: RootState) => state.applicant);

  const filteredApplicants = applicants.filter(applicant => {
    if (!tableConfig.enableSearch || !tableConfig.searchTerm) return true;
    const searchLower = tableConfig.searchTerm.toLowerCase();
    return Object.entries(applicant).some(([key, value]) => {
      if (!tableConfig.visibleColumns.includes(key as keyof Applicant)) return false;
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
    const newColumns = tableConfig.visibleColumns.includes(column)
      ? tableConfig.visibleColumns.filter(col => col !== column)
      : [...tableConfig.visibleColumns, column];
    dispatch(setVisibleColumns(newColumns));
  };

  return (
    <div className="space-y-4">
      {/* Controls Section */}
      <div className="flex flex-col gap-4 p-4 bg-muted rounded-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="enableSearch"
              checked={tableConfig.enableSearch}
              onCheckedChange={() => dispatch(toggleSearch(undefined))}
            />
            <Label htmlFor="enableSearch">Enable Search</Label>
          </div>
          {tableConfig.enableSearch && (
            <div className="w-full sm:w-auto flex-1">
              <Input
                placeholder="Search applicants..."
                value={tableConfig.searchTerm}
                onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                className="max-w-sm"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {allColumns.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={tableConfig.visibleColumns.includes(key)}
                onCheckedChange={() => toggleColumn(key)}
              />
              <Label htmlFor={key}>{label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {allColumns.map(({ key, label }) => (
                tableConfig.visibleColumns.includes(key) && (
                  <TableHead key={key} className="whitespace-nowrap">{label}</TableHead>
                )
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplicants.map((applicant) => (
              <TableRow key={applicant.id}>
                {allColumns.map(({ key }) => (
                  tableConfig.visibleColumns.includes(key) && (
                    <TableCell key={key} className="whitespace-nowrap">{applicant[key]}</TableCell>
                  )
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}