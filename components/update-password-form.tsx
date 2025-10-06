"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Form } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/protected");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card title="Reset Your Password" className="w-full max-w-md mx-auto">
        <p className="text-gray-600 mb-6">
          Please enter your new password below.
        </p>
        <Form
          layout="vertical"
          onFinish={handleForgotPassword}
          className="space-y-4"
        >
          <Form.Item
            label="New password"
            name="password"
            rules={[{ required: true, message: "Please input your new password!" }]}
          >
            <Input.Password
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
          
          {error && <p className="text-sm text-red-500">{error}</p>}
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full" 
              loading={isLoading}
            >
              {isLoading ? "Saving..." : "Save new password"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
