import { Suspense } from 'react';
import { getHotPosts } from '@/lib/api/home';
import { getAttractions, getPopularAttractions } from '@/lib/api/attractions';
import { AssistantPanel } from '@/components/assistant/AssistantPanel';
import { AssistantProvider } from '@/components/assistant/AssistantProvider';
import {
  AssistantEntryTrigger,
  AssistantNavigationTrigger,
} from '@/components/assistant/AssistantTriggers';
import { SectionContainer } from '@/components/home/SectionContainer';
import { HomepageSearchEntry } from '@/components/home/HomepageSearchEntry';
import { HomepageFeaturedDestinations } from '@/components/home/HomepageFeaturedDestinations';
import { HomepagePopularDestinations } from '@/components/home/HomepagePopularDestinations';
import { HomepageHotPosts } from '@/components/home/HomepageHotPosts';

export const dynamic = 'force-dynamic';

async function FeaturedDestinationsSection() {
  try {
    const page = await getAttractions({ sort: 'rating', size: 5 });
    if (page.content.length === 0) return null;
    return (
      <SectionContainer id="featured-destinations" title="Featured Destinations" state={{ status: 'success', data: page.content }}>
        <HomepageFeaturedDestinations attractions={page.content} />
      </SectionContainer>
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load featured destinations';
    return (
      <SectionContainer id="featured-destinations" title="Featured Destinations" state={{ status: 'error', message }}>
        <div />
      </SectionContainer>
    );
  }
}

async function PopularDestinationsSection() {
  try {
    const attractions = await getPopularAttractions();
    return (
      <SectionContainer id="popular-destinations" title="Popular Destinations" action={{ label: 'View all', href: '/attractions' }} state={{ status: 'success', data: attractions }}>
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
      <SectionContainer id="hot-posts" title="Traveler Discussions" action={{ label: 'View all', href: '/posts' }} state={{ status: 'success', data: posts }}>
        <HomepageHotPosts posts={posts} />
      </SectionContainer>
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to load hot posts';
    return (
      <SectionContainer id="hot-posts" title="Traveler Discussions" state={{ status: 'error', message }}>
        <div />
      </SectionContainer>
    );
  }
}

export default function HomePage() {
  return (
    <AssistantProvider>
      <div className="mx-auto max-w-7xl px-4 space-y-14 pt-6 pb-24">
        {/* Search Entry — static, renders immediately */}
        <section id="search-entry">
          <HomepageSearchEntry />
        </section>

        {/* Featured Destinations (Hero) — Suspense with carousel skeleton */}
        <Suspense fallback={
          <SectionContainer id="featured-destinations" title="Featured Destinations" state={{ status: 'loading' }}>
            <div />
          </SectionContainer>
        }>
          <FeaturedDestinationsSection />
        </Suspense>

        {/* Function Navigation — static, renders immediately */}
        <section id="function-navigation">
          <AssistantNavigationTrigger />
        </section>

        {/* Popular Destinations — Suspense with grid skeleton */}
        <Suspense fallback={
          <SectionContainer id="popular-destinations" title="Popular Destinations" state={{ status: 'loading' }}>
            <div />
          </SectionContainer>
        }>
          <PopularDestinationsSection />
        </Suspense>

        {/* Traveler Discussions — Suspense with list skeleton */}
        <Suspense fallback={
          <SectionContainer id="hot-posts" title="Traveler Discussions" state={{ status: 'loading' }}>
            <div />
          </SectionContainer>
        }>
          <HotPostsSection />
        </Suspense>

        {/* AI Assistant Entry — static floating layer */}
        <AssistantEntryTrigger />
      </div>

      <AssistantPanel />
    </AssistantProvider>
  );
}
