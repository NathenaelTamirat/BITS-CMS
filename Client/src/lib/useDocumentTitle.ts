import { useEffect } from "react";

const SITE_NAME = "BITS College";
const DEFAULT_TITLE = SITE_NAME;

export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

interface MetaTags {
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
}

export function useMetaTags(tags: MetaTags) {
  useEffect(() => {
    const created: HTMLMetaElement[] = [];

    function setOrCreate(selector: string, attr: string, value: string) {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        if (attr === "name") el.setAttribute("name", selector.match(/"([^"]+)"/)![1]);
        else el.setAttribute("property", selector.match(/"([^"]+)"/)![1]);
        document.head.appendChild(el);
        created.push(el);
      }
      el.setAttribute("content", value);
    }

    if (tags.description) {
      setOrCreate('meta[name="description"]', "name", tags.description);
    }
    if (tags.ogTitle) {
      setOrCreate('meta[property="og:title"]', "property", tags.ogTitle);
    }
    if (tags.ogDescription) {
      setOrCreate(
        'meta[property="og:description"]',
        "property",
        tags.ogDescription,
      );
    }
    if (tags.ogImage) {
      setOrCreate('meta[property="og:image"]', "property", tags.ogImage);
    }
    if (tags.ogType) {
      setOrCreate('meta[property="og:type"]', "property", tags.ogType);
    }

    return () => {
      // Only remove the meta tags we created (not pre-existing ones)
      created.forEach((el) => el.remove());
    };
  }, [
    tags.description,
    tags.ogTitle,
    tags.ogDescription,
    tags.ogImage,
    tags.ogType,
  ]);
}
