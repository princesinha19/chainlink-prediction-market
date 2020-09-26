import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import {
    BrowserRouter,
    Router,
    Route,
    Redirect,
} from "react-router-dom";
import history from './Utils/History';
import ViewMarket from './ViewMarket/index';
import ListMarket from './ListMarket/index';

function App() {
    const routes = (
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <Route path="/" exact>
                <ListMarket />
            </Route>
            <Route path="/market/:pmContractAddress" exact>
                <ViewMarket />
            </Route>
            <Redirect to="/" />
        </BrowserRouter>
    );

    return (
        <div className="App">
            <Router history={history}>
                {routes}
            </Router>
        </div>
    );
}

export default App;
