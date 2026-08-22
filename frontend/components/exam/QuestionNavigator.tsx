import { QUESTIONS } from "@/lib/examData";

export function QuestionNavigator({
  currentIndex,
  answers,
  onSelect,
}: {
  currentIndex: number;
  answers: Record<string, number | string | undefined>;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {QUESTIONS.map((question, index) => {
        const answered = answers[question.id] !== undefined && answers[question.id] !== "";
        const current = index === currentIndex;
        return (
          <button
            className={`h-9 min-w-9 rounded-md border px-2 text-sm ${
              current
                ? "border-brand bg-brand text-white"
                : answered
                  ? "border-green-200 bg-green-50 text-success"
                  : "border-slate-200 bg-white text-slate-600"
            }`}
            key={question.id}
            onClick={() => onSelect(index)}
            type="button"
          >
            {index + 1}
            {answered && !current ? " ✓" : answered ? "" : current ? "" : " —"}
          </button>
        );
      })}
    </div>
  );
}
