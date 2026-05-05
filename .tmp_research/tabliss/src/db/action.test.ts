import { importStore, resetStore } from "./action";
import { DB } from "../lib";
import { db, cache } from "./state";

// Setup mocks or spy methods as needed, but here we can just verify the state directly after mutating it.
describe("importStore", () => {
  beforeEach(() => {
    resetStore();
    // seed initial fake data
    DB.put(db, "focus", false);
    DB.put(db, "background", { id: "bg-orig", key: "original", display: {} });
  });

  afterEach(() => {
    resetStore();
  });

  it("throws for unknown versions and does not mutate existing store", () => {
    expect(() => importStore({ version: 999 })).toThrow("Settings exported from an newer version of Tabliss");
    expect(() => importStore({ version: 1 })).toThrow("Unknown settings version");
    expect(() => importStore({ noVersionKeyAtAll: true })).toThrow("Unknown settings version");
    expect(() => importStore(null)).toThrow("Unexpected format");
    expect(() => importStore(undefined)).toThrow("Unexpected format");

    // Existing store shouldn't have been reset
    expect(DB.get(db, "focus")).toBe(false);
    expect(DB.get(db, "background")).toEqual({ id: "bg-orig", key: "original", display: {} });
  });

  it("imports a valid v2 dump and migrates it to current db structure", () => {
    const v2Dump = {
      backgrounds: [{ id: "bg1", key: "unsplash", active: true, display: { blur: 1 } }],
      widgets: [{ id: "w1", key: "time", active: true, display: { position: "middleCentre" } }],
      data: { bg1: { some: "data" } },
      locale: "en",
      timeZone: "UTC"
    };

    importStore(v2Dump);

    expect(DB.get(db, "background")).toEqual({ id: "bg1", key: "unsplash", active: true, display: { blur: 1 } });
    expect(DB.get(db, "widget/w1")).toEqual({ id: "w1", key: "time", active: true, order: 0, display: { position: "middleCentre" } });
    expect(DB.get(db, "data/bg1")).toEqual({ some: "data" });
    expect(DB.get(db, "locale")).toBe("en");
    expect(DB.get(db, "timeZone")).toBe("UTC");
    expect(DB.get(db, "focus")).toBe(false);
  });

  it("throws on invalid v2 dump without migrating or mutating store", () => {
    const invalidV2 = {
      backgrounds: [{ id: "bg1", key: "unsplash", active: false, display: { blur: 1 } }], // missing active background
      widgets: [],
      data: {}
    };

    expect(() => importStore(invalidV2)).toThrow("Invalid v2: missing active background");

    expect(DB.get(db, "focus")).toBe(false);
    expect(DB.get(db, "background")).toEqual({ id: "bg-orig", key: "original", display: {} });
  });

  it("imports a valid v3 dump", () => {
    const v3Dump = {
      version: 3,
      background: { id: "bg2", key: "colour", display: {} },
      "widget/w2": { id: "w2", key: "greeting", order: 1, display: { position: "topLeft" } },
      "data/some": { a: 1 },
      focus: true,
      locale: "fr"
    };

    importStore(v3Dump);

    expect(DB.get(db, "background")).toEqual({ id: "bg2", key: "colour", display: {} });
    expect(DB.get(db, "widget/w2")).toEqual({ id: "w2", key: "greeting", order: 1, display: { position: "topLeft" } });
    expect(DB.get(db, "data/some")).toEqual({ a: 1 });
    expect(DB.get(db, "focus")).toBe(true);
    expect(DB.get(db, "locale")).toBe("fr");
  });

  it("throws on invalid v3 dump without migrating or mutating store", () => {
    const invalidV3 = {
      version: 3,
      background: { id: "bg2", key: "colour", display: {} },
      unknownKey: "value" // not allowed
    };

    expect(() => importStore(invalidV3)).toThrow("Invalid v3 top-level key: unknownKey");

    expect(DB.get(db, "focus")).toBe(false);
    expect(DB.get(db, "background")).toEqual({ id: "bg-orig", key: "original", display: {} });
  });
});
