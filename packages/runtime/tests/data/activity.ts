import {createUserRoleAttributive, UserAttributive, UserAttributives} from "../../../shared/user/User";
import {
    Action,
    Activity,
    ActivityGroup,
    Interaction,
    Payload,
    PayloadItem,
    Transfer
} from "../../../shared/activity/Activity";
import {OtherAttr} from "./roles";
import {Entity, Property, PropertyTypes, Relation} from "../../../shared/entity/Entity";
import {RelationStateMachine, RelationStateNode, RelationStateTransfer, MapActivityToEntity} from "../../../shared/IncrementalComputation";
import {removeAllInstance, stringifyAllInstances} from "../../../shared/createClass";

const UserEntity = Entity.createReactive({ name: 'User' })
const nameProperty = Property.createReactive({ name: 'name', type: PropertyTypes.String })
const ageProperty = Property.createReactive({ name: 'age', type: PropertyTypes.Number })
UserEntity.properties.push(nameProperty)
UserEntity.properties.push(ageProperty)
export const Message = Entity.createReactive({
    name: 'Message',
    properties: [{
        name: 'content',
        type: 'string',
        collection: false,
    }]
})

export const globalUserRole = createUserRoleAttributive({name: 'user'}, {isReactive: true})
const userRefA = createUserRoleAttributive({name: 'A', isRef: true}, {isReactive: true})
export const userRefB = createUserRoleAttributive({name: 'B', isRef: true}, {isReactive: true})
export const sendInteraction = Interaction.createReactive({
    name: 'sendRequest',
    userAttributives: UserAttributives.createReactive({}),
    userRoleAttributive: globalUserRole,
    userRef: userRefA,
    action: Action.createReactive({name: 'sendRequest'}),
    payload: Payload.createReactive({
        items: [
            PayloadItem.createReactive({
                name: 'to',
                attributives: UserAttributives.createReactive({
                    content: {
                        type:'atom',
                        data: {
                            key: OtherAttr.name
                        }
                    }
                }),
                base: globalUserRole,
                itemRef: userRefB
            }),
            PayloadItem.createReactive({
                name: 'message',
                base: Message,
                itemRef: Entity.createReactive({name: '', isRef: true}),
            })
        ]
    })
})
export const approveInteraction = Interaction.createReactive({
    name: 'approve',
    userAttributives: UserAttributives.createReactive({}),
    userRoleAttributive: userRefB,
    userRef: createUserRoleAttributive({name: '', isRef: true}, {isReactive: true}),
    action: Action.createReactive({name: 'approve'}),
    payload: Payload.createReactive({})
})
const rejectInteraction = Interaction.createReactive({
    name: 'reject',
    userAttributives: UserAttributives.createReactive({}),
    userRoleAttributive: userRefB,
    userRef: createUserRoleAttributive({name: '', isRef: true}, {isReactive: true}),
    action: Action.createReactive({name: 'reject'}),
    payload: Payload.createReactive({
        items: [
            PayloadItem.createReactive({
                name: 'reason',
                base: Message,
                itemRef: Entity.createReactive({name: '', isRef: true}),
            })
        ]
    })
})
const cancelInteraction = Interaction.createReactive({
    name: 'cancel',
    userAttributives: UserAttributives.createReactive({}),
    userRoleAttributive: userRefA,
    userRef: createUserRoleAttributive({name: '', isRef: true}, {isReactive: true}),
    action: Action.createReactive({name: 'cancel'}),
    payload: Payload.createReactive({})
})
const responseGroup = ActivityGroup.createReactive({
    type: 'any',
    activities: [
        Activity.createReactive({
            interactions: [
                approveInteraction
            ]
        }),
        Activity.createReactive({
            interactions: [
                rejectInteraction
            ]
        }),
        Activity.createReactive({
            interactions: [
                cancelInteraction
            ]
        })
    ],
})
export const activity = Activity.createReactive({
    name: "createFriendRelation",
    interactions: [
        sendInteraction
    ],
    groups: [
        responseGroup
    ],
    transfers: [
        Transfer.createReactive({
            name: 'fromSendToResponse',
            source: sendInteraction,
            target: responseGroup
        })
    ]
})

