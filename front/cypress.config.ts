import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // Front served by `ng serve`, which proxies /api to the back-end (see proxy.conf.json)
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
  },
});
