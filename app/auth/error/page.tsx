import { Card } from "antd";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card title="Sorry, something went wrong." className="text-center">
            {params?.error ? (
              <p className="text-sm text-gray-500">
                Code error: {params.error}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                An unspecified error occurred.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
