import {Controller} from "../Controller";
import {KlassInstance, Klass} from "@shared/createClass";
import {Entity, Property, Relation} from "@shared/entity/Entity";
import {RecordMutationEvent} from "../System";
import {ComputedData} from "@shared/IncrementalComputation";
import {MatchExp} from '@storage/erstorage/MatchExp'



export type DataContext = {
    host?: KlassInstance<typeof Entity, false>| KlassInstance<typeof Relation, false>
    id: KlassInstance<typeof Entity, false>| KlassInstance<typeof Relation, false>| KlassInstance<typeof Property, false>|string
}


export class ComputedDataHandle {
    public static  Handles: Map<Klass<any>,  typeof ComputedDataHandle> = new Map()
    computedDataType: 'global' | 'entity' | 'relation' | 'property'
    userComputeEffect: (mutationEvent: any, mutationEvents: any) => any = () => true
    userFullCompute: (...args: any[]) => Promise<any> = () => Promise.resolve(true)
    public recordName?: string
    public propertyName?: string
    public stateName?: string
    constructor(public controller: Controller , public computedData: KlassInstance<typeof ComputedData, false> , public dataContext:  DataContext) {
        this.computedDataType = (!dataContext.host && typeof dataContext.id === 'string' )?
            'global' :
            dataContext.id instanceof Entity ?
                'entity' :
                dataContext.id instanceof Relation ?
                    'relation' :
                    'property'

        if (this.computedDataType === 'property') {
            this.recordName = (this.dataContext.host as KlassInstance<typeof Entity, false>).name
            this.propertyName = (this.dataContext.id as KlassInstance<typeof Property, false>).name
        } else if (this.computedDataType === 'global') {
            this.stateName = this.dataContext.id as string
        }

        this.setupSchema()
    }
    setupSchema() {
        // 用来增加/修改 schema 的
    }
    async setupStates() {
        // 用来增加/修改 states 的。因为有的数据可能要等全局数据初始化完毕才能初始化。
    }
    async setupInitialValue() {
        // 如果是属于整个系统的数据，那么要设置初始值
        if (this.computedDataType === 'global') {
            await this.updateState(true, this.getDefaultValue())
        }
    }
    // 被继承，作为重新计算/增量更新的入口
    addEventListener() {
        this.controller.system.storage.listen(async (mutationEvents) => {
            for(let mutationEvent of mutationEvents){
                // 如果数据是 property，那么创建  host record 的时候要剔重初始数据
                if (this.computedDataType === 'property' && mutationEvent.type === 'create' && mutationEvent.recordName === this.dataContext.host!.name ) {
                    await this.insertDefaultPropertyValue(mutationEvent.record)
                }

                // 算出哪些数据受影响。如果是全局的数据，返回 true 就行了。
                const effect = await this.computeEffect(mutationEvent, mutationEvents)
                if (effect) {
                    await this.recompute(effect, mutationEvent, mutationEvents)
                }
            }
        })
    }
    parseComputeEffectFunction(stringContent: string) {
        const body = new Function('sourceData', `return (${stringContent})(sourceData)`)

        return (sourceData: DataContext[]) => {
            return body(sourceData)
        }
    }
    parseFullComputeFunction(stringContent: string) {
        const body = new Function('sourceData', `return (${stringContent})(sourceData)`)

        return (sourceData: DataContext[]) => {
            return body(sourceData)
        }
    }
    // parse 用户的 function 等。
    parseComputedData(){
        this.userComputeEffect = this.parseComputeEffectFunction(this.computedData.computeEffect!)
        this.userFullCompute = this.parseFullComputeFunction(this.computedData.computation!)
    }
    // 生成初始值额
    getDefaultValue(newRecordId?: any): any{
        if (this.computedDataType === 'global') {
            return this.userFullCompute()
        } else if (this.computedDataType === 'property'){
            return this.userFullCompute(newRecordId)
        }
    }
    insertDefaultPropertyValue(newRecord: any) {
        const defaultValue = this.getDefaultValue(newRecord.id)
        const match = MatchExp.atom({key: 'id', value: ['=', newRecord.id]})
        return this.controller.system.storage.update(this.recordName!, match, {[this.propertyName!]: defaultValue})
    }
    computeEffect(mutationEvent: RecordMutationEvent, mutationEvents: RecordMutationEvent[]) {
        // 如果计算含义不明，那么直接由 用户代码 提示，computedData 里面需要有 computeEffect
        // 如果非常明确，例如 count relation，那么用户只需要声明 count 什么 relation 就够了，我们自然能更具上下文知道它影响哪个。

        // 返回受影响的信息，如果当前是实体的某个属性，那么就是 ids. 如果是全局的，那么就是 true
        return this.userComputeEffect(mutationEvent, mutationEvents)
    }
    async recompute(effect: any, mutationEvent: RecordMutationEvent, mutationEvents: RecordMutationEvent[]) {
        if (this.computedDataType === 'global' || this.computedDataType === 'entity' || this.computedDataType === 'relation') {
            const newValue = await this.userFullCompute()
            await this.updateState(true, newValue)
        } else if (this.computedDataType === 'property'){
            const affectedRecordIds = Array.isArray(effect) ? effect : [effect]
            for(let id of affectedRecordIds){
                const newValue = await this.userFullCompute(id)
                await this.updateState(id, newValue)
            }
        }
    }
    async updateState(affectedId: true|string, newValue: any){
        // 如果是全局状态，那么更新全局状态的值，如果是 property数据，那么 更新 property 的值
        if (this.computedDataType === 'global') {
            await this.controller.system.storage.set('state', this.dataContext.id as string, newValue)
        } else if (this.computedDataType === 'property'){
            const match = MatchExp.atom({key: 'id', value: ['=', affectedId]})
            await this.controller.system.storage.update(this.recordName!, match, {[this.propertyName!]: newValue})
        } else if (this.computedDataType === 'entity' || this.computedDataType === 'relation') {
            // 删除所有值，重新生成
            await this.controller.system.storage.delete(this.recordName!, undefined)
            for(let newRecord  of newValue as any[]) {
                await this.controller.system.storage.create(this.recordName!, newRecord)
            }
        }
    }
}