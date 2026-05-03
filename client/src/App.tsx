import RegistrationForm from "./components/registrationForm";
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";
import RootLayout from "./RootLayout";
import EmailVerification from "./components/emailVerification";
import LoginForm from "./components/loginForm";
import MainPage, { loader } from "./components/mainPage";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout></RootLayout>}>
      <Route
        path="signup"
        element={<RegistrationForm></RegistrationForm>}
      ></Route>
      <Route path="login" element={<LoginForm></LoginForm>}></Route>
      <Route
        path="email-verify"
        element={<EmailVerification></EmailVerification>}
      ></Route>
      <Route
        path="main"
        element={<MainPage></MainPage>}
        loader={loader}
      ></Route>
    </Route>,
  ),
);

export default function App() {
  return <RouterProvider router={router} />;
}
