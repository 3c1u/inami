import * as React from 'react';

import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';

import { makeStyles } from '@material-ui/core/styles';

import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';

import TwitterIcon from '@material-ui/icons/Twitter';
import GitHubIcon from '@material-ui/icons/GitHub';

const useStyles = makeStyles((theme) => ({
root: {
    flexGrow: 1,
},
menuButton: {
    marginRight: theme.spacing(2),
},
title: {
    flexGrow: 1,
},
}));

export default function Menu(props: {}) {
    const classes = useStyles();

    return (
        <AppBar>
            <Toolbar>
                <Typography variant="h6" className={classes.title}>
                    スス語
                </Typography>

                <Tooltip title="Follow on GitHub" aria-label="twitter">
                    <IconButton
                        color="inherit"
                        aria-label="GitHub"
                        href="https://github.com/3c1u">
                        <GitHubIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Follow on Twitter" aria-label="twitter">
                    <IconButton
                        edge="end"
                        color="inherit"
                        aria-label="Twitter"
                        href="https://www.twitter.com/murueka_misw">
                        <TwitterIcon />
                    </IconButton>
                </Tooltip>
            </Toolbar>
        </AppBar>
    )
}
