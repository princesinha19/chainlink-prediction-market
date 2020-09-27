import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import {
    HashRouter,
    Route,
    Redirect,
    Switch,
} from "react-router-dom";
import history from './Utils/History';
import ViewMarket from './ViewMarket/index';
import ListMarket from './ListMarket/index';

function App() {
    const routes = (
        <Switch>
            <Route path="/" exact>
                <ListMarket />
            </Route>
            <Route path="/market/:pmContractAddress" exact>
                <ViewMarket />
            </Route>
            <Redirect to="/" />
        </Switch>
    );

    return (
        <div className="App">
            <HashRouter history={history}>
                {routes}
            </HashRouter>
        </div>
    );
}

export default App;
