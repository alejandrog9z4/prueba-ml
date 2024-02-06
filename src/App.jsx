import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Authenticator, useAuthenticator, withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Home from "./components/Home/Home";
import UploadFile from "./components/Upload/Uploadfile";
import {Amplify} from 'aws-amplify';
import awsExports from './aws-exports'; // Asegúrate de tener este archivo configurado correctamente
Amplify.configure(awsExports);
function AuthenticatedApp() {
  const { signOut } = useAuthenticator((context) => [context.user]);

  return (
    <>
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/upload">Upload File</NavLink>
        <button onClick={signOut}>Logout</button>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<UploadFile />} />
      </Routes>
    </>
  );
}

function App() {
  const { signOut } = useAuthenticator((context) => [context.user]);

  return (
    <BrowserRouter>
      <div className="App">
        <Authenticator>
          {({ signOut, user }) => (
            user ? <AuthenticatedApp /> : <Home />
          )}
        </Authenticator>
      </div>
    </BrowserRouter>
  );
}

export default  withAuthenticator(App);
