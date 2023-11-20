import {describe, test, expect, beforeEach} from "vitest";
import {Controller} from "../Controller";
import {ActivityCall, ActivityGroupNode} from "../AcitivityCall";
import {MonoSystem} from "../MonoSystem";
import {createInstances, getInstance, KlassByName, KlassInstance, removeAllInstance, stringifyAllInstances} from "@shared/createClass";
import { Activity, Interaction } from "@shared/activity/Activity";
import { Entity, Relation } from "@shared/entity/Entity";
import { State } from "@shared/state/State";
import '../computedDataHandles/index'
import {MatchExp} from '@storage/erstorage/MatchExp'
import {AttributeError} from "../InteractionCall";

// 里面有所有必须的数据？
type User = {
    id: string,
    roles: string[],
    [k:string]: any
}

describe.only('map interaction', () => {

    let system: MonoSystem
    let sendRequestUUID: string
    let approveRequestUUID: string
    let controller: Controller

    let userAId: string
    let userBId: string
    let userCId: string
    beforeEach(async () => {
        removeAllInstance()
        const {data} = (await import('./data/leaveRequest'))
        createInstances(data, false)

        // createInstances(data, false)
        /**
         * 当前的格式为:
         * New && Other Admin as A
         * sendRequest
         * to: Other Admin isRef
         * message: Message
         */


        system = new MonoSystem()
        system.conceptClass = KlassByName
        controller = new Controller(
            system,
            [...Entity.instances].filter(e => !e.isRef),
            [...Relation.instances],
            [...Activity.instances],
            [...Interaction.instances],
            [...State.instances]
        )
        await controller.setup()
        sendRequestUUID = Interaction.instances!.find(i => i.name === 'sendRequest')!.uuid
        approveRequestUUID = Interaction.instances!.find(i => i.name === 'approve')!.uuid

        const userARef = await system.storage.create('User', {name: 'A', age: 10})
        userAId = userARef.id

        const userBRef = await system.storage.create('User', {name: 'B', age: 12})
        userBId = userBRef.id

        const userCRef = await system.storage.create('User', {name: 'C', age: 14})
        userCId = userCRef.id
    })

    test.only('map interaction to relation', async () => {
        // 0. 验证初始数据
        const userA: User = {
            ...await system.storage.findOne('User', MatchExp.atom({
                key: 'id',
                value: ['=', userAId]
            }), undefined, ['*']),
            roles: ['user']
        }

        const userB: User = {
            ...await system.storage.findOne('User', MatchExp.atom({
                key: 'id',
                value: ['=', userBId]
            }), undefined, ['*']),
            roles: ['user']
        }

        const userC: User = {
            ...await system.storage.findOne('User', MatchExp.atom({
                key: 'id',
                value: ['=', userCId]
            }), undefined, ['*']),
            roles: ['user']
        }

        // 3. a 发起 sendFriendRequest
        const payload = {
            to: userB,
            request:{
                reason: 'let use make friend'
            }
        }
        const res1 = await controller.callInteraction(sendRequestUUID,  {user: userA, payload})
        expect(res1.error).toBeUndefined()

        const requests1 = await controller.system.storage.find('Request', undefined, undefined, ['*', ['from', {attributeQuery: ["*"]}], ['to', {attributeQuery: ["*"]}]])
        expect(requests1.length).toBe(1)
        expect(requests1[0].to.id).toBe(userBId)
        expect(requests1[0].from.id).toBe(userAId)

        // 4. 错误 C 接受
        const _payload2 = {
            request: requests1[0]
        }


        // should throw
        const _res2 = await controller.callInteraction(approveRequestUUID,  {user: userC, payload: _payload2})
        expect(_res2.error).toBeInstanceOf(AttributeError)
        // FIXME 获取 userAttribute error 信息

        // 4. b 接受
        const payload2 = {
            request: requests1[0]
        }
        const res2 = await controller.callInteraction(approveRequestUUID,  {user: userB, payload: payload2})
        const requests2 = await controller.system.storage.find(
            'Request',
            undefined,
            undefined,
            ['*',
                ['from', {attributeQuery: ["*"]}],
                ['to', {
                    attributeQuery: ["*", ["&", {attributeQuery:["*"]}]]
                }]
            ]
        )
        expect(requests2.length).toBe(1)
        expect(requests2[0].approved).toBeTruthy()
        expect(requests2[0].rejected).toBeFalsy()
    })
})