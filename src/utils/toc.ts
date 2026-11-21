export interface TocHeading {
  depth: number;
  slug: string;
  text: string;
  href?: string;
}

export interface TocChild {
  name: string;
  href: string;
  meta?: string;
  current?: boolean;
  headings?: TocHeading[];
}

export interface TocGroup {
  name: string;
  href?: string;
  meta?: string;
  current?: boolean;
  children?: TocChild[];
}
