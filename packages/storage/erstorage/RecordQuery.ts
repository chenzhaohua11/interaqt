import {MatchExp, MatchExpressionData} from "./MatchExp.ts";
import {AttributeQuery, AttributeQueryData} from "./AttributeQuery";
import {Modifier, ModifierData} from "./Modifier";
import {EntityToTableMap} from "./EntityToTableMap";
import {AttributeInfo} from "./AttributeInfo.ts";
import {assert} from "../util.ts";

export type RecordQueryData = {
    matchExpression?: MatchExpressionData,
    attributeQuery?: AttributeQueryData,
    modifier?: ModifierData
}


export class RecordQuery {
    static create(recordName: string, map: EntityToTableMap, data: RecordQueryData, contextRootEntity?: string, parentRecord?:string, attributeName?:string, onlyRelationData?: boolean, allowNull = false) {
        // CAUTION 因为合表后可能用关联数据匹配到行。
        const inputMatch = new MatchExp(recordName, map, data.matchExpression, contextRootEntity)
        const matchExpression = allowNull ? inputMatch: inputMatch.and({
            key: 'id',
            value: ['not', null]
        })
        return new RecordQuery(
            recordName,
            map,
            matchExpression,
            // new MatchExpression(recordName, map, data.matchExpression, contextRootEntity),
            new AttributeQuery(recordName, map, data.attributeQuery || [], parentRecord, attributeName),
            new Modifier(recordName, map, data.modifier!),
            contextRootEntity,
            parentRecord,
            attributeName,
            onlyRelationData
        )
    }
    constructor(
        public recordName: string,
        public map: EntityToTableMap,
        public matchExpression: MatchExp,
        public attributeQuery: AttributeQuery,
        public modifier: Modifier,
        public contextRootEntity?: string,
        public parentRecord?:string,
        public attributeName?:string,
        public onlyRelationData?:boolean
    ) {}
    getData(): RecordQueryData {
        return {
            matchExpression: this.matchExpression.data,
            attributeQuery: this.attributeQuery.data,
            modifier: this.modifier.data
        }
    }
}


export class RecordQueryTree {
    public fields: string[] =[]
    public records: {[k:string]: RecordQueryTree}
    public info? :AttributeInfo
    // 父节点和自己这个几点 link 上的 query

    constructor(
        public recordName: string,
        public map: EntityToTableMap,
        public parentRecord?:string,
        public attributeName?: string,
        public data?: {fields: string[], records: {[k:string]: RecordQueryTree}},
        public parent?: RecordQueryTree,
        public parentLinkQueryTree? : RecordQueryTree
    ) {
        assert(!!recordName, 'recordName cannot be empty')
        this.fields = data?.fields || []
        this.records = data?.records || {}
        if (parentRecord) {
            this.info = this.map.getInfo(this.parentRecord!, this.attributeName!)
        }
    }

    addField(namePath:string[]) {
        const [name, ...rest] = namePath
        if (namePath.length === 1) {
            this.fields.push(name)
        } else if(name === LINK_SYMBOL){
            if (!this.parentLinkQueryTree) {
                this.parentLinkQueryTree = new RecordQueryTree(this.info!.linkName, this.map)
            }

            this.parentLinkQueryTree.addField(rest)
        } else {
            const info = this.map.getInfo(this.recordName, name)
            if (!this.records[name]) this.records[name] = new RecordQueryTree(info.recordName, this.map, this.recordName, name, undefined, this)
            this.records[name].addField(rest)
        }
    }
    addRecord(namePath: string[], subTree?: RecordQueryTree) {
        const [name, ...rest] = namePath
        if (namePath.length === 1) {
            if (name === LINK_SYMBOL) {
                if (!this.parentLinkQueryTree) {
                    this.parentLinkQueryTree = new RecordQueryTree(this.info!.linkName, this.map)
                }

                if (subTree) this.parentLinkQueryTree = this.parentLinkQueryTree.merge(subTree)
            } else {
                const info = this.map.getInfo(this.recordName, name)
                const newTree = subTree || new RecordQueryTree(info.recordName, this.map, this.recordName, name, undefined, this)
                this.records[name] = this.records[name] ? this.records[name].merge(newTree) : newTree
            }
        } else if(name === LINK_SYMBOL) {
            if (!this.parentLinkQueryTree) {
                this.parentLinkQueryTree = new RecordQueryTree(this.info!.linkName, this.map)
            }
            this.parentLinkQueryTree.addRecord(rest, subTree)
        } else {
            const info = this.map.getInfo(this.recordName, name)
            this.records[name] = new RecordQueryTree(info.recordName, this.map, this.recordName, name, undefined, this)
            this.records[name].addRecord(rest, subTree)
        }
    }
    forEachRecords(handle: (t:RecordQueryTree) => any) {
        Object.values(this.records).forEach(r => handle(r))
    }
    onlyIdField() {
        return this.fields.length === 1 && this.fields[0] === 'id'
    }
    merge(otherTree:RecordQueryTree) : RecordQueryTree{
        const fields = Array.from(new Set([...this.fields, ...otherTree.fields]))
        const records: {[k:string]: RecordQueryTree} = {}
        const keys = Array.from(new Set([...Object.keys(this.records), ...Object.keys(otherTree.records)]))

        keys.forEach(key => {
            if (this.records[key] && otherTree.records[key]) {
                records[key] = this.records[key].merge(otherTree.records[key])
            } else if (this.records[key]) {
                records[key] = this.records[key]
            } else {
                records[key] = otherTree.records[key]
            }
        })

        let parentLinkQueryTree
        if (this.parentLinkQueryTree && otherTree.parentLinkQueryTree) {
            parentLinkQueryTree = this.parentLinkQueryTree.merge(otherTree.parentLinkQueryTree)
        } else {
            parentLinkQueryTree = this.parentLinkQueryTree || otherTree.parentLinkQueryTree
        }

        return new RecordQueryTree(this.recordName, this.map, this.parentRecord, this.attributeName, { fields, records }, this.parent, parentLinkQueryTree)
    }
    getData() {
        const result: {[k:string]: any} = {
            __fields: this.fields
        }


        this.forEachRecords(record => {
            result[record.attributeName!] = record.getData()
        })

        if (this.parentLinkQueryTree) {
            result[LINK_SYMBOL] = this.parentLinkQueryTree.getData()
        }
        return result
    }

}

export const LINK_SYMBOL = '&'
export const ALL_ATTR_SYMBOL = '*'

// export type RecordQueryTree = {
//     _fields?: string[],
//     [k: string]: RecordQueryTree
// }