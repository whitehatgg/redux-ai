import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { effectTracker } from '../store';
import { RootState } from '../store';

export function WorkflowDemoSimple() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<string | null>(null);
  const applicants = useSelector((state: RootState) => state.applicant.applicants);
  
  // Load applicants on mount
  useEffect(() => {
    // Request data from API
    fetch('/api/applicants')
      .then(response => response.json())
      .then(data => {
        // Update Redux store directly to avoid TypeScript issues
        dispatch({ type: 'applicant/setApplicants', payload: data });
      })
      .catch(error => {
        console.error('Error fetching applicants:', error);
      });
  }, [dispatch]);

  const handleRunWorkflow = async () => {
    if (applicants.length === 0) {
      setWorkflowResult('No applicants available to process');
      return;
    }
    
    setLoading(true);
    setWorkflowResult('Starting workflow...');
    
    try {
      // Select a random applicant
      const randomIndex = Math.floor(Math.random() * applicants.length);
      const applicantId = applicants[randomIndex].id;
      
      // Mark the start of the workflow
      dispatch({ 
        type: 'applicant/complexWorkflow/start', 
        payload: applicantId,
        meta: { isEffect: true, effectId: `workflow-${applicantId}` }
      });
      
      // Step 1: Fetch applicant details
      const detailsResponse = await fetch(`/api/applicants/${applicantId}/details`);
      const details = await detailsResponse.json();
      
      // Mock score calculation
      const mockScore = Math.floor(Math.random() * 100);
      
      // Step 2: Update status based on score
      let newStatus = 'pending';
      if (mockScore > 80) {
        newStatus = 'approved';
      } else if (mockScore > 60) {
        newStatus = 'interview';
      } else {
        newStatus = 'rejected';
      }
      
      // Update status via API
      await fetch(`/api/applicants/${applicantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      // Update applicant in list
      dispatch({
        type: 'applicant/updateApplicantStatus/fulfilled',
        payload: { ...applicants[randomIndex], status: newStatus },
      });
      
      // Step 3: Add note
      const noteText = `Automated workflow processed on ${new Date().toISOString()}. Score: ${mockScore}`;
      const notes = details.notes ? details.notes + '\n\n' + noteText : noteText;
      
      // Update notes via API
      await fetch(`/api/applicants/${applicantId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      
      // Mark the workflow as complete
      dispatch({ 
        type: 'applicant/complexWorkflow/complete', 
        payload: applicantId,
        meta: { isEffect: true, effectId: `workflow-${applicantId}`, isEnd: true }
      });
      
      // Wait for all effects to complete as a demonstration
      setWorkflowResult('Waiting for all effects to complete...');
      await effectTracker.waitForEffects();
      
      // Set final result
      setWorkflowResult(`Workflow completed for ${applicants[randomIndex].name} (ID: ${applicantId})`);
    } catch (error) {
      setWorkflowResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 p-6 bg-card border rounded-lg shadow-sm">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Workflow Demo</h2>
        <p className="text-muted-foreground">
          Demonstrates the Redux effect tracking middleware with a complex workflow
        </p>
      </div>
      
      <div className="flex flex-col space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {applicants.map(applicant => (
            <span 
              key={applicant.id}
              className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeClass(applicant.status)}`}
            >
              {applicant.name} ({applicant.status})
            </span>
          ))}
        </div>

        <button 
          onClick={handleRunWorkflow} 
          disabled={loading || applicants.length === 0}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Running Workflow...' : 'Run Workflow on Random Applicant'}
        </button>
        
        {workflowResult && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm font-mono">{workflowResult}</p>
          </div>
        )}
        
        <div className="text-sm text-muted-foreground mt-2">
          <p>This demo:</p>
          <ol className="list-decimal pl-6 space-y-1">
            <li>Selects a random applicant</li>
            <li>Runs a multi-step workflow (fetch details, update status, add note)</li>
            <li>Uses effect tracking middleware to track all async operations</li>
            <li>Waits for all effects to complete before finishing</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function getBadgeClass(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 border border-green-200'; // green
    case 'interview':
      return 'bg-purple-100 text-purple-800 border border-purple-200'; // purple
    case 'rejected':
      return 'bg-red-100 text-red-800 border border-red-200'; // red
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200'; // gray
  }
}