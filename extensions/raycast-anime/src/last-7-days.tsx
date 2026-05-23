import { Grid, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";

import {
  AiringEpisode,
  formatAiringClock,
  formatAiringDay,
  getAiringEpisodes,
  getLastSevenDaysTimestamps,
  hasStreamingPlatform,
  StreamingPlatformFilter,
} from "./anilist";
import { AnimeGridItem, AnimeListItem } from "./anime-components";
import { ErrorView } from "./error-view";
import { getAnimePreferences, Onboarding } from "./preferences";
import { GridStreamingFilterDropdown, ListStreamingFilterDropdown } from "./streaming-filter";

export default function Command() {
  const [filter, setFilter] = useState<StreamingPlatformFilter>("all");
  const { startTimestamp, endTimestamp } = getLastSevenDaysTimestamps();
  const {
    data = [],
    error,
    isLoading,
    revalidate: retryEpisodes,
  } = useCachedPromise(getAiringEpisodes, [startTimestamp, endTimestamp]);
  const { data: preferences, isLoading: isLoadingPreferences, revalidate } = useCachedPromise(getAnimePreferences);
  const filteredEpisodes = data.filter((episode) => hasStreamingPlatform(episode.media, filter));
  const sections = groupByAiringDay(filteredEpisodes);

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

  if (preferences.preferredView === "gallery") {
    return (
      <Grid
        isLoading={isLoading || isLoadingPreferences}
        searchBarPlaceholder="Filter episodes from the last 7 days..."
        searchBarAccessory={<GridStreamingFilterDropdown value={filter} onChange={setFilter} />}
        columns={5}
        aspectRatio="2/3"
        fit={Grid.Fit.Fill}
      >
        {error ? (
          <ErrorView isGallery description={error.message} onRetry={retryEpisodes} title="Could Not Load Episodes" />
        ) : isLoading && sections.length === 0 ? (
          <Grid.EmptyView title="Loading Last 7 Days..." description="Fetching recent episodes from AniList." />
        ) : (
          sections.map((section) => (
            <Grid.Section
              key={section.title}
              title={section.title}
              subtitle={formatSectionSubtitle(section.items.length)}
            >
              {section.items.map((episode) => (
                <AnimeGridItem
                  key={episode.id}
                  anime={episode.media}
                  preferences={preferences}
                  onPreferencesChange={revalidate}
                  subtitle={`Episode ${episode.episode} · ${formatAiringClock(episode.airingAt)}`}
                />
              ))}
            </Grid.Section>
          ))
        )}
      </Grid>
    );
  }

  return (
    <List
      isLoading={isLoading || isLoadingPreferences}
      searchBarPlaceholder="Filter episodes from the last 7 days..."
      searchBarAccessory={<ListStreamingFilterDropdown value={filter} onChange={setFilter} />}
    >
      {error ? (
        <ErrorView description={error.message} onRetry={retryEpisodes} title="Could Not Load Episodes" />
      ) : isLoading && sections.length === 0 ? (
        <List.EmptyView title="Loading Last 7 Days..." description="Fetching recent episodes from AniList." />
      ) : (
        sections.map((section) => (
          <List.Section
            key={section.title}
            title={section.title}
            subtitle={formatSectionSubtitle(section.items.length)}
          >
            {section.items.map((episode) => (
              <AnimeListItem
                key={episode.id}
                anime={episode.media}
                preferences={preferences}
                onPreferencesChange={revalidate}
                subtitle={`Episode ${episode.episode} · ${formatAiringClock(episode.airingAt)}`}
              />
            ))}
          </List.Section>
        ))
      )}
    </List>
  );
}

function groupByAiringDay(episodes: AiringEpisode[]) {
  const sortedEpisodes = [...episodes].sort((first, second) => second.airingAt - first.airingAt);
  const sections = new Map<string, AiringEpisode[]>();

  for (const episode of sortedEpisodes) {
    const title = formatAiringDay(episode.airingAt);
    sections.set(title, [...(sections.get(title) ?? []), episode]);
  }

  return Array.from(sections.entries()).map(([title, items]) => ({ title, items }));
}

function formatSectionSubtitle(count: number) {
  return `${count} ${count === 1 ? "episode" : "episodes"}`;
}
