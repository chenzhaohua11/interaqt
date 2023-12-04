import {sendRequestRelation, userTotalUnhandledRequest} from "./requestEntity.js";
import {friendRelation} from "./createFriendRelationActivity.js";
import {userEntity} from "./user.js";
import {
    Action,
    Activity,
    ActivityGroup,
    BoolAtomData,
    createUserRoleAttributive,
    Entity,
    Interaction,
    MapActivityToRecord,
    Payload,
    PayloadItem,
    Relation,
    RelationStateMachine,
    RelationStateNode,
    RelationStateTransfer,
    Transfer,
    UserAttributives,
    UserAttributive,
    Property,
    RelationBasedEvery,
    RelationBasedAny,
    RelationCount
} from "@interaqt/shared";

userEntity.properties.push(Property.create({
    name: 'totalUnhandledRequest',
    type: 'number',
    collection: false,
    computedData: userTotalUnhandledRequest
}))

userEntity.properties.push(Property.create({
    name: 'everySendRequestHandled',
    type: 'boolean',
    collection: false,
    computedData: RelationBasedEvery.create({
        relation: sendRequestRelation,
        relationDirection: 'target',
        matchExpression: (request) => request.handled
    })
}))

userEntity.properties.push(Property.create({
    name: 'anySendRequestHandled',
    type: 'boolean',
    collection: false,
    computedData: RelationBasedAny.create({
        relation: sendRequestRelation,
        relationDirection: 'target',
        matchExpression: (request) => request.handled
    })
}))

// 计算 total friend count
const userTotalFriendCount = RelationCount.create({
    relation: friendRelation,
    relationDirection: 'source',
    matchExpression: () => true
})

userEntity.properties.push(Property.create({
    name: 'totalFriendCount',
    type: 'number',
    collection: false,
    computedData: userTotalFriendCount
}))