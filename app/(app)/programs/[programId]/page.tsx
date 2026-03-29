import { Metadata } from 'next';
import ProgramDetailClient from './ProgramDetailClient';

interface ProgramDetailPageProps {
  params: Promise<{
    programId: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Workout Program | GYMI',
  description: 'Your personalized workout program',
};

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { programId } = await params;
  return <ProgramDetailClient programId={programId} />;
}
