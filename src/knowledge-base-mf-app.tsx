import React from 'react';
import ReactDOMClient from 'react-dom/client';
import singleSpaReact from 'single-spa-react';
import i18n from './i18n/config';
import { KnowledgeBaseMfeRoot } from './providers';
import '@sber-orm/ui-kit/index.css';
import '@sber-orm/components/index.css';
import './index.css';

const lifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  rootComponent: KnowledgeBaseMfeRoot,
  errorBoundary() {
    return <div role='alert'>{i18n.t('errorTitle')}</div>;
  },
});

export const { bootstrap, mount, unmount } = lifecycles;
