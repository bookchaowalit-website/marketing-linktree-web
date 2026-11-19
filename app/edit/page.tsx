import type { Metadata } from "next";
import { LinkPage } from "@/components/link-page";

// The owner's editor: not linked from the public page and kept out of search results.
export const metadata: Metadata = {
  title: "Edit links | Bookchaowalit",
  robots: { index: false, follow: false },
};

export default function EditLinks() {
  return <LinkPage editing />;
}
