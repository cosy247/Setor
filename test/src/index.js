import { render, setRootStyle } from '../../scripts';
import { setSore } from '../../scripts/store';
import './app';

setSore({
    username: 'wendy',
    age: 12,
});

setRootStyle(/* css */`
    * {
        padding: 0;
        margin: 0;
    }
`);

render('#root', 'app-root');
