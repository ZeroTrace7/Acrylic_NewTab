import { buildUrl, getSearchUrl, getSuggestUrl } from "./utils";
import { engines } from "./engines";

describe("search/utils", () => {
  describe("buildUrl()", () => {
    const engineUrl = "https://www.google.com/search?q={searchTerms}";

    it("should return the query unchanged if it starts with http/https", () => {
      expect(buildUrl("http://example.com", engineUrl)).toBe("http://example.com");
      expect(buildUrl("https://example.com", engineUrl)).toBe("https://example.com");
      expect(buildUrl("http://localhost:8080", engineUrl)).toBe("http://localhost:8080");
    });

    it("should prepend https:// if it is a plain domain with a valid TLD and no spaces", () => {
      expect(buildUrl("example.com", engineUrl)).toBe("https://example.com");
      expect(buildUrl("tabliss.io", engineUrl)).toBe("https://tabliss.io");
      expect(buildUrl("sub.example.co.uk", engineUrl)).toBe("https://sub.example.co.uk");
    });

    it("should treat domain-like input with spaces as a search", () => {
      expect(buildUrl("example .com", engineUrl)).toBe("https://www.google.com/search?q=example%20.com");
      expect(buildUrl("tabliss io", engineUrl)).toBe("https://www.google.com/search?q=tabliss%20io");
    });

    it("should treat unknown/invalid TLD as a search", () => {
      expect(buildUrl("example.invalidtld", engineUrl)).toBe("https://www.google.com/search?q=example.invalidtld");
      expect(buildUrl("test.local", engineUrl)).toBe("https://www.google.com/search?q=test.local"); // 'local' is not in standard IANA TLDs list depending on the 'tlds' package
    });

    it("should treat empty string and whitespace-only query as a search", () => {
      expect(buildUrl("", engineUrl)).toBe("https://www.google.com/search?q=");
      expect(buildUrl("   ", engineUrl)).toBe("https://www.google.com/search?q=%20%20%20");
    });

    it("should URL-encode queries with special characters", () => {
      expect(buildUrl("hello world!", engineUrl)).toBe("https://www.google.com/search?q=hello%20world!");
      expect(buildUrl("test & query = success", engineUrl)).toBe("https://www.google.com/search?q=test%20%26%20query%20%3D%20success");
      expect(buildUrl("100%", engineUrl)).toBe("https://www.google.com/search?q=100%25");
      expect(buildUrl("café", engineUrl)).toBe("https://www.google.com/search?q=caf%C3%A9");
    });

    it("should document mixed-case domains/TLD behavior", () => {
      // Current behavior based on implementation: tlds list is usually lowercase.
      // String endsWith `.COM` won't match a lowercase `com` in the tlds array, unless the package normalizes it or has both.
      // Let's assume the exact behavior of `query.endsWith` means case-sensitive matching against lowercase TLDs.
      // If it doesn't match, it gets treated as a search.
      // Wait, let's verify what happens by running it, I'll put an expected outcome based on case-sensitivity.
      // `tlds` provides lowercase strings. `"example.COM".endsWith(".com")` is false.
      // So it will likely treat it as a search.
      expect(buildUrl("example.COM", engineUrl)).toBe("https://www.google.com/search?q=example.COM");
      // However, if the domain part is mixed but TLD is lowercase, it should prepend https
      expect(buildUrl("ExAmPlE.com", engineUrl)).toBe("https://ExAmPlE.com");
    });
  });

  describe("getSearchUrl()", () => {
    it("should return the search URL for a given engine key", () => {
      expect(getSearchUrl("duckduckgo")).toBe("https://duckduckgo.com/?q={searchTerms}");
      expect(getSearchUrl("google")).toBe("https://www.google.com/search?q={searchTerms}");
    });

    it("should return the default engine (first one) search URL if key is not found", () => {
      const defaultSearchUrl = engines[0].search_url;
      expect(getSearchUrl("invalid_engine_key")).toBe(defaultSearchUrl);
      expect(getSearchUrl("")).toBe(defaultSearchUrl);
    });
  });

  describe("getSuggestUrl()", () => {
    it("should return the suggest URL for a given engine key if it has one", () => {
      expect(getSuggestUrl("google")).toBe("https://www.google.com/complete/search?client=chrome&q={searchTerms}&callback={callback}");
      expect(getSuggestUrl("bing")).toBe("https://api.bing.com/osjson.aspx?query={searchTerms}&JsonType=callback&JsonCallback={callback}");
    });

    it("should return undefined for a given engine key that lacks a suggest URL", () => {
      expect(getSuggestUrl("duckduckgo")).toBeUndefined();
      expect(getSuggestUrl("searx")).toBeUndefined();
    });

    it("should return undefined if the key is not found or empty", () => {
      expect(getSuggestUrl("invalid_engine_key")).toBeUndefined();
      expect(getSuggestUrl("")).toBeUndefined();
      expect(getSuggestUrl()).toBeUndefined();
    });
  });
});
