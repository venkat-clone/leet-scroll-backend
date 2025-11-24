"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewQuestionPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        options: ["", "", "", ""],
        correctOption: 0,
        explanation: "",
        difficulty: "EASY",
        category: "General",
        tags: "",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch("/api/questions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    tags: formData.tags.split(",").map(t => t.trim()),
                }),
            })

            if (!res.ok) throw new Error("Failed to create question")

            router.push("/admin/questions")
            router.refresh()
        } catch (error) {
            alert("Error creating question")
        }
    }

    return (
        <div className="w-full h-[calc(100vh-4rem)] bg-gray-800 p-6 border-t border-gray-700 overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Add New Question</h2>
                <div className="flex space-x-4">
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Create Question
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
                {/* Left Column - Title & Description */}
                <div className="col-span-4 flex flex-col space-y-4 h-full overflow-y-auto pr-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Title</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 placeholder-gray-400"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="flex-1 flex flex-col">
                        <label className="block text-sm font-medium text-gray-300">Description</label>
                        <textarea
                            required
                            className="mt-1 block w-full flex-1 rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 placeholder-gray-400 resize-none"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </div>

                {/* Middle Column - Options */}
                <div className="col-span-4 flex flex-col space-y-4 h-full overflow-y-auto px-2 border-x border-gray-700">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-4">Options</label>
                        <div className="space-y-4">
                            {formData.options.map((option, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 rounded-md bg-gray-700/50 border border-gray-700">
                                    <input
                                        type="radio"
                                        name="correctOption"
                                        checked={formData.correctOption === index}
                                        onChange={() => setFormData({ ...formData, correctOption: index })}
                                        className="mt-3"
                                    />
                                    <div className="flex-1">
                                        <label className="text-xs text-gray-400 mb-1 block">Option {index + 1}</label>
                                        <textarea
                                            required
                                            rows={2}
                                            placeholder={`Enter option ${index + 1} text...`}
                                            className="block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 placeholder-gray-400 resize-none"
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...formData.options]
                                                newOptions[index] = e.target.value
                                                setFormData({ ...formData, options: newOptions })
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Meta & Extra */}
                <div className="col-span-4 flex flex-col space-y-4 h-full overflow-y-auto pl-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Difficulty</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 placeholder-gray-400"
                                value={formData.difficulty}
                                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                            >
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Category</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 placeholder-gray-400"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300">Tags</label>
                        <input
                            type="text"
                            placeholder="Comma separated tags..."
                            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 placeholder-gray-400"
                            value={formData.tags}
                            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        />
                    </div>

                    <div className="flex-1 flex flex-col">
                        <label className="block text-sm font-medium text-gray-300">Explanation</label>
                        <textarea
                            className="mt-1 block w-full flex-1 rounded-md border-gray-600 bg-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 placeholder-gray-400 resize-none"
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                        />
                    </div>
                </div>
            </form>
        </div>
    )
}
