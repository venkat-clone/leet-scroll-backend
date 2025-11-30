"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Registration failed");
      }

      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-green-500 font-mono">
            &lt;CreateAccount /&gt;
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-gray-300 font-mono"
              >
                Full Name
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-300 bg-[#111] shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6 px-3 font-mono"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-gray-300 font-mono"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-300 bg-[#111] shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6 px-3 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6 text-gray-300 font-mono"
                >
                  Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={data.password}
                  onChange={(e) =>
                    setData({ ...data, password: e.target.value })
                  }
                  className="block w-full rounded-md border-0 py-1.5 text-gray-300 bg-[#111] shadow-sm ring-1 ring-inset ring-gray-700 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-green-500 sm:text-sm sm:leading-6 px-3 font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-mono">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-green-600 px-3 py-1.5 text-sm font-bold leading-6 text-black shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 font-mono transition-colors"
              >
                Register
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500 font-mono">
            Already a member?{" "}
            <a
              href="/login"
              className="font-semibold leading-6 text-green-500 hover:text-green-400"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
