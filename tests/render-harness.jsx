import React from "react";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { DemoProvider } from "../src/context/DemoContext";
import { AppRoutes } from "../src/App";
export function renderRoute(path) {
  return renderToString(
    <MemoryRouter initialEntries={[path]}>
      <DemoProvider>
        <AppRoutes />
      </DemoProvider>
    </MemoryRouter>,
  );
}
