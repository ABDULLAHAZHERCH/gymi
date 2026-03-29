import { Metadata } from 'next';
import ProgramsClient from './ProgramsClient';

export const metadata: Metadata = {
  title: 'Programs | GYMI',
  description: 'Your personalized workout programs',
};

export default function ProgramsPage() {
  return <ProgramsClient />;
}
