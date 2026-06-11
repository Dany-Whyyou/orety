import Image from "next/image";

const photos = [
  {
    src: "/photos/sous-le-manguier.jpg",
    alt: "Élèves en uniforme dans la cour, sous le grand manguier",
    legende: "La cour principale, sous le grand manguier",
    classe: "sm:col-span-2 sm:row-span-2",
  },
  {
    src: "/photos/cour-recreation.jpg",
    alt: "La récréation dans la cour du C.S.O",
    legende: "La récréation",
    classe: "",
  },
  {
    src: "/photos/vie-scolaire.jpg",
    alt: "Élèves devant les salles de classe",
    legende: "Devant les salles de classe",
    classe: "",
  },
  {
    src: "/photos/eleves-preau.jpg",
    alt: "Élèves rassemblés sous le préau",
    legende: "Sous le préau",
    classe: "",
  },
  {
    src: "/photos/facade-principale.jpg",
    alt: "La façade du site principal, quartier Transfo",
    legende: "Le site principal, quartier Transfo",
    classe: "",
  },
];

export function VitrineGalerie() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            En images
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            La vie au C.S.O
          </h2>
        </div>

        <div className="mt-12 grid auto-rows-[180px] grid-cols-1 gap-4 sm:grid-cols-3 sm:auto-rows-[200px]">
          {photos.map((photo) => (
            <figure
              key={photo.src}
              className={`group relative overflow-hidden rounded-2xl ${photo.classe}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 640px) 33vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <figcaption className="absolute bottom-3 left-4 right-4 translate-y-2 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                {photo.legende}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
