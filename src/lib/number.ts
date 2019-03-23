import { isArray } from './utils';

/**
 * 简写数字正则匹配
 *
 * @example
 *   1G = 1e9
 *   1M = 1e6
 *   1k = 1e3
 *   1m = 1e-3
 *   1u = 1e-6
 *   1n = 1e-9
 *   1p = 1e-12
 */
export const numberMatcher = /^\d+(?:\.\d+)?$|^\d+?(?:\.\d+)?[eE]-?\d+$|^\d+(?:\.\d+)?[puμnmkMG]$/;

/** 简写数字编译 */
export function numberParser(notation: string) {
    if (!numberMatcher.test(notation)) {
        return NaN;
    }
    else if (/[eE]/.test(notation)) {
        const [base, power] = notation.split(/[eE]/);
        return Number(base) * Math.pow(10, Number(power));
    }
    else if (/[puμnmkMG]$/.test(notation)) {
        const exp = { p: -12, u: -9, μ: -9, n: -6, m: -3, k: 3, M: 6, G: 9 };
        const power = exp[notation[notation.length - 1]] as number;
        const base = notation.substring(0, notation.length - 1);

        return Number(base) * Math.pow(10, power);
    }
    else {
        return Number(notation);
    }
}

/** 简写数字单位 */
export type NumberRank = 'G' | 'M' | 'k' | '' | 'm' | 'μ' | 'u' | 'n' | 'p';

/** 简写数字快捷选项下拉列表 */
export type SelectList = {
    label: string;
    value: string;
}[];

/** 简写数字对应的中文 */
const unitMap = {
    'p': '皮',
    'n': '纳',
    'u': '微',
    'm': '毫',
    '': '',
    'k': '千',
    'M': '兆',
    'G': '吉',
};

/** 生成简写数字单位快捷选择列表选项 */
export function createSelectList(label: string, isChinese?: boolean): SelectList;
export function createSelectList(units: NumberRank[], label: string, isChinese?: boolean): SelectList;
export function createSelectList(units: NumberRank[] | string, label?: string | boolean, isChinese = false) {
    // 未输入单位列表
    if (!isArray(units)) {
        isChinese = Boolean(label);
        label = units;
        units = ['G', 'M', 'k', '', 'm', 'u', 'n', 'p'];
    }

    const unitFilted: Exclude<NumberRank, 'μ'>[] = units.map((unit) => unit === 'μ' ? 'u' : unit);

    return unitFilted.map((unit) => ({
        label: isChinese
            ? `${unitMap[unit]}${label}`
            : `${unit}${label}`,
        value: unit,
    }));
}

/** 解析输入数字 */
export function splitNumber(str: string) {
    const matcher = /^([\d.]+)([GMkmunp]?)$/;
    const match = matcher.exec(str);

    if (!match) {
        throw new Error(`Number Error: ${str}`);
    }

    return {
        number: match[1],
        rank: (match[2] || '') as NumberRank,
    };
}

/**
 * 求数字的数量级
 *
 * @returns {number}
 */
export function rank(value: number) {
    if (Number.isNaN(value)) {
        throw new Error('(number) cannot run .rank() on NaN');
    }

    return Math.floor(Math.log10(value));
}

/**
 * 按照有效数字的位数进行四舍五入。
 *  - 默认 6 位有效数字 [bits=6]
 *
 * @param {number} [bits=6]
 * @returns {number}
 */
export function toRound(origin: number, bits: number = 6) {
    if (Number.isNaN(origin)) {
        throw new Error('(number) cannot run .toRound() on NaN');
    }

    const value = Math.abs(origin);
    const toInt = Math.floor(Math.log10(value)) - bits + 1;
    const transform = 10 ** toInt;
    // round 一定是整数
    const round = String(Math.round(value / transform));
    // 原始数据符号
    const sign = origin < 0 ? '-' : '';

    // 插入小数点
    let str = '';
    if (toInt > 0) {
        str = round + '0'.repeat(toInt);
    }
    else if (-toInt >= bits) {
        str = `0.${'0'.repeat(-toInt - bits)}${round}`;
    }
    else {
        str = `${round.slice(0, toInt)}.${round.slice(toInt)}`;
    }

    return Number.parseFloat(sign + str);
}
