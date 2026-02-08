export type {
  FakeWindowConfig,
  DesktopIconConfig,
} from "$shared/types/index.js";

export interface DialogConfig {
  title: string;
  message: string;
  errorCode?: string;
  icon: "error" | "warning" | "info" | "question";
  buttons: Array<{ label: string; action: string }>;
  isCorrupted?: boolean;
}
