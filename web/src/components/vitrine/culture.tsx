import Image from "next/image";
import { Reveal } from "./motion";

const rangeeHaut = [
  { src: "/photos/culture-01.jpg", rot: "-rotate-2" },
  { src: "/photos/culture-03.jpg", rot: "rotate-1" },
  { src: "/photos/culture-05.jpg", rot: "-rotate-1" },
  { src: "/photos/culture-07.jpg", rot: "rotate-2" },
  { src: "/photos/culture-09.jpg", rot: "-rotate-2" },
  { src: "/photos/culture-11.jpg", rot: "rotate-1" },
];

const rangeeBas = [
  { src: "/photos/culture-02.jpg", rot: "rotate-2" },
  { src: "/photos/culture-04.jpg", rot: "-rotate-1" },
  { src: "/photos/culture-06.jpg", rot: "rotate-1" },
  { src: "/photos/culture-08.jpg", rot: "-rotate-2" },
  { src: "/photos/culture-10.jpg", rot: "rotate-2" },
  { src: "/photos/duo-traditionnel.jpg", rot: "-rotate-1" },
];

function Rangee({
  photos,
  reverse = false,
}: {
  photos: { src: string; rot: string }[];
  reverse?: boolean;
}) {
  const Cellules = () => (
    <div className="flex shrink-0 gap-5 pr-5">
      {photos.map((photo) => (
        <div
          key={photo.src}
          className={`group/photo relative h-52 w-40 shrink-0 overflow-hidden rounded-2xl shadow-md ring-1 ring-border transition-transform duration-300 hover:z-10 hover:scale-105 hover:rotate-0 sm:h-64 sm:w-48 ${photo.rot}`}
        >
          <Image
            src={photo.src}
            alt="Journée culturelle au Complexe Scolaire Orety"
            fill
            sizes="192px"
            className="object-cover transition-transform duration-500 group-hover/photo:scale-110"
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex w-max" aria-hidden={reverse}>
      <div className={`flex ${reverse ? "animate-marquee-slow-reverse" : "animate-marquee-slow"}`}>
        <Cellules />
        <Cellules />
      </div>
    </div>
  );
}

export function VitrineCulture() {
  return (
    <section className="overflow-hidden py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal direction="right">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Journée culturelle
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              La culture à l&apos;honneur
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">
              Chaque année, la journée culturelle met à l&apos;honneur le
              patrimoine gabonais : tenues traditionnelles, contes, danses et
              chants. Un moment fort de partage et de découverte pour tous les
              élèves, dans la joie et la bonne humeur.
            </p>
          </Reveal>

          <Reveal direction="left" delay={0.15}>
            <div className="relative mx-auto w-64 sm:w-72">
              <div
                aria-hidden
                className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-warning/30 via-transparent to-primary/20 blur-xl"
              />
              <div className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-border">
                <Image
                  src="/photos/culture-vedette.jpg"
                  alt="Élève en tenue traditionnelle lors de la journée culturelle"
                  width={720}
                  height={1080}
                  sizes="288px"
                  className="aspect-[2/3] w-full object-cover"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="marquee-pause mt-14 space-y-5">
        <Rangee photos={rangeeHaut} />
        <Rangee photos={rangeeBas} reverse />
      </div>
    </section>
  );
}
