function Section({ title, children, actionLabel, action }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        </div>
        {action ? (
          <button className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700" onClick={action}>
            {actionLabel}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default Section;
