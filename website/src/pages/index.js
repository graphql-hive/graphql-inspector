import React from 'react';
import Link from '@docusaurus/Link';
import ContactForm from '../components/contact';
import {Loading} from '../components/loading';

const Live = () => {
  const Diff = React.lazy(() => import('../components/diff'));

  return (
    <div className="live">
      <div className="live-wrapper">
        <ErrorBoundary>
          <React.Suspense fallback={<Loading color="#fff" height="300px" />}>
            <Diff />
          </React.Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return {hasError: true};
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback
      return <span>Something went wrong.</span>;
    }

    return this.props.children;
  }
}

const Contact = () => {
  return (
    <div id="contact-us">
      <div id="main-header">
        <div className="container">
          <h1>
            <span>Contact us!</span>
          </h1>
          <h2>
            Need help? Want to start using GraphQL Inspector? We would love to
            help you and hear how you use GraphQL Inspector today!
          </h2>
          <div className="contact-wrapper">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
};

const Nav = () => {
  return (
    <div id="main-nav">
      <a href="" className="logo">
        <img src="/static/img/logo.svg" alt="GraphQL Inspector Logo" />
      </a>
      <div className="links">
        <Link to="/docs">Docs</Link>
        <div className="sep" />
        <a href="/install">Install</a>
        <div className="sep" />
        <a href="https://github.com/kamilkisiela/graphql-inspector">GitHub</a>
        <div className="sep" />
        <a href="#contact-us" className="scroll-to">
          Contact
        </a>
      </div>
    </div>
  );
};

const Header = () => {
  return (
    <div id="main-header">
      <div className="container">
        <h1>
          <span>Bulletproof</span> your GraphQL API
        </h1>
        <h2>
          Detects every change, finds similar or duplicated types, validates
          documents against a schema and looks for deprecated usage.
        </h2>
        <Link to="/docs">Start to Inspect</Link>
      </div>
    </div>
  );
};

const Hightlight = (props) => {
  return (
    <div className="highlight">
      <img src={props.image} alt={props.title} />
      <div className="title">{props.title}</div>
      <div className="description">{props.description}</div>
    </div>
  );
};

const Highlights = () => {
  return (
    <div id="main-highlights">
      <div className="container">
        <Hightlight
          title="GitHub integration"
          image="/img/ui/features/github.svg"
          description="Have a per-repository, self-hosted GraphQL Inspector service or deploy it with Docker."
        />
        <Hightlight
          title="Compare GraphQL schemas"
          image="/img/ui/features/diff.svg"
          description="Detects every change (neutral, dangerous or breaking)."
        />
        <Hightlight
          title="Validate operations and fragments"
          image="/img/ui/features/validate.svg"
          description="Validates documents against a schema and looks for deprecated usage."
        />
      </div>
    </div>
  );
};

class Index extends React.Component {
  render() {
    return (
      <div>
        <div className="mainContainer">
          <Nav />
          <Header />
        </div>
        <Highlights />
        <Live />
        <Contact />
      </div>
    );
  }
}

export default Index;
