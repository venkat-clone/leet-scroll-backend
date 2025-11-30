"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

export default function BulkUpload() {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateQuestion = (q: any) => {
    if (!q.title || typeof q.title !== "string")
      throw new Error("Missing or invalid title");
    if (!Array.isArray(q.options) || q.options.length < 2)
      throw new Error(`Invalid options for question: ${q.title}`);
    if (
      typeof q.correctOption !== "number" &&
      typeof q.correctOption !== "string"
    )
      throw new Error(`Invalid correctOption for question: ${q.title}`);
    return true;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      let formattedQuestions = [];

      if (file.name.endsWith(".json")) {
        const text = await file.text();
        const jsonData = JSON.parse(text);

        if (!Array.isArray(jsonData))
          throw new Error("JSON must be an array of questions");

        formattedQuestions = jsonData.map((row: any) => {
          validateQuestion(row);
          return {
            title: row.title.trim(),
            description: (row.description || "").trim(),
            options: row.options,
            correctOption: Number(row.correctOption),
            explanation: (row.explanation || "").trim(),
            difficulty: row.difficulty?.toUpperCase().trim() || "EASY",
            category: row.category?.trim() || "General",
            tags: Array.isArray(row.tags)
              ? row.tags
              : row.tags
                ? row.tags.split(",")
                : [],
            codeSnippet: row.codeSnippet || "",
          };
        });
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        formattedQuestions = jsonData.map((row: any) => ({
          title: row.title.trim(),
          description: (row.description || "").trim(),
          options:
            typeof row.options === "string"
              ? row.options.split("|")
              : row.options,
          correctOption: parseInt(row.correctOption),
          explanation: (row.explanation || "").trim(),
          difficulty: row.difficulty?.toUpperCase().trim() || "EASY",
          category: row.category?.trim() || "General",
          tags: row.tags ? row.tags.split(",") : [],
          codeSnippet: row.codeSnippet || "",
        }));
      }

      const res = await fetch("/api/questions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: formattedQuestions }),
      });

      if (!res.ok) throw new Error("Failed to upload");

      alert(`Successfully uploaded ${formattedQuestions.length} questions!`);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error uploading questions");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls, .csv, .json"
        onChange={handleFileUpload}
        disabled={uploading}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Importing...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import Questions
          </>
        )}
      </button>
    </div>
  );
}
