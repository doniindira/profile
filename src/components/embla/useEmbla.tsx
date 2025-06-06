import { $, useSignal, useStore, useTask$ } from '@builder.io/qwik';

import type {
  EmblaCarouselType,
  EmblaOptionsType,
  EmblaPluginType,
} from 'embla-carousel';
import EmblaCarousel from 'embla-carousel';

export function isObject(subject: unknown): subject is Record<string, unknown> {
  return Object.prototype.toString.call(subject) === '[object Object]';
}

export function isRecord(
  subject: unknown,
): subject is Record<string | number, unknown> {
  return isObject(subject) || Array.isArray(subject);
}

export function canUseDOM(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    window.document &&
    window.document.createElement
  );
}

export function areOptionsEqual(
  optionsA: Record<string, unknown>,
  optionsB: Record<string, unknown>,
): boolean {
  const optionsAKeys = Object.keys(optionsA);
  const optionsBKeys = Object.keys(optionsB);

  if (optionsAKeys.length !== optionsBKeys.length) return false;

  const breakpointsA = JSON.stringify(Object.keys(optionsA.breakpoints || {}));
  const breakpointsB = JSON.stringify(Object.keys(optionsB.breakpoints || {}));

  if (breakpointsA !== breakpointsB) return false;

  return optionsAKeys.every((key) => {
    const valueA = optionsA[key];
    const valueB = optionsB[key];
    if (typeof valueA === 'function') return `${valueA}` === `${valueB}`;
    if (!isRecord(valueA) || !isRecord(valueB)) return valueA === valueB;
    return areOptionsEqual(valueA, valueB);
  });
}

export function sortAndMapPluginToOptions(
  plugins: EmblaPluginType[],
): EmblaPluginType['options'][] {
  return plugins
    .concat()
    .sort((a, b) => (a.name > b.name ? 1 : -1))
    .map((plugin) => plugin.options);
}

export function arePluginsEqual(
  pluginsA: EmblaPluginType[],
  pluginsB: EmblaPluginType[],
): boolean {
  if (pluginsA.length !== pluginsB.length) return false;

  const optionsA = sortAndMapPluginToOptions(pluginsA);
  const optionsB = sortAndMapPluginToOptions(pluginsB);

  return optionsA.every((optionA, index) => {
    const optionB = optionsB[index];
    return areOptionsEqual(optionA, optionB);
  });
}

export type EmblaViewportRefType = <ViewportElement extends HTMLElement>(
  instance: ViewportElement | null,
) => void;

export type UseEmblaCarouselType = [
  EmblaViewportRefType,
  EmblaCarouselType | undefined,
];

function useEmblaCarousel(
  options: EmblaOptionsType,
  plugins: EmblaPluginType[],
) {
  const storeOptions = options ?? {};
  const storePlugins = useStore(plugins);

  const emblaApi = useSignal<EmblaCarouselType>();
  const setEmblaApi = $((value?: EmblaCarouselType) => {
    emblaApi.value = value;
  });
  const viewPort = useSignal<HTMLElement>();

  const reinit = () => {
    if (emblaApi.value) emblaApi.value.reInit(storeOptions, storePlugins);
  };

  useTask$(({ track }) => {
    const viewPortTrack = track(viewPort);
    if (canUseDOM() && viewPortTrack) {
      // EmblaCarousel.globalOptions = useEmblaCarousel()
      const newEmblaApi = EmblaCarousel(viewPort, storeOptions, storePlugins);
    } else {
      setEmblaApi(undefined);
    }
  });
}
