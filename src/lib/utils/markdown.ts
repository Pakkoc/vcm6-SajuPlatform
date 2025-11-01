"use client";

const headingPatterns: Array<{ regex: RegExp; replace: string }> = [
  { regex: /^### (.*$)/gim, replace: "<h3>$1</h3>" },
  { regex: /^## (.*$)/gim, replace: "<h2>$1</h2>" },
  { regex: /^# (.*$)/gim, replace: "<h1>$1</h1>" },
];

export const renderMarkdown = (markdown: string): string => {
  let html = markdown;

  headingPatterns.forEach(({ regex, replace }) => {
    html = html.replace(regex, replace);
  });

  html = html
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/\n\n/gim, "</p><p>")
    .replace(/\n/gim, "<br />");

  return `<p>${html}</p>`;
};
