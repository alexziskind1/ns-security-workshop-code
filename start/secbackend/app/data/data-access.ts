import * as fs from 'fs';
import { PtRegisterModel } from '../shared/models/domain';
import { User } from '../shared/models/user.model';
import { newGuid } from '../util/guid';

const USERS_FILE = './app/data/users.json';

function ensureUserFile() {
    if (fs.existsSync(USERS_FILE)) {
        return;
    } else {
        fs.appendFileSync(USERS_FILE, '{ "users": [] }');
    }
}

export function getUsers(): User[] {
    ensureUserFile();
    const fileContentsStr = fs.readFileSync(USERS_FILE).toString();
    const { users } = JSON.parse(fileContentsStr);
    return users;
}

export function createUser(regModel: PtRegisterModel) {
    const allUsers = getUsers();
    const newId = newGuid();
    allUsers.push({ ...regModel, id: newId });
    const newUsersDataStr = JSON.stringify({users: allUsers});
    fs.writeFileSync(USERS_FILE, newUsersDataStr);
}

export function getUser(email: string): User | undefined {
    const allUsers = getUsers();
    const foundUser = allUsers.find(u => u.email === email);
    return foundUser;
}