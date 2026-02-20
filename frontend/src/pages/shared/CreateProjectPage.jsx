import { useSearchParams } from 'react-router-dom';
import ProjectSubmissionForm from '../../components/project-form/ProjectSubmissionForm';

export default function CreateProjectPage() {
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draft');
  const projectId = searchParams.get('project');

  return (
    <ProjectSubmissionForm
      key={draftId || projectId || 'new'}
      initialDraftId={draftId}
      initialProjectId={projectId}
    />
  );
}
