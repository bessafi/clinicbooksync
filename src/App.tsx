import { Route, Switch } from "wouter";
import Landing from "./pages/landing";
import AuthHandler from "./pages/auth-handler";
import Dashboard from "./pages/dashboard";
import NotFound from "./pages/not-found";
import Settings from "./pages/settings";

export default function App() {
  console.log("Backend URL:", import.meta.env.VITE_BACKEND_URL);
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth-handler" component={AuthHandler} />
      <Route path="/oauth2/redirect" component={AuthHandler} /> {/* 👈 add this */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} /> {/* 👈 new settings route */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}
