"use client";

export default function Template({ children }) {
  return (
    <div className="flex-1 flex flex-col animate-page-in">
      {children}
    </div>
  );
}
