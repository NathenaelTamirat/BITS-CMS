interface Props {
  title: string;
}

export default function HeroBand({ title }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-gray-100 bg-brand-bg">
      <div className="pointer-events-none absolute -right-24 -top-12 h-72 w-[40rem] rounded-full bg-brand-green-blob/70 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 top-20 h-56 w-[28rem] rounded-full bg-brand-green-light/60" />
      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-brand-charcoal md:text-6xl">
          {title}
        </h1>
      </div>
    </section>
  );
}
