import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { setLocalStorage } from "../utils/localStorage";
import { useNavigate } from "react-router-dom";

const LoginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .lowercase(),
  password: z.string().trim(),
});

type FormData = z.infer<typeof LoginSchema>;

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(LoginSchema),
    mode: "onChange",
  });

  const navigate = useNavigate();

  async function onSubmit(input: FormData) {
    const response = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const { success, data } = await response.json();

    if (!success) {
      if (data) {
        setError(data.field, { message: data.message });
      }
    }
    if (success) {
      setLocalStorage("token", data);
      navigate("/main");
    }
  }

  return (
    <div className="form-card">
      <h2>Login to your account</h2>
      <form>
        <label>
          <input type="email" placeholder="Email" {...register("email")} />
        </label>
        {errors.email && <p className="error">{errors.email.message}</p>}
        <label>
          <input
            type="password"
            placeholder="Password"
            {...register("password")}
          />
        </label>
        {errors.password && <p className="error">{errors.password.message}</p>}
        <button type="submit" onClick={handleSubmit(onSubmit)}>
          Login
        </button>
      </form>
      <footer>
        <p>Don't have an account?</p>
        <Link to="/signup">Create an account</Link>
      </footer>
    </div>
  );
}
