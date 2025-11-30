"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Question {
  id: string;
  title: string;
  description: string;
  options: string[];
  difficulty: string;
  category: string;
  tags: string[];
}

export default function QuestionCard({
  question,
  onNext,
}: {
  question: Question;
  onNext?: () => void;
}) {
  const { data: session, update } = useSession();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    correctOption: number;
    explanation: string | null;
  } | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (selectedOption === null || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          selectedOption,
        }),
      });

      const data = await res.json();
      setResult(data);
      setSubmitted(true);
      setShowExplanation(true);

      // Update session to reflect new score if correct
      if (data.isCorrect) {
        await update();
      }
    } catch (error) {
      console.error("Failed to submit", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#111] rounded-xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col max-h-[80vh]">
      <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 border
              ${
                question.difficulty === "EASY"
                  ? "bg-green-900/20 text-green-400 border-green-900"
                  : question.difficulty === "MEDIUM"
                    ? "bg-yellow-900/20 text-yellow-400 border-yellow-900"
                    : "bg-red-900/20 text-red-400 border-red-900"
              }`}
            >
              {question.difficulty}
            </span>
            <h3 className="text-xl font-bold text-gray-100 font-mono">
              {question.title}
            </h3>
          </div>
          <span className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded whitespace-nowrap ml-2 font-mono">
            {question.category}
          </span>
        </div>

        <p className="text-gray-300 mb-6 whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {question.description}
        </p>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            let borderColor = "border-gray-800";
            let bgColor = "bg-[#1a1a1a]";
            let textColor = "text-gray-300";

            if (submitted && result) {
              if (index === result.correctOption) {
                borderColor = "border-green-500";
                bgColor = "bg-green-900/20";
                textColor = "text-green-400";
              } else if (index === selectedOption && !result.isCorrect) {
                borderColor = "border-red-500";
                bgColor = "bg-red-900/20";
                textColor = "text-red-400";
              }
            } else if (selectedOption === index) {
              borderColor = "border-green-500";
              bgColor = "bg-green-900/10";
              textColor = "text-green-400";
            }

            return (
              <button
                key={index}
                onClick={() => !submitted && setSelectedOption(index)}
                disabled={submitted}
                className={`w-full text-left p-3 sm:p-4 rounded-lg border transition-all font-mono text-sm ${borderColor} ${bgColor} ${!submitted && "hover:border-green-500/50 hover:bg-gray-900"}`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center mr-3 flex-shrink-0
                    ${selectedOption === index ? "border-green-500" : "border-gray-600"}`}
                  >
                    {selectedOption === index && (
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    )}
                  </div>
                  <span className={textColor}>{option}</span>
                  {submitted && result && index === result.correctOption && (
                    <CheckCircle className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" />
                  )}
                  {submitted &&
                    result &&
                    index === selectedOption &&
                    !result.isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500 ml-auto flex-shrink-0" />
                    )}
                </div>
              </button>
            );
          })}
        </div>

        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedOption === null || loading}
            className="mt-6 w-full bg-green-600 text-black py-3 rounded-lg font-bold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition font-mono"
          >
            {loading ? "Running Tests..." : "Submit Solution"}
          </button>
        ) : (
          <div className="mt-6 space-y-3">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center text-green-500 font-medium hover:text-green-400 font-mono text-sm"
            >
              {showExplanation ? "Hide Output" : "Show Output"}
              {showExplanation ? (
                <ChevronUp className="ml-1 w-4 h-4" />
              ) : (
                <ChevronDown className="ml-1 w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {showExplanation && result?.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-800 text-gray-300 font-mono text-sm"
                >
                  <h4 className="font-bold mb-2 text-green-500">
                    Explanation:
                  </h4>
                  <p>{result.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {onNext && (
              <button
                onClick={onNext}
                className="w-full bg-gray-800 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition font-mono flex items-center justify-center"
              >
                Next Question <ChevronDown className="ml-2 w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
