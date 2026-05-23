import { Grid, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";

import {
  formatAiringClock,
  getAiringEpisodes,
  getLocalDayTimestamps,
  hasStreamingPlatform,
  StreamingPlatformFilter,
} from "./anilist";
import { AnimeGridItem, AnimeListItem } from "./anime-components";
import { ErrorView } from "./error-view";
import { getAnimePreferences, Onboarding } from "./preferences";
import { GridStreamingFilterDropdown, ListStreamingFilterDropdown } from "./streaming-filter";

export default function Command() {
  const [filter, setFilter] = useState<StreamingPlatformFilter>("all");
  const { startTimestamp, endTimestamp } = getLocalDayTimestamps();
  const {
    data = [],
    error,
    isLoading,
    revalidate: retryEpisodes,
  } = useCachedPromise(getAiringEpisodes, [startTimestamp, endTimestamp]);
  const { data: preferences, isLoading: isLoadingPreferences, revalidate } = useCachedPromise(getAnimePreferences);
  const filteredEpisodes = data.filter((episode) => hasStreamingPlatform(episode.media, filter));

  if (!preferences) {
    if (!isLoadingPreferences) {
      return <Onboarding onComplete={revalidate} />;
    }

    return (
      <List isLoading searchBarPlaceholder="Loading preferences...">
        <List.EmptyView title="Loading Preferences..." />
      </List>
    );
  }

  if (preferences?.preferredView === "gallery") {
    return (
      <Grid
        isLoading={isLoading || isLoadingPreferences}
        searchBarPlaceholder="Filter today's episodes..."
        searchBarAccessory={<GridStreamingFilterDropdown value={filter} onChange={setFilter} />}
        columns={5}
        aspectRatio="2/3"
        fit={Grid.Fit.Fill}
      >
        {error ? (
          <ErrorView isGallery description={error.message} onRetry={retryEpisodes} title="Could Not Load Episodes" />
        ) : isLoading && filteredEpisodes.length === 0 ? (
          <Grid.EmptyView
            title="Loading Today's Episodes..."
            description="Fetching the airing schedule from AniList."
          />
        ) : (
          filteredEpisodes.map((episode) => (
            <AnimeGridItem
              key={episode.id}
              anime={episode.media}
              preferences={preferences}
              onPreferencesChange={revalidate}
              subtitle={`Episode ${episode.episode} · ${formatAiringClock(episode.airingAt)}`}
            />
          ))
        )}
      </Grid>
    );
  }

  return (
    <List
      isLoading={isLoading || isLoadingPreferences}
      searchBarPlaceholder="Filter today's episodes..."
      searchBarAccessory={<ListStreamingFilterDropdown value={filter} onChange={setFilter} />}
    >
      {error ? (
        <ErrorView description={error.message} onRetry={retryEpisodes} title="Could Not Load Episodes" />
      ) : isLoading && filteredEpisodes.length === 0 ? (
        <List.EmptyView title="Loading Today's Episodes..." description="Fetching the airing schedule from AniList." />
      ) : (
        filteredEpisodes.map((episode) => (
          <AnimeListItem
            key={episode.id}
            anime={episode.media}
            preferences={preferences}
            onPreferencesChange={revalidate}
            subtitle={`Episode ${episode.episode} · ${formatAiringClock(episode.airingAt)}`}
          />
        ))
      )}
    </List>
  );
}
