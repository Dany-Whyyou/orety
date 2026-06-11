import { LibraryBig } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ClassesList } from "@/components/classes/classes-list";
import { getClasses, getClasseFormData } from "@/lib/queries/classes";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [classes, formData] = await Promise.all([getClasses(), getClasseFormData()]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        title="Classes"
        description={
          classes.length === 0
            ? "Aucune classe"
            : `${classes.length} classe${classes.length > 1 ? "s" : ""}`
        }
        icon={<LibraryBig className="size-5" />}
        breadcrumbs={[{ label: "Classes" }]}
      />
      <ClassesList
        classes={classes}
        niveaux={formData.niveaux}
        annees={formData.annees}
        profs={formData.profs}
      />
    </div>
  );
}
