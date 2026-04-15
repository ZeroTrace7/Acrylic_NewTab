import { calculateWidth, fetchImages } from "./api";
import { defaultData } from "./types";

// Mock fetch globally
const originalFetch = globalThis.fetch;

beforeAll(() => {
  // @ts-ignore
  globalThis.UNSPLASH_API_KEY = "mock_key";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

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
        links: { html: "https://example.com/user" }
      },
      location: { name: "New York" }
    };

    const validItemNoLocation = {
      urls: { raw: "https://example.com/raw2" },
      links: { html: "https://example.com/html2" },
      user: {
        name: "Jane Doe",
        links: { html: "https://example.com/user2" }
      }
    };

    const invalidItemMissingUrls = {
      links: { html: "https://example.com/html" },
      user: {
        name: "John Doe",
        links: { html: "https://example.com/user" }
      }
    };

    const invalidItemBadUser = {
      urls: { raw: "https://example.com/raw" },
      links: { html: "https://example.com/html" },
      user: { name: 123 }
    };

    it("should process valid items correctly", async () => {
      globalThis.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve([validItem, validItemNoLocation]),
        })
      ) as jest.Mock;

      const result = await fetchImages(defaultData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        src: "https://example.com/raw",
        credit: {
          imageLink: "https://example.com/html",
          location: "New York",
          userName: "John Doe",
          userLink: "https://example.com/user"
        }
      });
      expect(result[1]).toEqual({
        src: "https://example.com/raw2",
        credit: {
          imageLink: "https://example.com/html2",
          location: undefined,
          userName: "Jane Doe",
          userLink: "https://example.com/user2"
        }
      });
    });

    it("should filter out invalid items and return valid ones", async () => {
      globalThis.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve([validItem, invalidItemMissingUrls, invalidItemBadUser]),
        })
      ) as jest.Mock;

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await fetchImages(defaultData);

      expect(result).toHaveLength(1);
      expect(result[0].src).toBe("https://example.com/raw");

      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      consoleWarnSpy.mockRestore();
    });

    it("should throw error if response is not an array", async () => {
      globalThis.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ error: "Not an array" }),
        })
      ) as jest.Mock;

      await expect(fetchImages(defaultData)).rejects.toThrow("Unsplash API response is not an array");
    });

    it("should throw error if no valid items are found", async () => {
      globalThis.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve([invalidItemMissingUrls, invalidItemBadUser]),
        })
      ) as jest.Mock;

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(fetchImages(defaultData)).rejects.toThrow("No valid Unsplash images found in response.");

      consoleWarnSpy.mockRestore();
    });
  });
});
