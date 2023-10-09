import {AttributeInfo} from "./AttributeInfo.ts";
import {EntityToTableMap, RecordAttribute, RecordMapItem} from "./EntityToTableMap.ts";
import {flatten} from "./util.ts";

export class RecordInfo {
    data: RecordMapItem

    constructor(public name: string, public map: EntityToTableMap) {
        this.data = this.map.data.records[name]!
    }

    get combinedRecords() {
        return this.strictRecordAttributes.filter(info => {
            return info.isMergedWithParent()
        })
    }

    get table() {
        return this.map.getRecordTable(this.name)
    }

    get idField() {
        return this.data.attributes.id.field
    }

    get sameRowFields(): string[] {
        // 自身的value 字段
        const valueFields = this.valueAttributes.map(info => info.field!)

        // 和自己合并的关系字段
        const linkFields = this.strictRecordAttributes.filter(info => {
            return info.isLinkMergedWithParent()
        }).map(info => {
            return info.getLinkInfo().recordInfo.sameRowFields
        })

        // 当自身是一个关系 record 时，它的 source/target 虽然是 record attribute，但字段是由我来管辖的。
        const managedRecordAttributeFields = this.managedRecordAttributes.map(info => {
            return info.linkField!
        })

        const relianceFields = this.sameTableReliance.map(info => {
            return info.getRecordInfo().sameRowFields
        })


        return valueFields.concat(...linkFields, ...managedRecordAttributeFields, ...relianceFields)
    }

    get allFields(): string[] {
        return Object.values(this.data.attributes).map(a => a.field!).filter(x => x)
    }

    // 当自身是一个关系 record 时，它的 source/target 虽然是 record attribute，但字段是由我来管辖的。
    get managedRecordAttributes() {
        return Object.keys(this.data.attributes).filter(attribute => {
            const attributeData = this.data.attributes[attribute] as  RecordAttribute
            return attributeData.isRecord && attributeData.field
        }).map(attribute => {
            return new AttributeInfo(this.name, attribute, this.map)
        })
    }

    get strictRecordAttributes() {
        return Object.keys(this.data.attributes).filter(attribute => {
            const attributeData = this.data.attributes[attribute] as  RecordAttribute
            // CAUTION linkRecord 中有 field 就不能算了。比如 source/target
            return attributeData.isRecord && !attributeData.field
        }).map(attribute => {
            return new AttributeInfo(this.name, attribute, this.map)
        })
    }
    get differentTableRecordAttributes() {
        // CAUTION 特别注意不能用 table 判断，因为可能是同一个实体的关系，这种情况 table 会相等，但含义并不是合表
        // return this.strictRecordAttributes.filter(info => info.table !== this.table)
        return this.strictRecordAttributes.filter(info => {
            return !(info.isMergedWithParent() || info.isLinkMergedWithParent())
        })
    }


    get reliance(): AttributeInfo[] {
        return Object.keys(this.data.attributes).filter(attribute => {
            return (this.data.attributes[attribute] as RecordAttribute).isReliance
        }).map(attribute => {
            return new AttributeInfo(this.name, attribute, this.map)
        })
    }

    get notReliantCombined() :AttributeInfo[] {
        return this.combinedRecords.filter(info => {
            return !info.isReliance
        })
    }

    get differentTableReliance(): AttributeInfo[] {
        return this.reliance.filter(info => {
            return info.table !== this.table
        })
    }

    get sameTableReliance(): AttributeInfo[] {
        return this.reliance.filter(info => {
            return info.table === this.table
        })
    }

    get valueAttributes() {
        return Object.entries(this.data.attributes).filter(([, attribute]) => {
            return !(attribute as RecordAttribute).isRecord
        }).map(([attributeName]) => {
            return new AttributeInfo(this.name, attributeName, this.map)
        })
    }

    getAttributeInfo(attribute: string) {
        return new AttributeInfo(this.name, attribute, this.map)
    }
}