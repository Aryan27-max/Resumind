import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import ResumeCard from '~/components/ResumeCard';
import { usePuterStore } from '~/lib/puter';
import Navbar from '../components/Navbar';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Resumind' },
    { name: 'description', content: 'Smart feedback for your dream job' },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate('/auth?next=/');
    }
  }, [auth.isAuthenticated, navigate]);

  const loadResumes = useCallback(async () => {
    setLoadingResumes(true);
    try {
      const resumes = (await kv.list('resume:*', true)) as KVItem[];

      const parsedResumes = resumes
        ?.map((resume) => {
          try {
            const data = JSON.parse(resume.value);
            return data as Resume;
          } catch (parseError) {
            console.error('Failed to parse resume data:', parseError);
            return null;
          }
        })
        .filter((resume): resume is Resume => resume !== null);

      setResumes(parsedResumes || []);
    } catch (error) {
      console.error('Failed to load resumes:', error);
      setResumes([]);
    } finally {
      setLoadingResumes(false);
    }
  }, [kv]);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const handleDeleteResume = useCallback(
    async (id: string) => {
      // The ResumeCard component handles deletion, we just need to reload
      await loadResumes();
    },
    [loadResumes],
  );

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />
      <section className="main-section">
        <div className="page-heading">
          <h1>Track Your Applications & Resume Ratings</h1>
          {!loadingResumes && resumes.length === 0 ? (
            <h2>No resumes found. Upload your first resume to get started.</h2>
          ) : (
            <h2>Review your submissions and check AI-powered feedback.</h2>
          )}
        </div>
        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        )}
        {resumes.length > 0 && !loadingResumes && (
          <div className="resumes-section">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} onDelete={handleDeleteResume} />
            ))}
          </div>
        )}
        {!loadingResumes && resumes.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
