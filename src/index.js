import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider } from "@apollo/react-hooks";
import { MuiThemeProvider, CssBaseline, Typography } from "@material-ui/core";
import { BrowserRouter as Router } from "react-router-dom";
import theme from "./theme";
import App from "./App";
import AuthProvider from "./auth";
import client from "./graphql/client";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Typography style={{ paddingTop: 30}} component="h1" variant="h6" align="center">
          Ooops! Something went wrong.
        </Typography>
      );
    }
    return this.props.children;
  }
}

ReactDOM.render(
  <ErrorBoundary>
    <ApolloProvider client={client}>
      <AuthProvider>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <App />
          </Router>
        </MuiThemeProvider>
      </AuthProvider>
    </ApolloProvider>
  </ErrorBoundary>,
  document.getElementById("root")
);
