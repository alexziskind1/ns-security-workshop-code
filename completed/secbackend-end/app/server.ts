// tslint:disable-next-line:no-var-requires
require('dotenv').config();

import * as bodyParser from 'body-parser';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';

import express from 'express';
import { Express, Request, Response, Router } from 'express';

import expressJwt from 'express-jwt';
import jwtDecode from 'jwt-decode';

import * as mockgen from './data/mock-data-generator';

import { createUser, getUser } from './data/data-access';
import {  PtComment, PtItem, PtTask, PtUser } from './shared/models/domain';
import { createToken, hashPassword, verifyPassword } from './util/security-utils';

const jwtCheckMiddleware = expressJwt({
    secret: process.env.SECRET!
});

const generatedPtUserWithAuth = mockgen.generateUsers();
const generatedPtUsers = generatedPtUserWithAuth.map((u) => {
    const user: PtUser = {
        avatar: u.avatar,
        dateCreated: u.dateCreated,
        dateDeleted: u.dateDeleted,
        dateModified: u.dateModified,
        fullName: u.fullName,
        id: u.id,
        title: u.title
    };
    return user;
});
const generatedPtItems = mockgen.generatePTItems(generatedPtUsers);

let currentPtUsers = generatedPtUsers.slice(0);
let currentPtItems = generatedPtItems.slice(0);

function getNextIntergerId(arrayWithIdProp: Array<{ id: number }>) {
    const newId = arrayWithIdProp.length > 0 ? (Math.max(...arrayWithIdProp.map((i) => i.id))) + 1 : 1;
    return newId;
}

const app: Express = express();

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/app'));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// ROUTES FOR OUR API
// =================================================================
const router: Router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.json({ message: 'hooray! welcome to our api!!' });
});

router.post('/login', (req: Request, res: Response) => {
    const user = getUser(req.body.email);

    if (user) {
        const passwordMatches = verifyPassword(req.body.password, user.password);
        if (passwordMatches) {

            const jwt = createToken(user.id, user.email);
            const decodedJwt = jwtDecode<{exp: string}>(jwt);

            return res.status(200).json({
                access_token: jwt,
                expires: decodedJwt.exp,
                message: 'User logged in'
            });

        } else {
            res.status(403).json({
                message: 'Wrong email or password'
            });
        }
    } else {
        res.status(403).json({
            message: 'Wrong email or password'
        });
    }
});

router.post('/register', (req: Request, res: Response) => {

    const hashedPassword = hashPassword(req.body.password);

    const userData = {
        email: req.body.email,
        password: hashedPassword
    };
    createUser(userData);
    return res.json({ message: 'User created' });
});

router.get('/users', (req: Request, res: Response) => {
    res.json(currentPtUsers);
});

router.get('/backlog', jwtCheckMiddleware, (req: Request, res: Response) => {
    res.json(currentPtItems);
});

router.get('/myItems', (req: Request, res: Response) => {
    let userId: number;
    if (req.query && req.query.userId) {
        userId = parseInt(req.query.userId, undefined);
    }
    let found = false;

    if (currentPtUsers.findIndex((u) => u.id === userId) >= 0) {
        found = true;
    }

    const filteredItems = currentPtItems.filter((i) => i.assignee.id === userId && i.dateDeleted === undefined);

    if (!found) {
        res.status(404);
    }
    res.json(filteredItems);
});

router.get('/openItems', (req: Request, res: Response) => {
    const filteredItems = currentPtItems.filter((i) =>
        (i.status === 'Open' || i.status === 'ReOpened') && i.dateDeleted === undefined);
    res.json(filteredItems);
});

router.get('/closedItems', (req: Request, res: Response) => {
    const filteredItems = currentPtItems.filter((i) => i.status === 'Closed' && i.dateDeleted === undefined);
    res.json(filteredItems);
});

router.get('/item/:id', (req: Request, res: Response) => {
    const itemId = parseInt(req.params.id, undefined);
    const foundItem = currentPtItems.find((i) => i.id === itemId && i.dateDeleted === undefined);

    let found = false;
    if (foundItem) {
        found = true;

        const undeletedTasks = foundItem.tasks.filter((t) => t.dateDeleted === undefined);
        foundItem.tasks = undeletedTasks;
    }

    if (!found) {
        res.status(404);
        res.json(null);
    } else {
        res.json(foundItem);
    }
});

router.post('/item', (req: Request, res: Response) => {
    if (req.body) {
        if (req.body.item) {
            const newItem = req.body.item as PtItem;
            newItem.id = getNextIntergerId(currentPtItems);
            const newItems = [newItem, ...currentPtItems];
            currentPtItems = newItems;
            res.json(newItem);
        } else {
            res.json(null);
        }
    }
});

