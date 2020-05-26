/// <reference path='./global.d.ts'/>

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import App from './App';

import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import cyan from '@material-ui/core/colors/cyan';
import { CssBaseline } from '@material-ui/core';

let theme = createMuiTheme({
    palette: {
        primary: {
            main: '#ec407a',
        },
        secondary: cyan,
    },
});

ReactDOM.render((
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
    </ThemeProvider>
), document.getElementById('app'));
