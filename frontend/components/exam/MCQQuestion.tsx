import type { McqQuestion } from "@/lib/types";

export function MCQQuestion({
  question,
  selected,
  onSelect,
}: {
  question: McqQuestion;
  selected: number | undefined;
  onSelect: (index: number) => void;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {question.topic} · {question.difficulty}
      </p>
      <h2 className="mt-3 text-xl font-semibold leading-snug text-slate-900">{question.question}</h2>
      <div className="mt-6 grid gap-2">
        {question.options.map((option, index) => {
          const active = selected === index;
          return (
            <button
              className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                active ? "border-brand bg-slate-50 text-slate-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
              key={option}
              onClick={() => onSelect(index)}
              type="button"
            >
              <span className="mr-3 font-medium text-slate-500">{String.fromCharCode(65 + index)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
