import * as React from 'react'

import Menu from './Menu'
import { MenuItem, Container, Toolbar, Button, makeStyles, FormControl, InputLabel, Select, Typography, Box, Link, Paper } from '@material-ui/core'

import { ControlledEditor } from '@monaco-editor/react'
import Interpreter from './Interpreter'

const useStyles = makeStyles((theme) => ({
    main: {
        width: 'auto',
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
    },
    paper: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
        padding: theme.spacing(4),
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 300,
    },
    footer: {
        marginBottom: theme.spacing(3),
    },
    buttons: {
        margin: theme.spacing(1),
        '& button': {
            margin: theme.spacing(1),
        }
    }
}))

const editorOptions = {
    fontFamily: [
        "Fira Code", "monospace"
    ].map(v => JSON.stringify(v)).join(', '),
    fontLigatures: true,
    fontSize: 14,
}

const kSusukoSusukoShow = "ススス す ス スススス スススス スススす スすスす スすすす すすすス スすスス スススす\n"
+ "ススススス す ス す\n"
+ "ススススス すすすすすす スス すす\n"
+ "ススススス すすすすすすす スス すす"

const kSusukoHelloWorld = "Hello, world!\n\
ススス す ス スススススススススススススススススススススススすスススススススス\n\
ススス すすす ススス すすすすすすすすすすすすすすすすすすすすすすすすすすすすすすすす\n\
ス すすすす スス すす\n\
ススススス すすす ス す\n\
ススススス す ス す\n\
ススススス すす ス す\n\
ススススス すす ス す\n\
ススススス すすすすすすすすす スス すす\n\
ススススス すすすすすすす スス すす"

const kSusukoConway = "TODO"

const interpreter = new Interpreter(0x400000)

export default function App(props: {}) {
    const classes = useStyles()
    const [example, setExample] = React.useState('')
    const [editor, setEditor] = React.useState(kSusukoHelloWorld)

    const handleChange = (event) => {
        setExample(event.target.value)

        switch (event.target.value) {
            case 1:
                setEditor(kSusukoHelloWorld)
                break
            case 2:
                setEditor(kSusukoSusukoShow)
                break
            case 3:
                setEditor(kSusukoConway)
                break
            default:
                break
        }
    }

    const handleEditorChange = (event, value) => {
        setEditor(value)
    }

    const theCanvas = React.useRef()

    React.useEffect(() => {
        console.log('mounted')
        interpreter.setCanvas(theCanvas.current)

        return (() => {
            console.log('unmount')
            interpreter.setCanvas()
        })
    })

    return (
        <>
            <Menu />
            <Toolbar />
            <main className={classes.main}>
                <Paper className={classes.paper}>
                    <Typography component="h2" variant="h5">
                        スス語 - The Susuko Programming Language
                </Typography>
                    <Container>
                        <FormControl className={classes.formControl}>
                            <InputLabel htmlFor="age-native-simple">Load examples...</InputLabel>
                            <Select onChange={handleChange} value={example}>
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                <MenuItem value={1}>Hello, world!</MenuItem>
                                <MenuItem value={2}>Susuko</MenuItem>
                                <MenuItem value={3}>Conway's Game of Life</MenuItem>
                            </Select>
                        </FormControl>
                    </Container>
                    <ControlledEditor height="30vh"
                        value={editor}
                        onChange={handleEditorChange}
                        language="plain"
                        theme="vs-dark"
                        options={editorOptions} />
                    <Box className={classes.buttons}>
                        <Button variant="contained" color="primary" onClick={
                            () => {
                                interpreter.loadProgram(editor)
                                interpreter.execute()
                            }
                        }>
                            Execute
                        </Button>
                        <Button variant="contained" color="secondary" onClick={
                            () => interpreter.reset()
                        }>
                            Reset
                        </Button>
                        <Button variant="contained" onClick={
                            () => interpreter.step()
                        }>
                            Step
                        </Button>
                    </Box>
                    <Box>
                        <canvas ref={theCanvas} width={300} height={300} style={
                            {
                                backgroundColor: "black"
                            }
                        } />
                    </Box>
                </Paper>
            </main>
            <footer className={classes.footer}>
                <Typography variant="body2" color="textSecondary" align="center">
                    {'Copyright © 2020 '}
                    <Link color="inherit" href="https://www.github.com/3c1u">
                        Hikaru Terazono (3c1u)
                    </Link>
                </Typography>
            </footer>
        </>
    )
}
