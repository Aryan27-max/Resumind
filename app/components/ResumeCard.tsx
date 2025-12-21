import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import ScoreCircle from '~/components/ScoreCircle';
import { usePuterStore } from '~/lib/puter';

const ResumeCard = ({ resume, onDelete }: { resume: Resume; onDelete?: (id: string) => void }) => {
  const { fs, kv } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadResume = async () => {
      // Check if imagePath exists and is valid
      if (!resume.imagePath) {
        console.warn(`Resume has no imagePath: ${resume.id}`);
        setResumeUrl(null); // Ensure no broken image is displayed
        return;
      }

      try {
        const blob = await fs.read(resume.imagePath);
        if (!blob) {
          console.warn(
            `Failed to read image blob for resume: ${resume.id} at path ${resume.imagePath}`,
          );
          setResumeUrl(null);
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setResumeUrl(objectUrl);
      } catch (error: any) {
        console.error(`Failed to load resume image for ${resume.id}:`, error);
        setResumeUrl(null); // Clear URL on error
      }
    };
    loadResume();
    setScore(resume.feedback.overallScore);

    // Cleanup: Revoke object URL to prevent memory leaks
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [resume.imagePath, resume.id, resume.feedback.overallScore, fs]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete files from storage
      if (resume.resumePath) {
        try {
          await fs.delete(resume.resumePath);
        } catch (fileError: any) {
          // If file already doesn't exist, that's fine
          if (fileError.code !== 'subject_does_not_exist') {
            console.error('Failed to delete resume PDF file:', fileError);
          }
        }
      }
      if (resume.imagePath) {
        try {
          await fs.delete(resume.imagePath);
        } catch (fileError: any) {
          // If file already doesn't exist, that's fine
          if (fileError.code !== 'subject_does_not_exist') {
            console.error('Failed to delete resume image file:', fileError);
          }
        }
      }

      // Delete from KV store
      await kv.delete(`resume:${resume.id}`);

      // Notify parent component
      onDelete?.(resume.id);
    } catch (error: any) {
      console.error('Failed to delete resume:', error);
      alert(
        `Failed to delete resume: ${error.message || 'An unexpected error occurred'}. Please try again.`,
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative resume-card animate-in fade-in duration-1000 group">
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-3 right-3 z-50
                   bg-white/80 hover:bg-red-500
                   backdrop-blur-sm
                   text-gray-700 hover:text-white
                   disabled:bg-gray-300 disabled:text-gray-500
                   rounded-full p-2
                   shadow-md hover:shadow-lg
                   transition-all duration-300 ease-in-out
                   hover:scale-110 active:scale-95
                   flex items-center justify-center
                   border border-gray-200 hover:border-red-500
                   opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Delete resume"
        aria-label="Delete resume"
      >
        {isDeleting ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      <Link to={`/resume/${resume.id}`} className="block w-full h-full">
        <div className="resume-card-header">
          <div className="flex flex-col gap-2">
            {resume.companyName && (
              <h2 className="!text-black font-bold break-words">{resume.companyName}</h2>
            )}
            {resume.jobTitle && (
              <h3 className="text-lg break-words text-gray-500">{resume.jobTitle}</h3>
            )}
            {!resume.companyName && !resume.jobTitle && (
              <h2 className="!text-black font-bold">Resume</h2>
            )}
          </div>
          <div className="flex-shrink-0">
            <ScoreCircle score={score} />
          </div>
        </div>
        {resumeUrl && (
          <div className="gradient-border animate-in fade-in duration-1000">
            <div className=" w-full h-full">
              <img
                src={resumeUrl}
                alt={`${resume.companyName || 'Resume'} - ${resume.jobTitle || 'Job Application'} resume thumbnail`}
                className="w-full h-[350px] max-sm:h-[200px] object-cover object-top"
              />
            </div>
          </div>
        )}
      </Link>
    </div>
  );
};

export default ResumeCard;
