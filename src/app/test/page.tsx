export default function TestPage() {
  const items = ['husky', 'lint-staged', 'eslint', 'prettier'];

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-semibold">Pre-commit test page</h1>
      <p className="mt-2 text-sm text-gray-500">
        Temporary. Edit this file to trigger lint errors and watch the hook.
      </p>
      <ul className="mt-4 list-disc pl-5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </main>
  );
}
