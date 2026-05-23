import { Grid, List } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { useState } from "react";

import {
  Anime,
  formatAiringClock,
  formatWeekday,
  filterAnimeByStreamingPlatform,
  getCurrentAnimeSeason,
  getCurrentSeasonAnime,
  StreamingPlatformFilter,
} from "./anilist";
import { AnimeGridItem, AnimeListItem } from "./anime-components";
import { getAnimePreferences, Onboarding } from "./preferences";
import { GridStreamingFilterDropdown, ListStreamingFilterDropdown } from "./streaming-filter";

export default function Command() {
  const [filter, setFilter] = useState<StreamingPlatformFilter>("all");
  const { season, year } = getCurrentAnimeSeason();
  const { data = [], isLoading } = useCachedPromise(getCurrentSeasonAnime, [season, year]);
  const { data: preferences, isLoading: isLoadingPreferences, revalidate } = useCachedPromise(getAnimePreferences);
  const filteredAnime = filterAnimeByStreamingPlatform(data, filter);
  const sections = groupByAiringDay(filteredAnime);

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
        searchBarPlaceholder={`Filter ${season.toLowerCase()} ${year}...`}
        searchBarAccessory={<GridStreamingFilterDropdown value={filter} onChange={setFilter} />}
        columns={5}
        aspectRatio="2/3"
        fit={Grid.Fit.Fill}
      >
        {isLoading && sections.length === 0 ? (
          <Grid.EmptyView title="Loading Current Season..." description="Fetching airing anime from AniList." />
        ) : (
          sections.map((section) => (
            <Grid.Section
              key={section.title}
              title={formatSectionTitle(section.title)}
              subtitle={formatSectionSubtitle(section.items.length)}
            >
              {section.items.map((anime) => (
                <AnimeGridItem
                  key={anime.id}
                  anime={anime}
                  preferences={preferences}
                  onPreferencesChange={revalidate}
                  subtitle={
                    anime.nextAiringEpisode ? formatAiringClock(anime.nextAiringEpisode.airingAt) : "Schedule Unknown"
                  }
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
      searchBarPlaceholder={`Filter ${season.toLowerCase()} ${year}...`}
      searchBarAccessory={<ListStreamingFilterDropdown value={filter} onChange={setFilter} />}
    >
      {isLoading && sections.length === 0 ? (
        <List.EmptyView title="Loading Current Season..." description="Fetching airing anime from AniList." />
      ) : (
        sections.map((section) => (
          <List.Section
            key={section.title}
            title={formatSectionTitle(section.title)}
            subtitle={formatSectionSubtitle(section.items.length)}
          >
            {section.items.map((anime) => (
              <AnimeListItem
                key={anime.id}
                anime={anime}
                preferences={preferences}
                onPreferencesChange={revalidate}
                subtitle={
                  anime.nextAiringEpisode ? `Airs at ${formatAiringClock(anime.nextAiringEpisode.airingAt)}` : undefined
                }
              />
            ))}
          </List.Section>
        ))
      )}
    </List>
  );
}

function formatSectionTitle(title: string) {
  return title === "Schedule Unknown" ? title.toUpperCase() : `AIRING ${title.toUpperCase()}`;
}

function formatSectionSubtitle(count: number) {
  return `${count} ${count === 1 ? "show" : "shows"}`;
}

function groupByAiringDay(anime: Anime[]) {
  const sortedAnime = [...anime].sort((first, second) => {
    const firstAiring = first.nextAiringEpisode?.airingAt ?? Number.MAX_SAFE_INTEGER;
    const secondAiring = second.nextAiringEpisode?.airingAt ?? Number.MAX_SAFE_INTEGER;
    return firstAiring - secondAiring;
  });
  const sections = new Map<string, Anime[]>();

  for (const item of sortedAnime) {
    const title = formatWeekday(item.nextAiringEpisode?.airingAt);
    sections.set(title, [...(sections.get(title) ?? []), item]);
  }

  return Array.from(sections.entries()).map(([title, items]) => ({ title, items }));
}
