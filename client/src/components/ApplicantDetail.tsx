import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useParams } from 'wouter';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { apiRequest } from '../lib/queryClient';
import type { RootState } from '../store';
import type { Applicant, ApplicantDetails } from '../store/schema';
import {
  addNote,
  approveApplicant,
  clearSelectedApplicant,
  rejectApplicant,
  scheduleInterview,
  selectApplicant,
  setApplicantDetails,
  updateApplicant,
} from '../store/slices/applicantSlice';

export function ApplicantDetail() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { applicants, applicantDetails, selectedApplicantId } = useSelector(
    (state: RootState) => state.applicant
  );

  const applicantId = params.id;
  const [noteText, setNoteText] = useState('');

  // Fetch the applicant if not already in redux state
  const { data: applicantData, isLoading: applicantLoading } = useQuery({
    queryKey: ['/api/applicants', applicantId],
    staleTime: 60000, // 1 minute
    enabled: !!applicantId && !applicants.some(a => a.id === applicantId),
  });

  // Fetch applicant details from server
  const { data: detailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['/api/applicants', applicantId, 'details'],
    staleTime: 60000, // 1 minute
    enabled: !!applicantId,
  });

  // Mutations for updating data
  const statusMutation = useMutation<Applicant, unknown, Applicant['status']>({
    mutationFn: (status: Applicant['status']) =>
      apiRequest<Applicant>(`/api/applicants/${applicantId}/status`, 'PATCH', { status }),
    onSuccess: data => {
      dispatch(updateApplicant(data));
      queryClient.invalidateQueries({ queryKey: ['/api/applicants'] });
    },
  });

  const notesMutation = useMutation<ApplicantDetails, unknown, string>({
    mutationFn: (notes: string) =>
      apiRequest<ApplicantDetails>(`/api/applicants/${applicantId}/notes`, 'PATCH', { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/applicants', applicantId, 'details'] });
    },
  });

  // Set the selected applicant in Redux when the URL parameter changes
  useEffect(() => {
    if (applicantId) {
      dispatch(selectApplicant(applicantId));
    }
  }, [applicantId, dispatch]);

  // Update Redux store with fetched applicant
  useEffect(() => {
    if (applicantData) {
      const data = applicantData as unknown as Record<string, unknown>;
      if (data.id) {
        dispatch(updateApplicant(applicantData as Applicant));
      }
    }
  }, [applicantData, dispatch]);

  // Update Redux store with fetched details
  useEffect(() => {
    if (detailsData) {
      dispatch(setApplicantDetails(detailsData as ApplicantDetails));
    }
  }, [detailsData, dispatch]);

  // Update note text when applicant details change
  useEffect(() => {
    if (applicantDetails?.notes) {
      setNoteText(applicantDetails.notes);
    } else {
      setNoteText('');
    }
  }, [applicantDetails]);

  // Find the selected applicant in the redux store
  const selectedApplicant = applicants.find(a => a.id === applicantId);

  const isLoading = applicantLoading || detailsLoading;

  if (isLoading) {
    return <div className="p-8 text-center">Loading applicant details...</div>;
  }

  if (!selectedApplicant) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-lg font-semibold">No applicant found</h3>
        <Button
          className="mt-4"
          onClick={() => {
            dispatch(clearSelectedApplicant());
            setLocation('/');
          }}
        >
          Back to List
        </Button>
      </div>
    );
  }

  const handleAddNote = () => {
    notesMutation.mutate(noteText);
    dispatch(addNote(noteText));
  };

  const handleApprove = () => {
    statusMutation.mutate('approved');
    dispatch(approveApplicant());
  };

  const handleReject = () => {
    statusMutation.mutate('rejected');
    dispatch(rejectApplicant());
  };

  const handleScheduleInterview = () => {
    statusMutation.mutate('interview');
    dispatch(scheduleInterview());
  };

  const getStatusBadgeColor = (status: Applicant['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'interview':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            // Clear selection will trigger the central navigation to redirect to home
            dispatch(clearSelectedApplicant());
            setLocation('/');
          }}
        >
          ← Back to Applicants
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-green-500 hover:bg-green-50"
            onClick={handleApprove}
            disabled={statusMutation.isPending}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            className="border-blue-500 hover:bg-blue-50"
            onClick={handleScheduleInterview}
            disabled={statusMutation.isPending}
          >
            Schedule Interview
          </Button>
          <Button
            variant="outline"
            className="border-red-500 hover:bg-red-50"
            onClick={handleReject}
            disabled={statusMutation.isPending}
          >
            Reject
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{selectedApplicant.name}</CardTitle>
            <CardDescription>
              {selectedApplicant.position} • Applied on {selectedApplicant.appliedDate}
            </CardDescription>
            <span
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeColor(
                selectedApplicant.status
              )}`}
            >
              {selectedApplicant.status.charAt(0).toUpperCase() + selectedApplicant.status.slice(1)}
            </span>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                <p className="mt-1">{selectedApplicant.email}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Skills</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {applicantDetails?.skills?.map(skill => (
                    <span
                      key={skill}
                      className="bg-primary-100 text-primary-800 rounded-full px-3 py-1 text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Add private notes about this applicant</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[120px]"
              placeholder="Add notes about this candidate..."
              value={noteText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNoteText(e.target.value)}
              disabled={notesMutation.isPending}
            />
            <Button className="mt-4" onClick={handleAddNote} disabled={notesMutation.isPending}>
              {notesMutation.isPending ? 'Saving...' : 'Save Notes'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {applicantDetails?.experience && applicantDetails.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applicantDetails.experience.map((exp, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{exp.role}</h3>
                    <span className="text-sm text-muted-foreground">{exp.duration}</span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{exp.company}</p>
                  <p className="text-sm">{exp.description}</p>
                  {index < (applicantDetails.experience?.length || 0) - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {applicantDetails?.education && applicantDetails.education.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Education</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applicantDetails.education.map((edu, index) => (
                <div key={index} className="space-y-1">
                  <h3 className="font-medium">{edu.degree}</h3>
                  <p className="text-sm text-muted-foreground">
                    {edu.institution} • {edu.year}
                  </p>
                  {index < (applicantDetails.education?.length || 0) - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
