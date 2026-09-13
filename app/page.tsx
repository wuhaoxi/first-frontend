import { Suspense } from 'react';
import { getFeaturedGuides, getHotPosts } from '@/lib/api/home';
import { getPopularAttractions } from '@/lib/api/attractions';
import { SectionContainer } from '@/components/home/SectionContainer';
import { HomepageSearchEntry } from '@/components/home/HomepageSearchEntry';
import { HomepageAiAssistantEntry } from '@/components/home/HomepageAiAssistantEntry';
import { HomepageFunctionNavigation } from '@/components/home/HomepageFunctionNavigation';
import { HomepageEditorsPicks } from '@/components/home/HomepageEditorsPicks';
import { HomepagePopularDestinations } from '@/components/home/HomepagePopularDestinations';
import { HomepageHotPosts } from '@/components/home/HomepageHotPosts';

export const dynamic = 'force-dynamic';

async function EditorsPicksSection() {
  try {
    const guides = await getFeaturedGuides();
    return (
      <SectionContainer id="editors-picks" title="Editor's Picks" state={{ status: 'success', data: guides }}>
        <HomepageEditorsPicks guides={guides} />
      </SectionContainer>
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load editor\'s picks';
    return (
      <SectionContainer id="editors-picks" title="Editor's Picks" state={{ status: 'error', message }}>
        <div />
      </SectionContainer>
    );
  }
}

async function PopularDestinationsSection() {
  try {
    const attractions = await getPopularAttractions();
    return (
      <SectionContainer id="popular-destinations" title="Popular Destinations" state={{ status: 'success', data: attractions }}>
        <HomepagePopularDestinations attractions={attractions} />
      </SectionContainer>
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load popular destinations';
    return (
      <SectionContainer id="popular-destinations" title="Popular Destinations" state={{ status: 'error', message }}>
        <div />
      </SectionContainer>
    );
  }
}

async function HotPostsSection() {
  try {
    const posts = await getHotPosts();
    return (
      <SectionContainer id="hot-posts" title="Hot Posts" state={{ status: 'success', data: posts }}>
        <HomepageHotPosts posts={posts} />
      </SectionContainer>
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load hot posts';
    return (
      <SectionContainer id="hot-posts" title="Hot Posts" state={{ status: 'error', message }}>
        <div />
      </SectionContainer>
    );
  }
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-8">
      {/* Search Entry — static, renders immediately */}
      <section id="search-entry">
        <HomepageSearchEntry />
      </section>

      {/* Editor's Picks — Suspense with hero skeleton */}
      <Suspense fallback={
        <SectionContainer id="editors-picks" title="Editor's Picks" state={{ status: 'loading' }}>
          <div />
        </SectionContainer>
      }>
        <EditorsPicksSection />
      </Suspense>

      {/* Function Navigation — static, renders immediately */}
      <section id="function-navigation">
        <HomepageFunctionNavigation />
      </section>

      {/* Popular Destinations — Suspense with grid skeleton */}
      <Suspense fallback={
        <SectionContainer id="popular-destinations" title="Popular Destinations" state={{ status: 'loading' }}>
          <div />
        </SectionContainer>
      }>
        <PopularDestinationsSection />
      </Suspense>

      {/* Hot Posts — Suspense with list skeleton */}
      <Suspense fallback={
        <SectionContainer id="hot-posts" title="Hot Posts" state={{ status: 'loading' }}>
          <div />
        </SectionContainer>
      }>
        <HotPostsSection />
      </Suspense>

      {/* AI Assistant Entry — static floating layer */}
      <HomepageAiAssistantEntry />
    </div>
  );
}
