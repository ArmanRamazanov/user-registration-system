import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(token: string, email: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Email verification",
      html: `<p>Click here to verify: <a href='http://localhost:5173/email-verify?token=${token}'>click</a></p>`,
    });

    if (error) throw new Error(error.message);
  } catch (error) {
    throw error;
  }
}
