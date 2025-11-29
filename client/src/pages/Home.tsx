import { useState } from "react";

import reactLogo from "../assets/react.svg";

import viteLogo from "/vite.svg";

export default function HomePage() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="mb-8 flex space-x-4">
        <img src={reactLogo} className="h-20 w-20" alt="React Logo" />
        <img src={viteLogo} className="h-20 w-20" alt="Vite Logo" />
      </div>
      <h1 className="mb-4 text-4xl font-bold">Vite + React + Tailwind CSS</h1>
      <div className="text-center">
        <p className="mb-4 text-lg">Count is: {count}</p>
        <button
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          onClick={() => setCount((count) => count + 1)}
        >
          Increment Count
        </button>
      </div>
    </div>
  );
}
