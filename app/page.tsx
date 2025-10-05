import dynamic from 'next/dynamic';

const SplineStack = dynamic(() => import('../components/SplineStack'), { ssr: false });

export default function Page() {
  return (
    <main style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* @ts-expect-error Server Component boundary ok for client children */}
      <SplineStack />
    </main>
  );
}
