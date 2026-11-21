import type { Metadata } from 'next';
import { LessonPage, lessonMetadata, lessonParams } from '@/components/lesson-page';

const TRACK = 'git';

export default async function Page(props: PageProps<'/learn/git/[[...slug]]'>) {
  const { slug = [] } = await props.params;
  return <LessonPage slugs={[TRACK, ...slug]} />;
}

export function generateStaticParams() {
  return lessonParams(TRACK);
}

export async function generateMetadata(props: PageProps<'/learn/git/[[...slug]]'>): Promise<Metadata> {
  const { slug = [] } = await props.params;
  return lessonMetadata([TRACK, ...slug]);
}
