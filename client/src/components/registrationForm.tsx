import "../css/form.css";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const RegistrationSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .lowercase(),
  firstName: z.string().min(1).max(40).trim(),
  lastName: z.string().min(1).max(40).trim(),
  username: z.string().min(3).max(15).trim().lowercase(),
  password: z
    .string()
    .min(6, "Password must contain at least 6 characters")
    .check(
      z.regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/,
        "Password must contain at least one lowercase letter, one uppercase letter and one special character",
      ),
    ),
});

type FormData = z.infer<typeof RegistrationSchema>;

export default function RegistrationForm() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(RegistrationSchema),
    mode: "onChange",
  });

  async function onSubmit(input: FormData) {
    const result = await fetch("http://localhost:4000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const { success, data, message } = await result.json();

    if (!success) {
      const duplicationErrors = data.filter(
        (error: { field: string; message: string }) =>
          error.field === "username" || error.field === "email",
      );

      if (duplicationErrors) {
        duplicationErrors.forEach(
          (duplicationError: {
            field: "username" | "email";
            message: string;
          }) =>
            setError(duplicationError.field, {
              message: duplicationError.message,
            }),
        );
      }
    }

    if (success) {
      navigate("/email-verify", { state: { email: data.email } });
    }
  }

  return (
    <div className="form-card">
      <h2>Create an account</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>
            <input type="text" placeholder="Name" {...register("firstName")} />
          </label>
          <label>
            <input
              type="text"
              placeholder="Surname"
              {...register("lastName")}
            />
          </label>
        </div>
        <label>
          <input type="text" placeholder="Username" {...register("username")} />
        </label>
        {errors.username && <p className="error">{errors.username.message}</p>}
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
        <button type="submit">Sign up</button>
      </form>
      <footer>
        <p>Already have an account?</p>
        <Link to="/login">Login</Link>
      </footer>
    </div>
  );
}
