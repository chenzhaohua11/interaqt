import {Entity, Property, PropertyTypes, Relation} from "../../../shared/entity/Entity";
import {KlassInstance, removeAllInstance} from "../../../shared/createClass";

// @ts-ignore
export function createCommonData(): { entities: KlassInstance<typeof Entity, false>[], relations: KlassInstance<typeof Relation, false>[] } {

    const userEntity = Entity.create({
        name: 'User',
        properties: [
            Property.create({ name: 'name', type: PropertyTypes.String }),
            Property.create({ name: 'age', type: PropertyTypes.Number })
        ]
    })


    const profileEntity = Entity.create({
        name: 'Profile',
        properties: [Property.create({ name: 'title', type: PropertyTypes.String })]
    })

    const fileEntity = Entity.create({
        name: 'File',
        properties: [Property.create({ name: 'fileName', type: PropertyTypes.String })]
    })


    Relation.create({
        entity1: fileEntity,
        targetName1: 'owner',
        entity2: userEntity,
        targetName2: 'file',
        relType: 'n:1',
        properties: [
            Property.create({ name: 'viewed', type: PropertyTypes.Number })
        ]
    })

    Relation.create({
        entity1: profileEntity,
        targetName1: 'owner',
        entity2: userEntity,
        targetName2: 'profile',
        relType: '1:1',
        properties: [
            Property.create({ name: 'viewed', type: PropertyTypes.Number })
        ]
    })


    Relation.create({
        entity1: userEntity,
        targetName1: 'leader',
        entity2: userEntity,
        targetName2: 'member',
        relType: 'n:1'
    })




    const friendRelation = Relation.create({
        entity1: userEntity,
        targetName1: 'friends',
        entity2: userEntity,
        targetName2: 'friends',
        relType: 'n:n',
        properties: [
            Property.create({ name: 'level', type: PropertyTypes.Number })
        ]
    })



    const itemEntity = Entity.create({
        name: 'Item',
        properties: [Property.create({ name: 'itemName', type: PropertyTypes.String })]
    })

    Relation.create({
        entity1: userEntity,
        targetName1: 'item',
        entity2: itemEntity,
        targetName2: 'owner',
        relType: '1:1',
        isTargetReliance: true
    })

    const teamEntity = Entity.create({
        name: 'Team',
        properties: [Property.create({ name: 'teamName', type: PropertyTypes.String })]
    })


    const locEntity = Entity.create({
        name: 'Location',
        properties: [
            Property.create({ name: 'name', type: PropertyTypes.String })
        ]
    })

    const matchEntity = Entity.create({
        name: 'Match',
        properties: [
            Property.create({ name: 'name', type: PropertyTypes.String })
        ]
    })

    const teamRelation = Relation.create({
        entity1: userEntity,
        targetName1: 'teams',
        entity2: teamEntity,
        targetName2: 'members',
        relType: 'n:n',
        properties: [
            Property.create({ name: 'role', type: PropertyTypes.String}),
        ]
    })

    Relation.create({
        entity1: teamRelation,
        targetName1: 'base',
        entity2: locEntity,
        targetName2: 'belong',
        relType: '1:1',
    })

    Relation.create({
        entity1: teamRelation,
        targetName1: 'matches',
        entity2: matchEntity,
        targetName2: 'host',
        relType: '1:n',
    })

    Relation.create({
        entity1: teamRelation,
        targetName1: 'participates',
        entity2: matchEntity,
        targetName2: 'participants',
        relType: 'n:n',
    })


    const powerEntity = Entity.create({
        name: 'Power',
        properties: [
            Property.create({ name: 'powerName', type: PropertyTypes.String })
        ]
    })

    Relation.create({
        entity1: userEntity,
        targetName1: 'powers',
        entity2: powerEntity,
        targetName2: 'owner',
        relType: '1:n',
        isTargetReliance: true
    })


    //  FIXME Group 这个名字不行？？？
    // department
    const departmentEntity = Entity.create({
        name: 'Department',
        properties: [
            Property.create({ name: 'name', type: PropertyTypes.String })
        ]
    })

    // group and group relation
    Relation.create({
        entity1: departmentEntity,
        targetName1: 'parent',
        entity2: departmentEntity,
        targetName2: 'children',
        relType: 'n:1',
    })

    // // group and user relation
    // Relation.create({
    //     entity1: groupEntity,
    //     targetName1: 'members',
    //     entity2: userEntity,
    //     targetName2: 'groups',
    //     relType: 'n:n',
    //     properties: [
    //         Property.create({ name: 'role', type: PropertyTypes.String })
    //     ]
    // })


    const entities = [...Entity.instances] as KlassInstance<typeof Entity, false>[]
    const relations = [...Relation.instances] as KlassInstance<typeof Relation, false>[]

    removeAllInstance()

    return {
        entities,
        relations
    }

}