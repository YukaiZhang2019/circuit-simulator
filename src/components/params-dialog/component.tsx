import './component.styl';

import { CreateElement } from 'vue';
import { Component, Vue, Watch } from 'vue-property-decorator';
import InputVerifiable, { ValidateRule } from 'src/components/input-verifiable';

import vuex from 'src/vuex';
import { $P } from 'src/lib/point';
import { delay } from 'src/lib/utils';
import { ParmasDescription } from 'src/components/electronic-part';
import * as assert from 'src/lib/assertion';

const passive = supportsPassive ? { passive: true } : false;

/** 参数描述接口 */
export interface Params extends Omit<ParmasDescription, 'default' | 'vision'> {
    value: string;
}

@Component({
    components: {
        InputVerifiable,
    },
})
export default class ParamsDialog extends Vue {
    /** 指向的器件编号 */
    id: string = '';
    /** 参数列表 */
    params: Params[] = [];
    /** 是否显示 */
    vision = false;
    /** ID 的说明文本 */
    idLabel = '编号：';
    /** 是否初始化完成标志 */
    isMounted = false;

    /** 指向的器件坐标 */
    position = $P();
    /** 对话框偏移量 */
    bias = $P();
    /** 对话框缩放比例 */
    scale = 1;

    /** 中心最小限制 */
    min = 10;

    /** ID 编号验证规则 */
    idRules: ValidateRule[] = [
        {
            required: true,
            message: 'ID 标签不能为空',
        },
        {
            pattern: /[a-zA-Z]+_[a-zA-Z0-9]+/,
            message: 'ID 标签格式错误',
        },
    ];

    /** 参数验证规则 */
    paramsRules: ValidateRule[] = [
        {
            required: true,
            message: '该项不能为空',
        },
        {
            pattern: Number.SCIENTIFIC_COUNT_MATCH,
            message: '参数值格式错误',
        },
    ];

    /** 子组件定义 */
    $refs!: {
        id: InputVerifiable;
        params: InputVerifiable[];
        dialog: HTMLElement;
    };

    /** 用于外部引用的`取消`接口 */
    cancel!: () => void;
    /** 用于外部引用的`确定`接口 */
    confirm!: () => void;

    mounted() {
        // 初始化完成标记置高
        this.isMounted = true;
    }

    @Watch('vision')
    visionHandler(status: boolean) {
        if (status) {
            document.body.addEventListener('keyup', this.keyboardHandler, passive);
            this.$nextTick(() => this.$refs.id.focus());
        }
        else {
            document.body.removeEventListener('keyup', this.keyboardHandler);
        }
    }

    /** 对话框方位 */
    get location() {
        const direction: Array<'top' | 'bottom' | 'left' | 'right'> = [];
        const min = this.min;
        // 对话框当前大小
        const { height, width } = this.boxSize;
        // 屏幕当前大小
        const { scrollHeight: SHeight, scrollWidth: SWidth } = document.body;
        // 侧边栏宽度
        const aside = vuex.getters.isSpace ? 0 : 380;

        // Y 轴方位
        if (this.position[1] < (height + min)) {
            direction.push('bottom');
        }
        else if ((SHeight - this.position[1]) < (height + min)) {
            direction.push('top');
        }

        // X 轴方位
        if (this.position[0] < (width / 2 + min)) {
            direction.push('right');
        }
        else if ((SWidth - this.position[0] - aside) < (width / 2 + min)) {
            direction.push('left');
        }

        // 默认在上方
        if (direction.length === 0) {
            direction.push('top');
        }

        return direction;
    }
    /** 对话框宽高 */
    get boxSize() {
        if (!this.isMounted) {
            return { width: 0, height: 0 };
        }

        // 保存当前样式
        const elStyle = {
            display: this.$el.style.display,
        };
        const dislogStyle = {
            opacity: this.$refs.dialog.style.opacity,
            transition: this.$refs.dialog.style.transition,
            transform: this.$refs.dialog.style.transform,
        };

        this.$el.style.display = 'block';
        this.$refs.dialog.style.opacity = '0';
        this.$refs.dialog.style.transition = '';
        this.$refs.dialog.style.transform = 'scale(1)';

        const len = this.params.length;

        const labelWidth = this.getMaxWidth(
            this.$el.querySelector('.params__label label')!,
            this.params.map((param) => (param.label + '：')).concat([this.idLabel]),
        );
        const unitWidth = this.getMaxWidth(
            this.$el.querySelector('.params__unit span')!,
            this.params.map((param) => param.unit),
        );

        const height = (
            36 +    // header height
            6 +     // header bottom margin
            (len + 1) * 24 + len * 2 +  // body height
            24 +    // footer height
            12 +    // fotter margin
            2       // extra
        );
        const width = (
            100 +   // width of input
            20 +    // padding of body
            6 +     // unit's left margin
            labelWidth +
            unitWidth
        );

        Object.assign(this.$el.style, elStyle);
        Object.assign(this.$refs.dialog.style, dislogStyle);

        return { width, height };
    }
    /** 计算倒三角形状 */
    get triangleStyle(): { [x: string]: string } {
        const len = this.location.length;
        const deg = { bottom: 0, left: 90, top: 180, right: 270 };

        const base = {
            'border-bottom': `${10 * len}px solid ${this.location.includes('bottom') ? '#20A0FF' : '#FFFFFF'}`,
            'border-left': `${6 * len}px solid transparent`,
            'border-right': `${6 * len}px solid transparent`,
            'transform': '',
            'left': '',
            'top': '',
        };

        // 旋转角度
        const avg = this.location.reduce((add, di) => add + deg[di], 0) / len;
        base.transform = this.location.isEqual(['bottom', 'right'])
            ? 'rotate(315deg)'
            : `rotate(${avg}deg)`;

        // 坐标
        if (len === 1) {
            if (/(top|bottom)/.test(this.location[0])) {
                base.left = 'calc(50% - 6px)';
                base.top = (this.location[0] === 'top') ? 'calc(100% - 1px)' : '-10px';
            }
            else {
                base.left = (this.location[0] === 'left') ? 'calc(100% - 1px)' : '-10px';
                base.top = 'calc(50% - 6px)';
            }
        }
        else {
            base.top = (this.location[0] === 'top') ? 'calc(100% - 11px)' : '-9px';
            base.left = (this.location[1] === 'left') ? 'calc(100% - 13px)' : '-10px';
        }

        return base;
    }

