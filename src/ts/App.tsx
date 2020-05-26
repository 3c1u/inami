import * as React from 'react';

import Menu from './Menu';
import { MenuItem, Container, Toolbar, Button, makeStyles, FormControl, InputLabel, Select, Typography, Box } from '@material-ui/core';

import { ControlledEditor } from '@monaco-editor/react';

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
    marginTop: theme.spacing(3),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 300,
  }
}));

const editorOptions = {
    fontFamily: [
        "Fira Code", "monospace"
    ].map(v => JSON.stringify(v)).join(', '),
    fontLigatures: true,
    fontSize: 14,
}

export default function App(props: {}) {
    const classes = useStyles();
    const [example, setExample] = React.useState('');
    const [editor, setEditor] = React.useState(
        'おはすすこっす！'
    );

    const handleChange = (event) => {
        setExample(event.target.value)

        switch (event.target.value) {
        case 1:
            setEditor("Hello, world!")
            break;
        case 2:
            setEditor("Quine")
            break;
        case 3:
            setEditor("Conway's Game of Life")
            break;
        default:
            break;
        }
    };

    const handleEditorChange = (event, value) => {
        setEditor(value)
    };
    
    return (
        <>
            <Menu />
            <Toolbar />
            <Container className={classes.root}>
                <Box>
                    <Typography component="h2" variant="h5">
                        スス語 - The Susuko Programming Language
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="body1">
                        おはすすこっす！
                    </Typography>
                </Box>
                <Typography component="h3" variant="h6">
                    Input
                </Typography>
                <Container>
                    <FormControl className={classes.formControl}>
                    <InputLabel htmlFor="age-native-simple">Load examples...</InputLabel>
                        <Select onChange={handleChange} value={example}>
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            <MenuItem value={1}>Hello, world!</MenuItem>
                            <MenuItem value={2}>Quine</MenuItem>
                            <MenuItem value={3}>Conway's Game of Life</MenuItem>
                        </Select>
                    </FormControl>
                </Container>
                <ControlledEditor height="30vh"
                        value={editor}
                        onChange={handleEditorChange}
                        language="plain"
                        options={editorOptions} />
                <Button variant="contained" color="primary">
                    Execute
                </Button>
                <Button variant="contained" color="secondary">
                    Reset
                </Button>

                <Typography component="h3" variant="h6">
                    Output
                </Typography>
            </Container>
        </>
    )
}
