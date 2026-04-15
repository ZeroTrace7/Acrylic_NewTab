import { calculateWidth, fetchImages } from "./api";
import { defaultData } from "./types";

const originalFetch = globalThis.fetch;

beforeAll(() => {
  // @ts-ignore mocked in test environment
  globalThis.UNSPLASH_API_KEY = "mock_key";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
});

const mockFetch = (payload: unknown, init: Partial<Response> = {}): void => {
  globalThis.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(payload),
      ...init,
    } as Response),
  );
};

describe("unsplash/api", () => {
  it("should calculate width for screen", () => {
    expect(calculateWidth()).toBe(1920);
    expect(calculateWidth(1920)).toBe(1920);
    expect(calculateWidth(2000)).toBe(2160);
    expect(calculateWidth(5000)).toBe(3840);
  });

  it("should consider pixel ratio", () => {
    expect(calculateWidth(1000, 2)).toBe(2160);
  });

  describe("fetchImages", () => {
    const validItem = {
      urls: { raw: "https://example.com/raw" },
      links: { html: "https://example.com/html" },
      user: {
        name: "John Doe",
        links: { html: "https://example.com/user" },
      },
      location: { name: "New York" },
    };

    const validItemNoLocation = {
      urls: { raw: "https://example.com/raw2" },
      links: { html: "https://example.com/html2" },
      user: {
        name: "Jane Doe",
        links: { html: "https://example.com/user2" },
      },
    };

    const invalidItemMissingUrls = {
      links: { html: "https://example.com/html" },
      user: {
        name: "John Doe",
        links: { html: "https://example.com/user" },
      },
    };

    const invalidItemBadUser = {
      urls: { raw: "https://example.com/raw" },
      links: { html: "https://example.com/html" },
      user: { name: 123 },
    };

    it("should process valid items correctly", async () => {
      mockFetch([validItem, validItemNoLocation]);

      const result = await fetchImages(defaultData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        src: "https://example.com/raw",
        credit: {
          imageLink: "https://example.com/html",
          location: "New York",
          userName: "John Doe",
          userLink: "https://example.com/user",
        },
      });
      expect(result[1]).toEqual({
        src: "https://example.com/raw2",
        credit: {
          imageLink: "https://example.com/html2",
          location: undefined,
          userName: "Jane Doe",
          userLink: "https://example.com/user2",
        },
      });
    });

    it("should filter out invalid items and return valid ones", async () => {
      mockFetch([validItem, invalidItemMissingUrls, invalidItemBadUser]);

      const consoleWarnSpy = jest
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);

      const result = await fetchImages(defaultData);

      expect(result).toHaveLength(1);
      expect(result[0].src).toBe("https://example.com/raw");
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });

    it("should throw error if response is not an array", async () => {
      mockFetch({ error: "Not an array" });

      await expect(fetchImages(defaultData)).rejects.toThrow(
        "Unsplash API response is not an array",
      );
    });

    it("should throw error if no valid items are found", async () => {
      mockFetch([invalidItemMissingUrls, invalidItemBadUser]);

      jest.spyOn(console, "warn").mockImplementation(() => undefined);

      await expect(fetchImages(defaultData)).rejects.toThrow(
        "No valid Unsplash images found in response.",
      );
    });

    it("should throw error when unsplash request fails", async () => {
      mockFetch([], { ok: false, status: 429 });

      await expect(fetchImages(defaultData)).rejects.toThrow(
        "Unsplash request failed with status 429",
      );
    });
  });
});
