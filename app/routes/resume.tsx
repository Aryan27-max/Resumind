import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import ATS from '~/components/feedback/ATS';
import Details from '~/components/feedback/Details';
import Summary from '~/components/feedback/Summary';
import { usePuterStore } from '~/lib/puter';
import type { Route } from './+types/resume';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Resumind | Resume Review' },
    { name: 'description', content: 'A detailed overview of your resume' },
  ];
}

const ResumePage = () => {
  const { id } = useParams();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { auth, isLoading, fs, kv } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate(`/auth?next=/resume/${id}`);
    }
  }, [isLoading, auth.isAuthenticated, navigate, id]);

  useEffect(() => {
    let objectUrl: string | null = null;

    const loadResume = async () => {
      try {
        const resume = await kv.get(`resume:${id}`);
        if (!resume) return;

        const data = JSON.parse(resume);
        const resumeBlob = await fs.read(data.resumePath);
        if (!resumeBlob) return;

        const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(pdfBlob);
        setResumeUrl(objectUrl);
        setFeedback(data.feedback);
      } catch (error) {
        console.error('Failed to load resume:', error);
      }
    };
    loadResume();

    // Cleanup: Revoke object URL to prevent memory leaks
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id, kv, fs]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover lg:h-[100vh] sticky top-0 !flex !items-center !justify-center">
          {resumeUrl && (
            <div
              className="animate-in fade-in duration-1000 w-full flex items-center justify-center"
              style={{ height: 'calc(100vh - 100px)' }}
            >
              <div className="gradient-border shadow-lg w-full max-w-[650px] h-full">
                <div className="bg-white w-full h-full overflow-hidden flex items-center justify-center">
                  <iframe
                    src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitV&page=1`}
                    className="w-full h-full"
                    style={{
                      border: 'none',
                      display: 'block',
                      margin: '0 auto',
                      padding: 0,
                    }}
                    title="Resume PDF"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
              <Details feedback={feedback} />
            </div>
          ) : (
            <img src="/images/resume-scan-2.gif" className="w-full" />
          )}
        </section>
      </div>
    </main>
  );
};

export default ResumePage;
