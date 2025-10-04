import ProfilesExample from "@/components/graphql-example";

export default function GraphQLDemo() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <a href={"/"} className="text-blue-600 hover:text-blue-800">
                ← Back to Home
              </a>
              <span>GraphQL Demo</span>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-6 max-w-5xl p-5">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">GraphQL Demo</h1>
            <p className="text-gray-600 mb-8">
              This demo shows Apollo Client integration with Next.js and Supabase GraphQL API.
            </p>
          </div>
          <ProfilesExample />
        </div>
      </div>
    </main>
  );
}
