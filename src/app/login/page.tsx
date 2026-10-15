import { Brand } from "@/components/brand";
import { Icon } from "@/components/icon";
import { LoginForm } from "@/components/login-form";
import { validateEnv } from "@/lib/security/env";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const env = validateEnv(process.env);
  const configured = !!(env.AUTH_SECRET && env.MONGODB_URI && env.MONGODB_DB);
  return (
    <main className="login-page">
      <section className="login-story">
        <Brand light />
        <div>
          <p className="eyebrow">A LITTLE ORDER. A LOT MORE CLARITY.</p>
          <h1>
            Your business moves.
            <br />
            Your deadlines shouldn’t get left behind.
          </h1>
          <p>
            One place for hosting, insurance, permits and agreements—designed
            for the people keeping a business running.
          </p>
          <div className="login-promise">
            <Icon name="shield" />
            Owner access. Your workspace. Your confirmed dates.
          </div>
        </div>
        <span className="muted">KAI247 AI · Owner workspace</span>
      </section>
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-card">
          <p className="eyebrow">WELCOME TO KAI247 AI</p>
          <h2 id="login-title">A clearer view of what’s next.</h2>
          <p className="muted">
            Sign in to your owner account to manage your confirmed renewal
            dates.
          </p>
          <LoginForm
            configured={configured}
            unavailable={(await searchParams).state === "unavailable"}
          />
        </div>
      </section>
    </main>
  );
}
