import { Logger } from "tslog";

export const logger = new Logger({
  name: "changelog",
  type: "pretty",
  hideLogPositionForProduction: process.env.NODE_ENV === "production",
});
