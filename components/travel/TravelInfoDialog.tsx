'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import WeatherSection from '@/components/travel/WeatherSection';
import RatesSection from '@/components/travel/RatesSection';

export default function TravelInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger className="hover:underline">Weather &amp; Rates</DialogTrigger>
      <DialogContent>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <DialogTitle>Weather &amp; Rates</DialogTitle>
            <DialogDescription>
              A quick glance at the weather and exchange rates. Data may be delayed.
            </DialogDescription>
          </div>
          <DialogClose aria-label="Close">×</DialogClose>
        </div>

        <div className="mt-4 space-y-6">
          <WeatherSection />
          <RatesSection />
        </div>
      </DialogContent>
    </Dialog>
  );
}
