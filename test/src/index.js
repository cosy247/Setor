import { render, setRootStyle } from '../../scripts';
import { setSore } from '../../scripts/store';
import app from './app';

setSore({
    username: 'wendy',
    age: 12,
});

setRootStyle(/* css */`

`);

render('#root', app);
