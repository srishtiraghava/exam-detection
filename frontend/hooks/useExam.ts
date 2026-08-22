"use client";

import { useMemo, useState } from "react";

import { QUESTIONS } from "@/lib/examData";

export function useExam() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const question = QUESTIONS[index];
  const answeredCount = useMemo(
    () => QUESTIONS.filter((item) => answers[item.id] !== undefined && answers[item.id] !== "").length,
    [answers],
  );
  return { index, setIndex, answers, setAnswers, question, answeredCount, total: QUESTIONS.length };
}