router.put('/item/:id', (req: Request, res: Response) => {
    const itemId = parseInt(req.params.id, undefined);

    if (req.body) {
        if (req.body.item) {
            let found = false;
            const modifiedItem = req.body.item as PtItem;

            const foundItem = currentPtItems.find((i) => i.id === itemId && i.dateDeleted === undefined);

            if (foundItem) {
                found = true;
                const updatedItems = currentPtItems.map((i) => {
                    if (i.id === itemId) { return modifiedItem; } else { return i; }
                });

                currentPtItems = updatedItems;
            }
            if (!found) {
                res.status(404);
            }
            res.json(modifiedItem);
        }
    }
});

router.delete('/item/:id', (req: Request, res: Response) => {
    const itemId = parseInt(req.params.id, undefined);
    const foundItem = currentPtItems.find((i) => i.id === itemId && i.dateDeleted === undefined);
    if (foundItem) {
        const itemToDelete = Object.assign({}, foundItem, { dateDeleted: new Date() });
        const updatedItems = currentPtItems.map((i) => {
            if (i.id === itemId) { return itemToDelete; } else { return i; }
        });
        currentPtItems = updatedItems;
        res.json({
            id: itemId,
            result: true
        });

    } else {
        res.status(404);
        res.json({
            id: itemId,
            result: false
        });
    }
});

router.post('/task', (req: Request, res: Response) => {
    if (req.body) {
        if (req.body.task && req.body.itemId) {

            const newTask = req.body.task as PtTask;
            const itemId = parseInt(req.body.itemId, undefined);

            const foundItem = currentPtItems.find((i) => i.id === itemId && i.dateDeleted === undefined);

            if (foundItem) {
                newTask.id = getNextIntergerId(foundItem.tasks);

                const updatedTasks = [newTask, ...foundItem.tasks];

                const updatedItem = Object.assign({}, foundItem, { tasks: updatedTasks });

                const updatedItems = currentPtItems.map((i) => {
                    if (i.id === itemId) { return updatedItem; } else { return i; }
                });

                currentPtItems = updatedItems;

                res.json(newTask);
            } else {
                res.status(404);
                res.json({
                    id: itemId,
                    result: false
                });
            }
        } else {
            res.json(null);
        }
    }
});

router.put('/task/:id', (req: Request, res: Response) => {
    const taskId = req.params.id;

    if (req.body) {
        if (req.body.task && req.body.itemId) {
            let found = false;
            const modifiedTask = req.body.task as PtTask;
            const itemId = parseInt(req.body.itemId, undefined);

            const foundItem = currentPtItems.find((i) => i.id === itemId && i.dateDeleted === undefined);

            if (foundItem) {
                const updatedTasks = foundItem.tasks.map((t) => {
                    if (t.id === modifiedTask.id) {
                        found = true;
                        return modifiedTask;
                    } else { return t; }
                });

                const updatedItem = Object.assign({}, foundItem, { tasks: updatedTasks });

                const updatedItems = currentPtItems.map((i) => {
                    if (i.id === itemId) { return updatedItem; } else { return i; }
                });

                currentPtItems = updatedItems;

                if (!found) {
                    res.status(404);
                }
                res.json(modifiedTask);
            } else {
                res.status(404);
                res.json(null);
            }
        }
    }
});

router.post('/task/:itemId/:id', (req: Request, res: Response) => {
    const itemIdStr = req.params.itemId;
    const taskIdStr = req.params.id;

    if (itemIdStr && taskIdStr) {
        const itemId = parseInt(req.params.itemId, undefined);
        const taskId = parseInt(req.params.id, undefined);

        const foundItem = currentPtItems.find((i) => i.id === itemId && i.dateDeleted === undefined);
        if (foundItem) {
            let found = false;

            const updatedTasks = foundItem.tasks.map((t) => {
                if (t.id === taskId) {
                    found = true;
                    const deletedTask: PtTask = {
                        ...t,
                        dateDeleted: new Date()
                    };
                    return deletedTask;
                } else { return t; }
            });

            const updatedItem = Object.assign({}, foundItem, { tasks: updatedTasks });

            const updatedItems = currentPtItems.map((i) => {
                if (i.id === itemId) { return updatedItem; } else { return i; }
            });

            currentPtItems = updatedItems;

            if (!found) {
                res.status(404);
            }
            res.json(true);

        } else {
            res.status(404);
            res.json(false);
        }
    } else {
        res.status(404);
        res.json(false);
    }
});

