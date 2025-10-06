import { Badge, Button } from "antd";

export function EnvVarWarning() {
  return (
    <div className="flex gap-4 items-center">
      <Badge status="warning" text="Supabase environment variables required" />
      <div className="flex gap-2">
        <Button size="small" type="default" disabled>
          Sign in
        </Button>
        <Button size="small" type="primary" disabled>
          Sign up
        </Button>
      </div>
    </div>
  );
}
