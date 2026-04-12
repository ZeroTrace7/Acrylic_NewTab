export const isValidWidgetPosition = (pos: any): boolean => {
  return [
    "topLeft",
    "topCentre",
    "topRight",
    "middleLeft",
    "middleCentre",
    "middleRight",
    "bottomLeft",
    "bottomCentre",
    "bottomRight",
  ].includes(pos);
};

export const validateV2 = (dump: any) => {
  if (!Array.isArray(dump.backgrounds))
    throw new TypeError("Invalid v2: backgrounds must be an array");
  for (const bg of dump.backgrounds) {
    if (typeof bg.id !== "string") throw new TypeError("Invalid v2 bg id");
    if (typeof bg.key !== "string") throw new TypeError("Invalid v2 bg key");
    if (typeof bg.active !== "boolean")
      throw new TypeError("Invalid v2 bg active");
    if (typeof bg.display !== "object" || bg.display === null)
      throw new TypeError("Invalid v2 bg display");
    if (
      bg.display.blur !== undefined &&
      typeof bg.display.blur !== "number"
    )
      throw new TypeError("Invalid v2 bg display blur");
    if (
      bg.display.luminosity !== undefined &&
      typeof bg.display.luminosity !== "number"
    )
      throw new TypeError("Invalid v2 bg display luminosity");
  }

  if (!Array.isArray(dump.widgets))
    throw new TypeError("Invalid v2: widgets must be an array");
  for (const w of dump.widgets) {
    if (typeof w.id !== "string") throw new TypeError("Invalid v2 widget id");
    if (typeof w.key !== "string") throw new TypeError("Invalid v2 widget key");
    if (typeof w.active !== "boolean")
      throw new TypeError("Invalid v2 widget active");
    if (typeof w.display !== "object" || w.display === null)
      throw new TypeError("Invalid v2 widget display");
    if (!isValidWidgetPosition(w.display.position))
      throw new TypeError("Invalid v2 widget display position");
    if (
      w.display.colour !== undefined &&
      typeof w.display.colour !== "string"
    )
      throw new TypeError("Invalid v2 widget display colour");
    if (
      w.display.fontFamily !== undefined &&
      typeof w.display.fontFamily !== "string"
    )
      throw new TypeError("Invalid v2 widget display fontFamily");
    if (
      w.display.fontSize !== undefined &&
      typeof w.display.fontSize !== "number"
    )
      throw new TypeError("Invalid v2 widget display fontSize");
    if (
      w.display.fontWeight !== undefined &&
      typeof w.display.fontWeight !== "number"
    )
      throw new TypeError("Invalid v2 widget display fontWeight");
  }

  if (
    typeof dump.data !== "object" ||
    dump.data === null ||
    Array.isArray(dump.data)
  )
    throw new TypeError("Invalid v2: data must be an object");

  if (dump.locale !== undefined && typeof dump.locale !== "string")
    throw new TypeError("Invalid v2 locale");
  if (
    dump.timeZone !== undefined &&
    dump.timeZone !== null &&
    typeof dump.timeZone !== "string"
  )
    throw new TypeError("Invalid v2 timeZone");
};

export const validateV3 = (dump: any) => {
  for (const key of Object.keys(dump)) {
    if (key === "version") continue;
    if (key === "background") {
      const bg = dump.background;
      if (typeof bg !== "object" || bg === null)
        throw new TypeError("Invalid v3 background");
      if (typeof bg.id !== "string")
        throw new TypeError("Invalid v3 background id");
      if (typeof bg.key !== "string")
        throw new TypeError("Invalid v3 background key");
      if (typeof bg.display !== "object" || bg.display === null)
        throw new TypeError("Invalid v3 background display");
      if (
        bg.display.blur !== undefined &&
        typeof bg.display.blur !== "number"
      )
        throw new TypeError("Invalid v3 background display blur");
      if (
        bg.display.luminosity !== undefined &&
        typeof bg.display.luminosity !== "number"
      )
        throw new TypeError("Invalid v3 background display luminosity");
    } else if (key === "focus") {
      if (typeof dump.focus !== "boolean")
        throw new TypeError("Invalid v3 focus");
    } else if (key === "locale") {
      if (typeof dump.locale !== "string")
        throw new TypeError("Invalid v3 locale");
    } else if (key === "timeZone") {
      if (dump.timeZone !== null && typeof dump.timeZone !== "string")
        throw new TypeError("Invalid v3 timeZone");
    } else if (key.startsWith("widget/")) {
      const w = dump[key];
      if (w !== null) {
        if (typeof w !== "object") throw new TypeError("Invalid v3 widget");
        if (typeof w.id !== "string")
          throw new TypeError("Invalid v3 widget id");
        if (typeof w.key !== "string")
          throw new TypeError("Invalid v3 widget key");
        if (typeof w.order !== "number")
          throw new TypeError("Invalid v3 widget order");
        if (typeof w.display !== "object" || w.display === null)
          throw new TypeError("Invalid v3 widget display");
        if (!isValidWidgetPosition(w.display.position))
          throw new TypeError("Invalid v3 widget display position");
        if (
          w.display.colour !== undefined &&
          typeof w.display.colour !== "string"
        )
          throw new TypeError("Invalid v3 widget display colour");
        if (
          w.display.fontFamily !== undefined &&
          typeof w.display.fontFamily !== "string"
        )
          throw new TypeError("Invalid v3 widget display fontFamily");
        if (
          w.display.fontSize !== undefined &&
          typeof w.display.fontSize !== "number"
        )
          throw new TypeError("Invalid v3 widget display fontSize");
        if (
          w.display.fontWeight !== undefined &&
          typeof w.display.fontWeight !== "number"
        )
          throw new TypeError("Invalid v3 widget display fontWeight");
      }
    } else if (key.startsWith("data/")) {
      // pass through
    } else {
      throw new TypeError(`Invalid v3 top-level key: ${key}`);
    }
  }
};
