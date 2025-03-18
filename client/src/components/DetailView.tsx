import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useParams } from 'wouter';

import { Button } from '@/components/ui/button';
import type { RootState } from '@/store';
import { archiveApplicant, clearSelection, updateApplicantStatus } from '@/store/slices/applicantSlice';

export const DetailView = () => {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const dispatch = useDispatch();
  const applicant = useSelector((state: RootState) => 
    state.applicant.applicants.find(a => a.id === id)
  );

  const handleBack = () => {
    dispatch(clearSelection());
    setLocation('/');
  };

  const handleApprove = () => {
    if (id) {
      dispatch(updateApplicantStatus({ id, status: 'approved' }));
    }
  };

  const handleReject = () => {
    if (id) {
      dispatch(updateApplicantStatus({ id, status: 'rejected' }));
    }
  };

  const handleArchive = () => {
    if (id) {
      dispatch(archiveApplicant(id));
      setLocation('/');
    }
  };

  if (!applicant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-lg text-muted-foreground">Applicant not found</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{applicant.name}</h1>
        <Button variant="outline" onClick={handleBack}>
          Back to Search
        </Button>
      </div>

      <div className="rounded-lg border p-6">
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="mt-1">{applicant.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Position</label>
            <p className="mt-1">{applicant.position}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <p className="mt-1">{applicant.status}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Applied Date</label>
            <p className="mt-1">{applicant.appliedDate}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Button onClick={handleApprove} variant="default">
            Approve
          </Button>
          <Button onClick={handleReject} variant="destructive">
            Reject
          </Button>
          <Button onClick={handleArchive} variant="outline">
            Archive
          </Button>
        </div>
      </div>
    </div>
  );
};