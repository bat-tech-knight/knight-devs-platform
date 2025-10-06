"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Input, Form } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
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
      <Card title="Login" className="w-full max-w-md mx-auto">
        <p className="text-gray-600 mb-6">
          Enter your email below to login to your account
        </p>
        <Form
          layout="vertical"
          onFinish={handleLogin}
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
          
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
            extra={
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot your password?
              </Link>
            }
          >
            <Input.Password
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
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </Form.Item>
        </Form>
        
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/sign-up"
            className="text-blue-600 hover:underline"
          >
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
}
