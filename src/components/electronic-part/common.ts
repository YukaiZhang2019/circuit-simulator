import { Component, Vue, Prop, Watch, Inject } from 'vue-property-decorator';
import { clone, isString } from 'src/lib/utils';
import { MutationName as Mutation } from 'src/vuex';

import { LineType } from '../electronic-line/helper';
import { ContextData } from '../drawing-main';
import { default as Electronics, PartType } from './parts';

import PartComponent from 'src/components/electronic-part';
import LineComponent from 'src/components/electronic-line';

/** 每类器件的最大数量 */
const maxNumber = 50;
/** 全局器件 id 占位表 */
const mapHash: AnyObject<boolean> = {};

export const PartComponents: ElectronicCore[] = [];
export const LineComponents: ElectronicCore[] = [];

/**
 * 生成器件或者导线的新 ID
 * @param {string} id
 * @returns {string}
 */
export function createId(id: string): string {
    const pre = id.match(/^([^_]+)(_[^_]+)?$/)!;
    const max = (pre[1] === 'line') ? Infinity : maxNumber;

    for (let i = 1; i <= max; i++) {
        const ans = `${pre[1]}_${i}`;
        if (!mapHash[ans]) {
            return ans;
        }
    }

    throw new Error(`(electronic) The maximum number of Devices is ${maxNumber}.`);
}

/** 标记输入符号到全局 */
export function markId(id: string) {
    mapHash[id] = true;
}

/** 从表中删除全局标记 */
export function deleteId(id: string) {
    if (mapHash[id]) {
        delete mapHash[id];
        return true;
    }
    else {
        return false;
    }
}

/** 是否含有器件标记 */
export function hasId(id: string) {
    return Boolean(mapHash[id]);
}

/** 搜索器件组件 */
export function findPartComponent(value: string | HTMLElement): PartComponent {
    const prop = isString(value) ? 'id' : '$el';
    const valueMatch = isString(value)
        ? (value.match(/[a-zA-Z]+_[a-zA-Z0-9]+/)!)[0]
        : value;

    const result = PartComponents.find((part) => part[prop] === valueMatch);

    if (!result) {
        throw new Error(`Can not find this part: ${isString(value) ? value : value.id}`);
    }

    return result as PartComponent;
}
/** 搜索导线组件 */
export function  findLineComponent(value: string | HTMLElement): LineComponent {
    const prop = (isString(value)) ? 'id' : '$el';
    const result = LineComponents.find((line) => line[prop] === value);

    if (!result) {
        throw new Error(`Can not find this line: ${isString(value) ? value : value.id}`);
    }

    return result as LineComponent;
}

/** 元件数据基类 */
@Component
export default class ElectronicCore extends Vue {
    /** 器件原始数据 */
    @Prop({ type: Object, default: () => ({}) })
    readonly value!: object;

    /** 元件 ID 编号 */
    id = '';
    /** 元件的连接表 */
    connect: string[] = [];
    /**
     * 元件类型
     *  - 器件初始化属性占位，统一初始化为导线
     *  - 在器件调用 created 钩子时再进行纠正
     */
    readonly type: PartType | LineType = LineType.Line;

    /** 图纸相关状态 */
    @Inject({ default: {}})
    readonly mapStatus!: ContextData['mapStatus'];
    /** 设置图纸事件 */
    @Inject({ default: () => {} })
    readonly createDrawEvent!: ContextData['createDrawEvent'];
    /** 设置当前选中的器件 */
    @Inject({ default: () => {} })
    readonly setSelectDevices!: ContextData['setSelectDevices'];

    @Watch('value', { immediate: true })
    update(val: object) {
        Object.assign(this, clone(val));
    }

    @Watch('id')
    changeId(newId: string, oldId: string) {
        markId(newId);
        deleteId(oldId);
    }

    created() {
        this.id = this.id || createId(
            this.type === LineType.Line
                ? 'line'
                : Electronics[this.type].pre,
        );

        markId(this.id);

        this.type === LineType.Line
            ? LineComponents.push(this)
            : PartComponents.push(this);
    }

    beforeDestroy() {
        deleteId(this.id);

        this.type === LineType.Line
            ? LineComponents.delete((line) => line.id === this.id)
            : PartComponents.delete((part) => part.id === this.id);
    }

    deleteSelf() {
        this.$store.commit(Mutation.DELETE_ELEC, this.id);
    }
}