    keyboardHandler(event: KeyboardEvent) {
        if (!this.vision) {
            return;
        }

        if (event.key === 'Escape') {
            this.beforeCancel();
        }
        else if (event.key === 'Enter') {
            this.beforeConfirm();
        }
    }

    /** 计算待选文字中最大的长度 */
    getMaxWidth(dom: Element, texts: string[]): number {
        const originText = dom.textContent;
        const widths = texts.map((text) => {
            dom.textContent = text;
            return dom.getBoundingClientRect().width;
        });

        dom.textContent = originText;

        return Math.max(...widths);
    }
    /** 根据对话框的缩放比例，设置对话框偏移量 */
    setBoxStyle(scale: number): void {
        const min = 20, { height, width } = this.boxSize;

        // 设置缩放比例
        this.scale = scale;

        // X 轴计算
        if (this.location.includes('left')) {
            this.bias[0] = - width * (1 + scale) / 2 - min;
        }
        else if (this.location.includes('right')) {
            this.bias[0] = - width * (1 - scale) / 2 + min;
        }
        else {
            this.bias[0] = - width / 2;
        }

        // Y 轴计算
        if (this.location.includes('top')) {
            this.bias[1] = - height * (1 + scale) / 2 - min;
        }
        else if (this.location.includes('bottom')) {
            this.bias[1] = - height * (1 - scale) / 2 + min;
        }
        else {
            this.bias[1] = - height / 2;
        }
    }

    async enter(el: Element, done: () => void) {
        this.setBoxStyle(0.2);
        await delay(0);

        this.setBoxStyle(1);
        await delay(300);

        done();
    }
    async leave(el: Element, done: () => void) {
        this.setBoxStyle(1);
        await delay(0);

        this.setBoxStyle(0.2);
        await delay(300);

        done();
    }

    beforeCancel() {
        // 清除所有错误提示
        this.$refs.id.clearError();
        this.$refs.params && this.$refs.params.forEach((input) => input.clearError());

        // 运行取消
        this.cancel();
    }
    beforeConfirm() {
        if (
            this.$refs.id.validate() &&
            this.$refs.params.every((comp) => comp.validate())
        ) {
            this.confirm();
        }
    }

    private render(h: CreateElement) {
        return <transition name='fade' onEnter={this.enter} onLeave={this.leave}>
            <section class='params-dialog__wrapper' v-show={this.vision}>
                <div
                    ref='dialog'
                    class='params-dialog'
                    style={{
                        left: `${this.position[0]}px`,
                        top: `${this.position[1]}px`,
                        transform: `translate(${this.bias[0]}px, ${this.bias[1]}px) scale(${this.scale})`,
                    }}>
                    <header>参数设置</header>
                    <article>
                        <section class='params__label'>
                            <label>{this.idLabel}</label>
                            {this.params.map((param, i) =>
                                <label key={i}>{`${param.label}：`}</label>,
                            )}
                        </section>
                        <section class='params__input'>
                            <input-verifiable
                                ref='id'
                                value={this.id}
                                rules={this.idRules}
                                placeholder='请输入编号'
                                onInput={(val: string) => this.id = val}>
                            </input-verifiable>
                            {this.params.map((param, i) =>
                                <input-verifiable
                                    key={i}
                                    value={param.value}
                                    rules={this.paramsRules}
                                    placeholder='请输入参数'
                                    onInput={(val: string) => param.value = val}>
                                </input-verifiable>,
                            )}
                        </section>
                        <section class='params__unit'>
                            <span>&nbsp;</span>
                            {this.params.map((param, i) =>
                                <span key={i}>{param.unit}</span>,
                            )}
                        </section>
                    </article>
                    <footer>
                        <button class='cancel' onClick={this.beforeCancel}>取消</button>
                        <button class='confirm' onClick={this.beforeConfirm}>确定</button>
                    </footer>
                    <i class='triangle-icon' style={this.triangleStyle}></i>
                </div>
            </section>
        </transition>;
    }
}