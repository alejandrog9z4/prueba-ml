import React from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Authenticator, useAuthenticator, withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import Home from "./components/Home/Home";
import UploadFile from "./components/Upload/Uploadfile";
import {Amplify} from 'aws-amplify';
import awsExports from './aws-exports';
import "./App.css"

Amplify.configure(awsExports);


function AuthenticatedApp() {
const { signOut } = useAuthenticator((context) => [context.user]);

  return (
    <>
      <nav className="nav-container">
        <NavLink className="nav-link" to="/">Home</NavLink>
        <NavLink className="nav-link" to="/upload">Upload File</NavLink>
        <button className="logout-button" onClick={signOut}>Logout</button>
      </nav>
      <div className="content-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<UploadFile />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Authenticator>
          {({ signOut, user }) => (
            user ? <AuthenticatedApp signOut={signOut} /> : <Home />
          )}
        </Authenticator>
      </div>
    </BrowserRouter>
  );
}

export default  withAuthenticator(App);
