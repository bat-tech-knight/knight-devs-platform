import { Card } from "antd";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card 
            title="Thank you for signing up!"
            className="text-center"
          >
            <p className="text-gray-600 mb-4">Check your email to confirm</p>
            <p className="text-sm text-gray-500">
              You&apos;ve successfully signed up. Please check your email to
              confirm your account before signing in.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