router.post('/comment', (req: Request, res: Response) => {
    if (req.body) {
        if (req.body.comment && req.body.itemId) {

            const newComment = req.body.comment as PtComment;
            const itemId = parseInt(req.body.itemId, undefined);

            const foundItem = currentPtItems.find((i) => i.id === itemId && i.dateDeleted === undefined);

            if (foundItem) {
                newComment.id = getNextIntergerId(foundItem.comments);

                const updatedComments = [newComment, ...foundItem.comments];

                const updatedItem = Object.assign({}, foundItem, { comments: updatedComments });

                const updatedItems = currentPtItems.map((i) => {
                    if (i.id === itemId) { return updatedItem; } else { return i; }
                });

                currentPtItems = updatedItems;

                res.json(newComment);
            } else {
                res.status(404);
                res.json(null);
            }
        } else {
            res.json(null);
        }
    }
});

router.get('/photo/:id', (req: Request, res: Response) => {
    const userId = parseInt(req.params.id, undefined);
    const user = currentPtUsers.find((u) => u.id === userId && u.dateDeleted === undefined);

    if (user) {
        res.sendFile(`${__dirname}/${user.avatar}`);
    } else {
        res.status(404);
        res.json(null);
    }
});

router.delete('/users/:id', (req: Request, res: Response) => {
    const userId = parseInt(req.params.id, undefined);

    const user = currentPtUsers.find((u) => u.id === userId && u.dateDeleted === undefined);

    if (user) {
        user.dateDeleted = new Date();
        res.json({
            id: userId,
            result: true
        });
    } else {
        res.status(404);
        res.json({
            id: userId,
            result: false
        });
    }
});

router.put('/users/:id', (req: Request, res: Response) => {
    const userId = req.params.id;
    const modifiedUser = req.body;

    let found = false;

    const newUsers = currentPtUsers.map((u) => {
        if (u.id === userId && u.dateDeleted === undefined) {
            found = true;
            return modifiedUser;
        } else {
            return u;
        }
    });
    currentPtUsers = newUsers;

    if (!found) {
        res.status(404);
    }
    res.json({
        id: userId,
        result: modifiedUser
    });
});

// statistics

router.get('/stats/statuscounts', (req: Request, res: Response) => {
    const openItemsFilter = (i: PtItem) =>
        (i.status === 'Open' || i.status === 'ReOpened') && i.dateDeleted === undefined;
    const closedItemsFilter = (i: PtItem) =>
        i.status === 'Closed' && i.dateDeleted === undefined;

    const openItems = currentPtItems
        .filter(openItemsFilter)
        .filter(getItemFilterByUser(req))
        .filter(getItemFilterByDateRange(req));
    const closedItems = currentPtItems
        .filter(closedItemsFilter)
        .filter(getItemFilterByUser(req))
        .filter(getItemFilterByDateRange(req));
    const activeItemsCount = openItems.length + closedItems.length;

    res.json({
        activeItemsCount,
        closeRate: closedItems.length / activeItemsCount * 100,
        closedItemsCount: closedItems.length,
        openItemsCount: openItems.length
    });
});

router.get('/stats/prioritycounts', (req: Request, res: Response) => {
    const pLowItemsFilter = (i: PtItem) => i.priority === 'Low' && i.dateDeleted === undefined;
    const pMediumItemsFilter = (i: PtItem) => i.priority === 'Medium' && i.dateDeleted === undefined;
    const pHighItemsFilter = (i: PtItem) => i.priority === 'High' && i.dateDeleted === undefined;
    const pCriticalItemsFilter = (i: PtItem) => i.priority === 'Critical' && i.dateDeleted === undefined;

    const lowItems = currentPtItems
        .filter(pLowItemsFilter)
        .filter(getItemFilterByUser(req))
        .filter(getItemFilterByDateRange(req));
    const mediumItems = currentPtItems
        .filter(pMediumItemsFilter)
        .filter(getItemFilterByUser(req))
        .filter(getItemFilterByDateRange(req));
    const highItems = currentPtItems
        .filter(pHighItemsFilter)
        .filter(getItemFilterByUser(req))
        .filter(getItemFilterByDateRange(req));
    const criticalItems = currentPtItems
        .filter(pCriticalItemsFilter)
        .filter(getItemFilterByUser(req))
        .filter(getItemFilterByDateRange(req));

    res.json({
        critical: criticalItems.length,
        high: highItems.length,
        low: lowItems.length,
        medium: mediumItems.length
    });
});

