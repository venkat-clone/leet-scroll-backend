"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      ...data,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid credentials");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-green-500 font-mono">
            &lt;SignIn /&gt;
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  autoComplete="current-password"
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
                Sign in
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500 font-mono">
            Not a member?{" "}
            <a
              href="/register"
              className="font-semibold leading-6 text-green-500 hover:text-green-400"
            >
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
