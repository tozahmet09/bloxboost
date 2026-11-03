export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  const contact = process.env.CONTACT_EMAIL;
  return (
    <article className="mx-auto max-w-2xl space-y-6 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-cream/90 [&_ul]:space-y-1.5">
      <div>
        <p className="eyebrow">Legal</p>
        <h1 className="mt-1 text-3xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-mute">Last updated {updated}</p>
      </div>
      {children}
      {contact && (
        <p className="rule pt-6 text-sm text-mute">
          Questions: <span className="select-all text-cream">{contact}</span>
        </p>
      )}
    </article>
  );
}
