"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import QuestionCard from "@/components/QuestionCard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  title: string;
  description: string;
  options: string[];
  difficulty: string;
  category: string;
  tags: string[];
}

export default function Home() {
  const { status } = useSession();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({ category: "", difficulty: "" });
  const observer = useRef<IntersectionObserver | null>(null);

  const lastQuestionRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore],
  );

  useEffect(() => {
    setQuestions([]);
    setPage(1);
    setHasMore(true);
  }, [filters]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return; // Don't fetch if not authenticated

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: "5",
          ...(filters.category && { category: filters.category }),
          ...(filters.difficulty && { difficulty: filters.difficulty }),
        });

        const res = await fetch(`/api/questions?${queryParams}`);
        const data = await res.json();

        if (data.questions.length === 0) {
          setHasMore(false);
        } else {
          setQuestions((prev) =>
            page === 1 ? data.questions : [...prev, ...data.questions],
          );
          if (data.questions.length < 5) setHasMore(false);
        }
      } catch (error) {
        console.error("Error fetching questions", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [page, filters]);

  return (
    <div className="h-[calc(100dvh-64px)] w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth">
      {/* Header/Intro Section - Optional, maybe remove for pure TikTok feel or make it a snap item */}
      {/* 
      <div className="snap-start h-screen flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">LeetScroll</h1>
        <p className="text-gray-600">Master coding concepts one scroll at a time</p>
        <div className="mt-4 animate-bounce">
          <span className="text-gray-400">Scroll down</span>
        </div>
      </div>
      */}

      {/* Fixed Filter Overlay */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-gray-800 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-row gap-3 justify-center overflow-x-auto no-scrollbar">
          <select
            value={filters.difficulty}
            onChange={(e) =>
              setFilters({ ...filters, difficulty: e.target.value })
            }
            className="bg-[#111] border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5 font-mono min-w-[140px]"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            className="bg-[#111] border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5 font-mono min-w-[140px]"
          >
            <option value="">All Categories</option>
            <option value="Arrays">Arrays</option>
            <option value="Strings">Strings</option>
            <option value="Dynamic Programming">Dynamic Programming</option>
            <option value="Trees">Trees</option>
            <option value="Graphs">Graphs</option>
          </select>
        </div>
      </div>

      <div className="">
        {questions.map((question, index) => {
          const handleNext = () => {
            const nextIndex = index + 1;
            const nextElement = document.getElementById(
              `question-${nextIndex}`,
            );
            if (nextElement) {
              nextElement.scrollIntoView({ behavior: "smooth" });
            }
          };

          if (questions.length === index + 1) {
            return (
              <div
                ref={lastQuestionRef}
                key={question.id}
                id={`question-${index}`}
                className="snap-start h-[calc(100dvh-64px)] w-full flex items-center justify-center p-4"
              >
                <QuestionCard question={question} onNext={handleNext} />
              </div>
            );
          } else {
            return (
              <div
                key={question.id}
                id={`question-${index}`}
                className="snap-start h-[calc(100dvh-64px)] w-full flex items-center justify-center p-4"
              >
                <QuestionCard question={question} onNext={handleNext} />
              </div>
            );
          }
        })}
      </div>

      {loading && (
        <div className="snap-start h-[calc(100dvh-64px)] w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!hasMore && questions.length > 0 && (
        <div className="snap-start h-[calc(100dvh-64px)] w-full flex items-center justify-center text-gray-500">
          You&apos;ve reached the end! Check back later.
        </div>
      )}

      {!loading && questions.length === 0 && (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">
              No questions found
            </h3>
            <p className="text-gray-500 mt-2">Try adjusting your filters.</p>
          </div>
        </div>
      )}
    </div>
  );
}
