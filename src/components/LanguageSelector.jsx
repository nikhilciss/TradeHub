import React from "react";
import { useDemo } from "../context/DemoContext";
export function LanguageSelector() {
  const d = useDemo();
  return (
    <select
      className="language language-select"
      aria-label={d.t("Language")}
      value={d.lang}
      onChange={(e) => d.setLang(e.target.value)}
    >
      <option value="en" lang="en">
        EN · English
      </option>
      <option value="de" lang="de">
        DE · Deutsch
      </option>
    </select>
  );
}
