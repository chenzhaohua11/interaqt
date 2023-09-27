import {MapData} from "../../erstorage/EntityToTableMap";

export const entityToTableMapData: MapData = {
    entities: {
        User: {
            table: 'User_Profile',
            attributes: {
                name: {
                    type: 'string',
                    fieldType: 'text',
                    field: 'user_name'
                },
                age: {
                    type: 'number',
                    fieldType: 'int',
                    field: 'user_age'
                },
                profile: {
                    isEntity: true,
                    relType: ['1', '1'],
                    entityName: 'Profile',
                    relationName: 'User_profile_user_Profile',
                    table: 'User_Profile',
                    field: '',
                },
                leader: {
                    isEntity: true,
                    relType: ['n', '1'],
                    entityName: 'User',
                    relationName: 'User_leader_member_User',
                    table: 'User_Profile',
                    field: 'User_leader'
                },
                friends: {
                    isEntity: true,
                    relType: ['n', 'n'],
                    entityName: 'User',
                    relationName: 'User_friends_friends_User',
                    table: 'User_Profile',
                    field: ''
                },
                item: {
                    isEntity: true,
                    relType: ['1', '1'],
                    entityName: 'LargeItem',
                    relationName: 'User_item_owner_LargeItem',
                    table: 'LargeItem',
                    field: ''
                }
            }
        },
        Profile: {
            table: 'User_Profile',
            attributes: {
                title: {
                    type: 'string',
                    fieldType: 'text',
                    field: 'profile_title'
                },
                owner: {
                    isEntity: true,
                    relType: ['1', '1'],
                    entityName: 'User',
                    relationName: 'User_profile_user_Profile',
                    table: 'User_Profile',
                    field: ''
                }
            }
        },
        // 也是 1:1 关系，但是不合表的情况
        LargeItem: {
            table: 'LargeItem',
            attributes: {
                serialNumber: {
                    type: 'number',
                    fieldType: 'bigInt',
                    field: 'serialNumber'
                },
                owner: {
                    isEntity: true,
                    relType: ['1', '1'],
                    entityName: 'User',
                    relationName: 'User_item_owner_LargeItem',
                    table: 'LargeItem',
                    field: 'LargeItem_owner'
                }
            }
        }
    },
    relations: {
        User_profile_user_Profile: {
            attributes: {},
            sourceEntity: 'User',
            sourceAttribute: 'profile',
            targetEntity: 'Profile',
            targetAttribute: 'owner',
            relType: ['1', '1'],
            table: 'User_Profile',  // 1:1 三表合一,
            mergedTo: 'source',
            sourceField: 'User_profile',
            targetField: 'Profile_owner',
        },
        User_leader_member_User: {
            attributes: {},
            sourceEntity: 'User',
            sourceAttribute: 'leader',
            targetEntity: 'User',
            targetAttribute: 'member',
            relType: ['n', '1'],
            table: 'User_Profile',  // n:1 往 n 方向合表
            mergedTo: 'source',
            sourceField: 'User_leader',
            targetField: '$target',
        },
        User_friends_friends_User: {
            attributes: {},
            sourceEntity: 'User',
            sourceAttribute: 'friends',
            targetEntity: 'User',
            targetAttribute: 'friends',
            relType: ['n', 'n'],
            table: 'User_friends_friends_User',  // n:n 关系，表是独立的
            sourceField: '$source',
            targetField: '$target',
        },
        User_item_owner_LargeItem: {
            attributes: {},
            sourceEntity: 'User',
            sourceAttribute: 'item',
            targetEntity: 'LargeItem',
            targetAttribute: 'owner',
            relType: ['1', '1'],
            table: 'LargeItem',  // 特殊的 1:1 关系，表往 target 合并了
            mergedTo: 'target',
            sourceField: '$source',
            targetField: 'LargeItem_owner',
        }
    }
}