router.get('/stats/typecounts', (req: Request, res: Response) => {
    const tBugItemsFilter = (i: PtItem) => i.type === 'Bug' && i.dateDeleted === undefined;
    const tChoreItemsFilter = (i: PtItem) => i.type === 'Chore' && i.dateDeleted === undefined;
    const tImpedimentItemsFilter = (i: PtItem) => i.type === 'Impediment' && i.dateDeleted === undefined;
    const tPbiItemsFilter = (i: PtItem) => i.type === 'PBI' && i.dateDeleted === undefined;

    const bugItems = currentPtItems
        .filter(tBugItemsFilter)
        .filter(getItemFilterByUser(req))
        .filter(getItemFilterByDateRange(req));
    const choreItems = currentPtItems
        .filter(tChoreItemsFilter)
        .filter(getItemFilterByUser(req))
        .filter(getItemFilterByDateRange(req));
    const impedimentItems = currentPtItems
        .filter(tImpedimentItemsFilter)
        .filter(getItemFilterByUser(req))
        .filter(getItemFilterByDateRange(req));
    const pbiItems = currentPtItems
        .filter(tPbiItemsFilter)
        .filter(getItemFilterByUser(req))
        .filter(getItemFilterByDateRange(req));

    res.json({
        critical: bugItems.length,
        high: choreItems.length,
        low: impedimentItems.length,
        medium: pbiItems.length
    });
});

interface ItemsForMonth {
    closed: PtItem[];
    open: PtItem[];
}

interface FilteredIssues {
    categories: Date[];
    items: ItemsForMonth[];
}

router.get('/stats/filteredissues', (req: Request, res: Response) => {
    const openItemsFilter = (i: PtItem) =>
        (i.status === 'Open' || i.status === 'ReOpened') && i.dateDeleted === undefined;
    const closedItemsFilter = (i: PtItem) =>
        i.status === 'Closed' && i.dateDeleted === undefined;

    const items = currentPtItems
        .filter(getItemFilterByUser(req))
        .filter(getItemFilterByDateRange(req));

    const maxDate = new Date(Math.max.apply(null, items.map((i) => new Date(i.dateCreated).valueOf())));
    const minDate = new Date(Math.min.apply(null, items.map((i) => new Date(i.dateCreated).valueOf())));

    const categories = getDates(minDate, maxDate);

    const itemsByMonth = categories.map((c) => {
        const monthItems = items.filter((i) => {
            if (i.dateCreated) {
                const dc = new Date(i.dateCreated);
                return dc.getMonth() === c.getMonth() &&
                    dc.getFullYear() === c.getFullYear();
            }
        });
        return monthItems;
    });

    const categorizedAndDivided = itemsByMonth.map((c): ItemsForMonth => {
        const openItemsForMonth = c.filter(openItemsFilter);
        const closedItemsForMonth = c.filter(closedItemsFilter);
        return {
            closed: closedItemsForMonth,
            open: openItemsForMonth
        };
    });

    const ret: FilteredIssues = {
        categories,
        items: categorizedAndDivided
    };

    res.json(ret);
});

function getItemFilterByUser(req: Request): (i: PtItem) => boolean {
    let userFilter = (item: PtItem) => true;
    if (req.query.userId) {
        const userId = parseInt(req.query.userId, undefined);
        if (userId > 0) {
            userFilter = (item: PtItem) => item.assignee.id === userId;
        }
    }
    return userFilter;
}

function getItemFilterByDateRange(req: Request): (i: PtItem) => boolean {
    let rangeFilter = (item: PtItem) => true;
    if (req.query.dateStart && req.query.dateEnd) {
        const dateStart = new Date(req.query.dateStart);
        const dateEnd = new Date(req.query.dateEnd);
        rangeFilter = (item: PtItem) => item.dateCreated >= dateStart && item.dateCreated <= dateEnd;
    }
    return rangeFilter;
}

const addMonths = (to: Date, months: number): Date => {
    const date = new Date(to.valueOf());
    date.setMonth(date.getMonth() + months);
    return date;
};

const getDates = (startDate: Date, endDate: Date) => {
    const dates = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
        dates.push(currentDate);
        currentDate = addMonths(currentDate, 1);
    }
    return dates;
};

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);


const sslOptions = {
    cert: fs.readFileSync('cert.pem'),
    key: fs.readFileSync('key.pem')
};


const port = 8080;
const sslPort = 8443;

const httpServer = http.createServer(app);
const httpsServer = https.createServer(sslOptions, app);


httpServer.listen(port);
httpsServer.listen(sslPort);
