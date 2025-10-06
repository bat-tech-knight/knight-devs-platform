"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Form } from "antd";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card title="Check Your Email" className="w-full max-w-md mx-auto">
          <p className="text-gray-600 mb-4">Password reset instructions sent</p>
          <p className="text-sm text-gray-500">
            If you registered using your email and password, you will receive
            a password reset email.
          </p>
        </Card>
      ) : (
        <Card title="Reset Your Password" className="w-full max-w-md mx-auto">
          <p className="text-gray-600 mb-6">
            Type in your email and we&apos;ll send you a link to reset your
            password
          </p>
          <Form
            layout="vertical"
            onFinish={handleForgotPassword}
            className="space-y-4"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Please enter a valid email!" }
              ]}
            >
              <Input
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                {isLoading ? "Sending..." : "Send reset email"}
              </Button>
            </Form.Item>
          </Form>
          
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-blue-600 hover:underline"
            >
              Login
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
