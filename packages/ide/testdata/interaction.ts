import {createUserRoleAttributive, UserAttributive} from "../../shared/user/User";
import {Entity} from "../../shared/entity/Entity";

export const NewAttr = UserAttributive.createReactive({
    name: 'New',
    stringContent: `function New(){}`
})

export const New2Attr = UserAttributive.createReactive({
    name: 'New2',
    stringContent: `function New2(){}`
})

export const New3Attr = UserAttributive.createReactive({
    name: 'New3',
    stringContent: `function New3(){}`
})


export const OldAttr = UserAttributive.createReactive({
    name: 'Old',
    stringContent: `function Old(){}`
})

export const Old2Attr = UserAttributive.createReactive({
    name: 'Old2',
    stringContent: `function Old2(){}`
})

export const Old3Attr = UserAttributive.createReactive({
    name: 'Old3',
    stringContent: `function Old3(){}`
})

export const OtherAttr = UserAttributive.createReactive({
    name: 'Other',
    // stringContent: `function Other({ user }, {currentUser}){ user.id !== currentUser.id }`
    stringContent: `function Other(){}`
})

export const User = createUserRoleAttributive( {
    name: 'User'
}, { isReactive: true })

export const Admin = createUserRoleAttributive( {
    name: 'Admin'
}, { isReactive: true })

export const Anonymous = createUserRoleAttributive( {
    name: 'Anonymous'
}, { isReactive: true })

export const Message = Entity.createReactive({
    name: 'Message',
    properties: [{
        name: 'content',
        type: 'string',
        collection: false,
    }]
})