// FIXME 还要增加一个 removeFriend 的 interaction
export const MyFriend = UserAttributive.createReactive({
    name: 'MyFriend',
    stringContent: `
async function MyFriend(target, { user }){
console.log(999, 'checking friend', target.id, user.id, !!(await this.system.storage.findOneRelationById('User', 'friends', user.id, target.id)))
    return !!(await this.system.storage.findOneRelationById('User', 'friends', user.id, target.id))  
}`
})

export const deleteInteraction = Interaction.createReactive({
    name: 'deleteFriend',
    userAttributives: UserAttributives.createReactive({}),
    userRoleAttributive: globalUserRole,
    userRef: createUserRoleAttributive({name: '', isRef: true}, {isReactive: true}),
    action: Action.createReactive({name: 'deleteFriend'}),
    payload: Payload.createReactive({
        items: [
            PayloadItem.createReactive({
                name: 'target',
                attributives: UserAttributives.createReactive({
                    content: {
                        type: 'atom',
                        data: {
                            key:MyFriend.name
                        }
                    }
                }),
                base: globalUserRole,
                isRef: true,
                itemRef: Entity.createReactive({name: '', isRef: true}),
            }),
        ]
    })
})


// friend 关系的状态机描述
const notFriendState = RelationStateNode.createReactive({
    hasRelation: false
})
const isFriendState = RelationStateNode.createReactive({
    hasRelation: true
})

const addFriendTransfer = RelationStateTransfer.createReactive({
    sourceActivity: activity,
    triggerInteraction: approveInteraction,
    fromState: notFriendState,
    toState: isFriendState,
    handleType: 'computeSource',
    handle: `
async function(eventArgs, activityId) {
    const sendEvent = (await this.system.getEvent({
        interactionName: 'sendRequest',
        activityId
    }))[0]
    return {
        source: sendEvent.args.user,
        target: eventArgs.user
    }
}
`
})

const deleteFriendTransfer = RelationStateTransfer.createReactive({
    // sourceActivity: activity,
    triggerInteraction: deleteInteraction,
    fromState: isFriendState,
    toState: notFriendState,
    handleType: 'computeSource',
    handle: `
async function(eventArgs, activityId) {
    return {
        source: eventArgs.user,
        target: eventArgs.payload.target
    }
}
`
})

const friendRelationSM = RelationStateMachine.createReactive({
    states: [notFriendState, isFriendState],
    transfers: [addFriendTransfer, deleteFriendTransfer],
    defaultState: notFriendState
})






Relation.createReactive({
    entity1: UserEntity,
    targetName1: 'friends',
    entity2: UserEntity,
    targetName2: 'friends',
    relType: 'n:n',
    computedData: friendRelationSM
})





export const mapFriendActivityToRequest = MapActivityToEntity.createReactive({
    sourceActivity: activity,
    triggerInteraction: [sendInteraction, approveInteraction, rejectInteraction],
    handle:`function map(stack){
        const sendRequestEvent = stack.find(i => i.interaction.name === 'sendRequest')
        
if (!sendRequestEvent) { 
    return undefined
}

const handled = !!stack.find(i => i.interaction.name === 'approve' || i.interaction.name === 'reject')
        
return {
    from: sendRequestEvent.data.user,
    to: sendRequestEvent.data.payload.to,
    message: sendRequestEvent.data.payload.message,
    handled,
}
}`
})

const requestEntity= Entity.createReactive({
    name: 'Request',
    computedData: mapFriendActivityToRequest,
    properties: [Property.createReactive({
        name: 'handled',
        type:'boolean',
        collection: false,
    })]
})

Relation.createReactive({
    entity1: requestEntity,
    targetName1: 'from',
    entity2: UserEntity,
    targetName2: 'request',
    relType: 'n:1'
})

Relation.createReactive({
    entity1: requestEntity,
    targetName1: 'to',
    entity2: UserEntity,
    targetName2: 'receivedRequest',
    relType: 'n:1'
})


Relation.createReactive({
    entity1: requestEntity,
    targetName1: 'message',
    entity2: Message,
    targetName2: 'request',
    relType: '1:1'
})

export const data = JSON.parse(stringifyAllInstances())
removeAllInstance()