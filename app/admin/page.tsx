import { AdminClient } from "../components/AdminClient";
import { pageMetadata } from "../seo";

export const metadata = pageMetadata({
  path: "/admin",
  title: "Адміністрація | Церква Еммануїл",
  description: "Адміністративна панель церкви Еммануїл.",
});

export default function AdminPage() {
  return <AdminClient />;
}
